// app/public/routes/wompi-webhook.js
import express from "express";
import crypto from "crypto";
import database from "../../database.js";

const router = express.Router();

// Wompi envía JSON
router.post("/wompi/webhook", express.json({ type: "*/*" }), async (req, res) => {
  try {
    const event = req.body; // { event, data, signature: { properties, checksum }, timestamp }
    const receivedChecksum = event?.signature?.checksum;
    const properties = event?.signature?.properties || []; 
    // Generalmente viene algo como: ["transaction.id", "transaction.status", "transaction.amount_in_cents", "transaction.reference"]
    // y el checksum = SHA256(propertyValues.join("") + EVENTS_SECRET)

    if (!receivedChecksum || !Array.isArray(properties)) {
      return res.status(400).json({ message: "Firma incompleta." });
    }

    // Extrae los valores en el mismo orden
    const getProp = (path) => {
      return path.split('.').reduce((acc, k) => acc && acc[k], event.data);
    };
    const values = properties.map(p => String(getProp(p) ?? ""));

    const baseString = values.join("") + process.env.WOMPI_EVENTS_SECRET;
    const localChecksum = crypto.createHash("sha256").update(baseString).digest("hex");

    if (localChecksum !== receivedChecksum) {
      console.warn("⚠️ Firma de webhook inválida.");
      return res.status(400).json({ message: "Firma inválida" });
    }

    // OK, firma válida
    const tx = event.data?.transaction;
    if (!tx) return res.status(200).json({ ok: true }); // ignorar si no hay transacción

    // Usaremos reference para encontrar la orden
    const reference = tx.reference;
    const status = tx.status; // APPROVED / DECLINED / ERROR / VOIDED, etc.

    const conn = await database();

    // leer orden por reference
    const [ordenes] = await conn.query(
      "SELECT id_orden, id_aliado, estado FROM orden_suscripcion WHERE external_id = ? LIMIT 1",
      [reference]
    );
    if (ordenes.length === 0) {
      // puede ser un reintento: responde 200 para no reintentar eternamente
      return res.status(200).json({ ok: true });
    }

    const orden = ordenes[0];

    // idempotencia: si ya está pagada, salir
    if (orden.estado === "pagado") {
      return res.status(200).json({ ok: true });
    }

    if (status === "APPROVED") {
      // tomar item para saber id_suscripcion
      const [items] = await conn.query(
        "SELECT id_suscripcion, precio_unitario FROM orden_suscripcion_item WHERE id_orden = ? LIMIT 1",
        [orden.id_orden]
      );

      if (items.length > 0) {
        const id_suscripcion = items[0].id_suscripcion;

        // 1) marcar orden como pagada
        await conn.query(
          "UPDATE orden_suscripcion SET estado = 'pagado' WHERE id_orden = ?",
          [orden.id_orden]
        );

        // 2) activar plan en aliado
        await conn.query(
          "UPDATE aliado SET id_suscripcion = ? WHERE id_aliado = ?",
          [id_suscripcion, orden.id_aliado]
        );

        // 3) vaciar carrito
        const [carts] = await conn.query("SELECT id_carrito FROM carrito WHERE id_aliado = ?", [orden.id_aliado]);
        if (carts.length) {
          await conn.query("DELETE FROM carrito_item WHERE id_carrito = ?", [carts[0].id_carrito]);
        }
      }
    } else if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") {
      await conn.query(
        "UPDATE orden_suscripcion SET estado = ? WHERE id_orden = ?",
        [status.toLowerCase(), orden.id_orden]
      );
    }

    // Responder 200 SIEMPRE que proceses algo, para que Wompi no reintente
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("❌ Webhook error:", e);
    // si respondes 500 Wompi reintenta; solo hazlo si de verdad quieres reintentos
    return res.status(500).json({ message: "Error en webhook" });
  }
});

export default router;
