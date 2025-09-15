// app/public/routes/wompi-webhook.js
import express from "express";
import crypto from "crypto";
import database from "../../database.js";

const router = express.Router();

/* =========================
   Config
========================= */
const EVENTS_SECRET       = (process.env.WOMPI_EVENTS_SECRET || "").trim();        // secreto actual (Backoffice)
const EVENTS_SECRET_ALT   = (process.env.WOMPI_EVENTS_SECRET_ALT || "").trim();    // opcional: secreto anterior
const ALLOW_INSECURE      = process.env.ALLOW_INSECURE_WEBHOOK === "1";            // solo sandbox

/* =========================
   Helpers
========================= */
const getProp = (path, obj) =>
  path.split(".").reduce((acc, k) => acc?.[k], obj);

const hmac = (secret, text) =>
  secret ? crypto.createHmac("sha256", secret).update(text).digest("hex") : null;

const fp = (s) =>
  s ? crypto.createHash("sha256").update(s).digest("hex").slice(0, 16) : null;

/* =========================
   Webhook
========================= */
router.post("/wompi/webhook", express.json({ type: "*/*" }), async (req, res) => {
  try {
    const event = req.body; // { event, data, signature: { properties, checksum }, environment, ... }
    if (!event) return res.status(400).json({ message: "Body vacío" });

    const receivedChecksum = event?.signature?.checksum || "";
    const properties       = Array.isArray(event?.signature?.properties) ? event.signature.properties : [];
    const data             = event?.data;

    // Log mínimo para traza
    const tx = data?.transaction || data;
    console.log("🛰️  Wompi ▶︎ webhook hit", {
      env: event?.environment,
      event: event?.event,
      hasSig: !!event?.signature,
      propsLen: properties.length,
      ref: tx?.reference,
      status: tx?.status
    });

    // Permitir saltar validación (solo tests)
    if (!ALLOW_INSECURE) {
      // Validaciones básicas
      if (!EVENTS_SECRET || !receivedChecksum || properties.length === 0) {
        console.warn("❗ webhook 400 → Firma incompleta", {
          ct: req.headers["content-type"],
          secret_len: EVENTS_SECRET.length,
          hasSignature: !!event?.signature,
          properties,
          checksum: receivedChecksum
        });
        return res.status(400).json({ message: "Firma incompleta" });
      }

      // Concatenación EXACTA en el orden de properties
      const concatenated = properties.map(p => String(getProp(p, data) ?? "")).join("");

      // Intenta con secret primario
      let computed = hmac(EVENTS_SECRET, concatenated);
      let which = "primary";

      // Si no coincide y hay secret alterno, prueba con ALT
      if (computed !== receivedChecksum && EVENTS_SECRET_ALT) {
        const computedAlt = hmac(EVENTS_SECRET_ALT, concatenated);
        if (computedAlt === receivedChecksum) {
          computed = computedAlt;
          which = "alt";
        }
      }

      if (computed !== receivedChecksum) {
        console.warn("⚠️ Webhook: firma inválida", {
          receivedChecksum,
          computedPrimary: hmac(EVENTS_SECRET, concatenated),
          computedAlt: EVENTS_SECRET_ALT ? hmac(EVENTS_SECRET_ALT, concatenated) : null,
          properties,
          concatenated,
          fp_primary: fp(EVENTS_SECRET),
          fp_alt: fp(EVENTS_SECRET_ALT)
        });
        return res.status(400).json({ message: "Firma inválida" });
      }

      console.log("✅ Firma válida con secret:", which);
    } else {
      console.warn("🔓 ALLOW_INSECURE_WEBHOOK=1 activo — NO se valida firma");
    }

    // ===== Conciliación BD =====
    const status        = tx?.status;
    const reference     = tx?.reference;
    const txId          = tx?.id;
    const amountInCents = tx?.amount_in_cents;

    console.log("📥 WEBHOOK recibido:", JSON.stringify({
      status, reference, txId, amountInCents
    }));

    if (!reference) {
      console.warn("⚠️ Evento sin reference, nada que conciliar");
      return res.status(200).json({ ok: true, skipped: true });
    }

    const db = await database();

    // 1) Buscar la orden por referencia (external_id)
    const [ordRows] = await db.query(
      `SELECT id_orden, id_aliado, estado
         FROM orden_suscripcion
        WHERE external_id = ?
        LIMIT 1`,
      [reference]
    );

    if (!ordRows?.length) {
      console.warn("⚠️ No existe orden_suscripcion para reference:", reference);
      return res.status(200).json({ ok: true, skipped: true });
    }

    const orden = ordRows[0];

    // 2) Guardar trazabilidad del último webhook
    await db.query(
      `UPDATE orden_suscripcion
          SET last_webhook_status = ?, last_webhook_at = NOW()
        WHERE id_orden = ?`,
      [status || null, orden.id_orden]
    );

    // 3) Idempotencia
    if (String(orden.estado).toLowerCase() === "pagado") {
      console.log("ℹ️ Orden ya pagada, id:", orden.id_orden);
      return res.status(200).json({ ok: true, idempotent: true });
    }

    // 4) Solo si está aprobado continuamos
    if (status !== "APPROVED") {
      console.log("ℹ️ Status no aprobado; no se actualiza plan (estado:", status, ")");
      return res.status(200).json({ ok: true, notApproved: true });
    }

    // 5) Leer item para saber la suscripción
    const [itemRows] = await db.query(
      `SELECT id_suscripcion
         FROM orden_suscripcion_item
        WHERE id_orden = ?
        LIMIT 1`,
      [orden.id_orden]
    );

    if (!itemRows?.length) {
      console.warn("⚠️ Orden sin items, no se puede actualizar plan. id_orden:", orden.id_orden);
      return res.status(200).json({ ok: true, no_item: true });
    }

    const id_suscripcion = itemRows[0].id_suscripcion;

    // 6) Transacción: marcar pagado + actualizar plan del aliado
    const conn = db.getConnection ? await db.getConnection() : db;
    try {
      if (conn.beginTransaction) await conn.beginTransaction();

      await conn.query(
        `UPDATE orden_suscripcion
            SET estado = 'pagado'
          WHERE id_orden = ?`,
        [orden.id_orden]
      );

      await conn.query(
        `UPDATE aliado
            SET id_suscripcion = ?
          WHERE id_aliado = ?`,
        [id_suscripcion, orden.id_aliado]
      );

      if (conn.commit) await conn.commit();

      console.log(`✅ Plan actualizado para aliado ${orden.id_aliado} → suscripcion ${id_suscripcion}`);
      return res.status(200).json({ ok: true });
    } catch (e) {
      try { if (conn.rollback) await conn.rollback(); } catch {}
      console.error("❌ Error conciliando webhook (SQL):", {
        message: e.message, code: e.code, errno: e.errno, sqlState: e.sqlState, sql: e.sql
      });
      return res.status(500).json({ message: "Error conciliando webhook" });
    } finally {
      try { if (conn.release) conn.release(); } catch {}
    }
  } catch (e) {
    console.error("❌ Webhook error:", e);
    return res.status(500).json({ message: "Error en webhook" });
  }
});

export default router;
