// app/public/routes/wompi.js
import express from "express";
import crypto from "crypto";
import database from "../../database.js";
import { verifyToken } from "../../controllers/authentication.controller.js";

const router = express.Router();

const isProd = process.env.WOMPI_ENV === "production";
const CURRENCY = process.env.WOMPI_CURRENCY || "COP";
const integrityKey = process.env.WOMPI_INTEGRITY_KEY;
const publicKey = process.env.WOMPI_PUBLIC_KEY;

// 🔒 Valida que tengas las envs necesarias al iniciar
if (!publicKey) console.warn("⚠️ WOMPI_PUBLIC_KEY no está definido");
if (!integrityKey) console.warn("⚠️ WOMPI_INTEGRITY_KEY no está definido");

// Utilidad: firma de integridad (Wompi Checkout)
function buildIntegritySignature({ reference, amountInCents, currency }) {
  const plain = `${reference}${amountInCents}${currency}${integrityKey}`;
  return crypto.createHash("sha256").update(plain).digest("hex");
}

// POST /api/checkout/init
router.post("/checkout/init", verifyToken, async (req, res) => {
  const id_aliado = req.user?.userId;

  try {
    const conn = await database();

    const [items] = await conn.query(`
      SELECT s.id_suscripcion, s.nombre, s.precio
      FROM carrito_item ci
      JOIN carrito c ON ci.id_carrito = c.id_carrito
      JOIN suscripcion s ON ci.id_suscripcion = s.id_suscripcion
      WHERE c.id_aliado = ?
      LIMIT 1
    `, [id_aliado]);

    if (items.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío." });
    }

    const plan = items[0];
    const amountInCents = Math.round(Number(plan.precio) * 100); // entero
    const reference = `ORD-${id_aliado}-${Date.now()}`;

    // Crea orden PENDIENTE
    const [insOrd] = await conn.query(
      "INSERT INTO orden_suscripcion (id_aliado, total, estado, metodo_pago) VALUES (?, ?, 'pendiente', 'wompi')",
      [id_aliado, plan.precio]
    );
    const id_orden = insOrd.insertId;

    await conn.query(
      "INSERT INTO orden_suscripcion_item (id_orden, id_suscripcion, precio_unitario, quantity) VALUES (?, ?, ?, 1)",
      [id_orden, plan.id_suscripcion, plan.precio]
    );

    await conn.query(
      "UPDATE orden_suscripcion SET external_id = ? WHERE id_orden = ?",
      [reference, id_orden]
    );

    // ✅ Usa CURRENCY correcto (no 'currency' undefined)
    const integritySignature = buildIntegritySignature({
      reference,
      amountInCents,
      currency: CURRENCY,
    });
    
    return res.json({
      publicKey,
      reference,
      amountInCents,
      currency: CURRENCY,
      signature: { integrity: integritySignature },
      environment: isProd ? "prod" : "sandbox",
      orderId: id_orden,
      planName: plan.nombre
    });

  } catch (e) {
    console.error("❌ /checkout/init error:", e);
    return res.status(500).json({ message: "Error preparando el checkout." });
  }
});

export default router;
