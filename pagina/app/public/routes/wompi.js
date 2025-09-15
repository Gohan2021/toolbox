// app/public/routes/wompi.js
import express from "express";
import crypto from "crypto";
import database from "../../database.js";
import { verifyToken } from "../../controllers/authentication.controller.js";

const router = express.Router();

const isProd = process.env.WOMPI_ENV === "production";
const CURRENCY = (process.env.WOMPI_CURRENCY || "COP").trim();
const INTEGRITY_KEY = (process.env.WOMPI_INTEGRITY_KEY || "").trim();
const PUBLIC_KEY = (process.env.WOMPI_PUBLIC_KEY || "").trim();

// ✅ Firma de integridad CORRECTA (SHA-256 del string concatenado, NO HMAC)
function buildIntegritySignature({ reference, amountInCents, currency, expirationTime }) {
  const INTEGRITY_KEY = (process.env.WOMPI_INTEGRITY_KEY || "").trim();

  // Si usas expirationTime en el widget, inclúyelo aquí:
  const base = expirationTime
    ? `${reference}${amountInCents}${currency}${expirationTime}${INTEGRITY_KEY}`
    : `${reference}${amountInCents}${currency}${INTEGRITY_KEY}`;

  return crypto.createHash("sha256").update(base).digest("hex");
}


// POST /api/checkout/init
router.post("/checkout/init", verifyToken, express.json(), async (req, res) => {
  const id_aliado = req.user?.userId || req.user?.id_aliado; // por si tu middleware usa otro nombre
  const { id_suscripcion } = req.body || {};

  if (!id_aliado) {
    return res.status(401).json({ message: "No autenticado" });
  }
  if (!PUBLIC_KEY || !INTEGRITY_KEY) {
    return res.status(500).json({ message: "Falta configuración Wompi (PUBLIC_KEY/INTEGRITY_KEY)" });
  }

  try {
    const conn = await database();

    // 1) Resolver el plan a cobrar
    let planRow = null;

    if (id_suscripcion) {
      // A) Si el front te pasó el plan, lo buscas directo
      const [rows] = await conn.query(
        `SELECT id_suscripcion, nombre, precio
           FROM suscripcion
          WHERE id_suscripcion = ?
          LIMIT 1`,
        [id_suscripcion]
      );
      if (!rows.length) {
        return res.status(400).json({ message: "El plan no existe." });
      }
      planRow = rows[0];
    } else {
      // B) Si NO vino id_suscripcion, intenta trayéndolo del carrito (ajusta a tu esquema)
      // ⚠️ Si tus nombres difieren, este try/catch nos dirá exactamente qué falla
      try {
        const [items] = await conn.query(
          `
          SELECT s.id_suscripcion, s.nombre, s.precio
          FROM carrito_item ci
          JOIN carrito c ON ci.id_carrito = c.id_carrito
          JOIN suscripcion s ON ci.id_suscripcion = s.id_suscripcion
          WHERE c.id_aliado = ?
          ORDER BY ci.id_carrito_item DESC
          LIMIT 1
          `,
          [id_aliado]
        );
        if (!items.length) {
          return res.status(400).json({ message: "El carrito está vacío." });
        }
        planRow = items[0];
      } catch (err) {
        console.error("❌ Consulta carrito falló:", {
          code: err.code,
          errno: err.errno,
          sql: err.sql,
          message: err.message
        });
        return res.status(500).json({ message: "Error leyendo el carrito (ver logs del servidor)." });
      }
    }

    const price = Number(planRow.precio);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: "Precio de plan inválido." });
    }

    const amountInCents = Math.round(price * 100);
    const reference = `ORD-${id_aliado}-${Date.now()}`;

    // 2) Crear orden + item con tu esquema real
    const [insOrd] = await conn.query(
      `INSERT INTO orden_suscripcion (id_aliado, total, estado, metodo_pago, external_id, created_at)
       VALUES (?, ?, 'pendiente', 'wompi', ?, NOW())`,
      [id_aliado, price, reference]
    );
    const id_orden = insOrd.insertId;

    await conn.query(
      `INSERT INTO orden_suscripcion_item (id_orden, id_suscripcion, precio_unitario, quantity)
       VALUES (?, ?, ?, 1)`,
      [id_orden, planRow.id_suscripcion, price]
    );

    const integritySignature = buildIntegritySignature({
      reference,
      amountInCents,
      currency: CURRENCY,
      // expirationTime // <-- solo si realmente lo vas a pasar al Widget
    });

    return res.json({
      publicKey: PUBLIC_KEY,
      reference,
      amountInCents,
      currency: CURRENCY,
      signature: { integrity: integritySignature }, // 👈 objeto
      environment: isProd ? "prod" : "sandbox",
      orderId: id_orden,
      planName: planRow.nombre
    });

  } catch (e) {
    console.error("❌ /checkout/init error:", {
      message: e.message,
      code: e.code,
      errno: e.errno,
      sqlState: e.sqlState,
      sql: e.sql
    });
    return res.status(500).json({ message: "Error preparando el checkout." });
  }
});

export default router;
