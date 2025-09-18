// app/public/routes/wompi.js
import express from "express";
import crypto from "crypto";
import database from "../../database.js";
import { verifyToken } from "../../controllers/authentication.controller.js";

const router = express.Router();

/* =========================
   Config
========================= */
const ENV = (process.env.WOMPI_ENV || "sandbox").trim().toLowerCase();
const CURRENCY = (process.env.WOMPI_CURRENCY || "COP").trim();
const PUBLIC_KEY = (process.env.WOMPI_PUBLIC_KEY || "").trim();
const INTEGRITY_KEY = (process.env.WOMPI_INTEGRITY_KEY || "").trim(); // <-- ¡ESTO FALTABA!
const PRIVATE_KEY = (process.env.WOMPI_PRIVATE_KEY || "").trim();

const WOMPI_BASE =
  ENV === "production"
    ? "https://production.wompi.co"
    : "https://sandbox.wompi.co";

/* =========================
   Helpers
========================= */
// Firma de integridad (NO HMAC). Si usas expirationTime en el form, inclúyelo en la firma.
function buildIntegritySignature({ reference, amountInCents, currency, expirationTime }) {
  const base = expirationTime
    ? `${reference}${amountInCents}${currency}${expirationTime}${INTEGRITY_KEY}`
    : `${reference}${amountInCents}${currency}${INTEGRITY_KEY}`;
  return crypto.createHash("sha256").update(base).digest("hex");
}

// Si además usas el endpoint GET /api/checkout/web, asegúrate de validar que existan PUBLIC_KEY e INTEGRITY_KEY:
function assertWompiFormConfig() {
  if (!PUBLIC_KEY) throw new Error("Falta WOMPI_PUBLIC_KEY");
  if (!INTEGRITY_KEY) throw new Error("Falta WOMPI_INTEGRITY_KEY");
  if (!CURRENCY) throw new Error("Falta WOMPI_CURRENCY");
}


/* =========================
   Web Checkout
========================= */
/**
 * POST /api/checkout/web
 * Body:
 *   - id_suscripcion? : number (opcional; si no viene, toma del carrito)
 *   - redirectUrl?    : string (opcional; por defecto http://localhost:4000/hazteConocer)
 *   - customerEmail?  : string (opcional; si no viene, usa el email del aliado si lo tienes; aquí se permite null)
 *
 * Requiere: verifyToken (aliado logueado)
 * Devuelve:
 *   { checkoutUrl, reference, orderId, wompi: {...raw} }
 */
// === Helper: obtener plan desde ?plan= o desde el carrito del aliado ===
async function resolvePlan(conn, id_aliado, id_suscripcion) {
  if (id_suscripcion) {
    const [rows] = await conn.query(
      `SELECT id_suscripcion, nombre, precio
         FROM suscripcion
        WHERE id_suscripcion = ?
        LIMIT 1`,
      [id_suscripcion]
    );
    if (!rows.length) throw new Error("El plan no existe.");
    return rows[0];
  }

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
  if (!items.length) throw new Error("El carrito está vacío.");
  return items[0];
}

// === WEB CHECKOUT (GET que devuelve HTML con <form> auto-submit) ===
router.get("/checkout/web", verifyToken, async (req, res) => {
  try {
    assertWompiFormConfig(); // valida PUBLIC_KEY / INTEGRITY_KEY / CURRENCY

    const id_aliado = req.user?.userId || req.user?.id_aliado;
    if (!id_aliado) return res.status(401).send("No autenticado");

    const id_suscripcion = req.query.plan ? Number(req.query.plan) : null;

    // 1) Conexión BD y resolución del plan
    const conn = await database();
    const plan = await resolvePlan(conn, id_aliado, id_suscripcion);

    const price = Number(plan.precio);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).send("Precio inválido");
    }

    // 2) Montos y referencia
    const amountInCents = Math.round(price * 100);
    const reference = `ORD-${id_aliado}-${Date.now()}`;

    // 3) Crear orden 'pendiente' + item
    const [insOrd] = await conn.query(
      `INSERT INTO orden_suscripcion (id_aliado, total, estado, metodo_pago, external_id, created_at)
       VALUES (?, ?, 'pendiente', 'wompi', ?, NOW())`,
      [id_aliado, price, reference]
    );
    const id_orden = insOrd.insertId;

    await conn.query(
      `INSERT INTO orden_suscripcion_item (id_orden, id_suscripcion, precio_unitario, quantity)
       VALUES (?, ?, ?, 1)`,
      [id_orden, plan.id_suscripcion, price]
    );

    // ... dentro de router.get("/checkout/web", ...)
    const redirectUrl = `${req.protocol}://${req.get("host")}/hazteConocer?ref=${encodeURIComponent(reference)}`;

    // Firma integridad
    const integrity = buildIntegritySignature({
      reference,
      amountInCents,
      currency: CURRENCY,
    });

    // HTML con form auto-submit (SIN cambios excepto el redirect-url):
    const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Redirigiendo a Wompi…</title></head>
<body>
  <p>Redirigiendo a la pasarela de pago…</p>
  <form id="wompiForm" action="https://checkout.wompi.co/p/" method="GET">
    <input type="hidden" name="public-key" value="${PUBLIC_KEY}">
    <input type="hidden" name="currency" value="${CURRENCY}">
    <input type="hidden" name="amount-in-cents" value="${amountInCents}">
    <input type="hidden" name="reference" value="${reference}">
    <input type="hidden" name="signature:integrity" value="${integrity}">
    <input type="hidden" name="redirect-url" value="${redirectUrl}">
  </form>
  <script>document.getElementById('wompiForm').submit();</script>
</body>
</html>`;
    return res.status(200).type("html").send(html);

  } catch (e) {
    console.error("❌ /checkout/web error:", e);
    return res.status(500).send(e.message || "Error preparando el Web Checkout.");
  }
});

// Confirmación server-to-server: cierra la compra sin depender del webhook
router.get("/wompi/confirm", verifyToken, async (req, res) => {
  try {
    const ref = (req.query.ref || "").trim();
    if (!ref) return res.status(400).json({ ok: false, message: "Falta ref" });
    if (!PRIVATE_KEY) return res.status(500).json({ ok: false, message: "Falta WOMPI_PRIVATE_KEY" });

    // 1) Traer transacciones por referencia desde Wompi
    const url = `${WOMPI_BASE}/v1/transactions?reference=${encodeURIComponent(ref)}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${PRIVATE_KEY}` }
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(502).json({ ok: false, message: "Error consultando Wompi", status: resp.status, body: text });
    }
    const json = await resp.json();

    const list = Array.isArray(json?.data) ? json.data : [];
    if (!list.length) {
      return res.status(404).json({ ok: false, message: "No hay transacciones con esa referencia" });
    }

    // 2) Toma la más reciente (o la primera APPROVED)
    const tx = list.find(t => t.status === "APPROVED") || list[0];
    const status        = tx?.status;
    const amountInCents = tx?.amount_in_cents;
    const txId          = tx?.id;
    const currencyTx    = tx?.currency;

    // 3) Verificaciones mínimas (moneda, etc.)
    if (!txId) return res.status(400).json({ ok: false, message: "Transacción sin id" });
    if (currencyTx && currencyTx !== CURRENCY) {
      return res.status(400).json({ ok: false, message: `Moneda no coincide (${currencyTx} != ${CURRENCY})` });
    }

    const db = await database();

    // 4) Ubicar la orden por external_id
    const [ordRows] = await db.query(
      `SELECT id_orden, id_aliado, estado FROM orden_suscripcion WHERE external_id = ? LIMIT 1`,
      [ref]
    );
    if (!ordRows.length) {
      return res.status(404).json({ ok: false, message: "No existe orden para esa referencia" });
    }
    const orden = ordRows[0];

    // 5) Idempotencia
    if (String(orden.estado).toLowerCase() === "pagado") {
      // Igual refrescamos datos de la transacción
      await db.query(
        `UPDATE orden_suscripcion
            SET tx_id = ?, tx_status = ?, amount_in_cents = ?, updated_at = NOW()
          WHERE id_orden = ?`,
        [txId, status || null, amountInCents || null, orden.id_orden]
      );
      return res.json({ ok: true, idempotent: true, orderId: orden.id_orden, txId, status });
    }

    // 6) Si está aprobada, marcar pagado y actualizar plan del aliado
    if (status === "APPROVED") {
      const [itemRows] = await db.query(
        `SELECT id_suscripcion FROM orden_suscripcion_item WHERE id_orden = ? LIMIT 1`,
        [orden.id_orden]
      );
      if (!itemRows.length) {
        return res.status(500).json({ ok: false, message: "Orden sin items; no se puede actualizar plan" });
      }
      const id_suscripcion = itemRows[0].id_suscripcion;

      // Transacción SQL
      const conn = db.getConnection ? await db.getConnection() : db;
      try {
        if (conn.beginTransaction) await conn.beginTransaction();

        await conn.query(
          `UPDATE orden_suscripcion
              SET estado = 'pagado',
                  tx_id = ?,
                  tx_status = ?,
                  amount_in_cents = ?,
                  fecha_pago = NOW(),
                  updated_at = NOW()
            WHERE id_orden = ?`,
          [txId, status, amountInCents || null, orden.id_orden]
        );

        await conn.query(
          `UPDATE aliado
              SET id_suscripcion = ?
            WHERE id_aliado = ?`,
          [id_suscripcion, orden.id_aliado]
        );

        if (conn.commit) await conn.commit();
      } catch (err) {
        try { if (conn.rollback) await conn.rollback(); } catch {}
        throw err;
      } finally {
        try { if (conn.release) conn.release(); } catch {}
      }

      return res.json({ ok: true, orderId: orden.id_orden, txId, status, updatedPlanTo: id_suscripcion });
    }

    // 7) Si no está aprobada, refleja estado
    await db.query(
      `UPDATE orden_suscripcion
          SET tx_id = ?, tx_status = ?, amount_in_cents = ?, updated_at = NOW()
        WHERE id_orden = ?`,
      [txId, status || null, amountInCents || null, orden.id_orden]
    );

    return res.json({ ok: true, orderId: orden.id_orden, txId, status });
  } catch (e) {
    console.error("❌ /wompi/confirm error:", e);
    return res.status(500).json({ ok: false, message: e.message || "Error confirmando con Wompi" });
  }
});


export default router;
