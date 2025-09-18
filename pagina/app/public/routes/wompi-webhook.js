// ... cabecera del archivo ...
import express from "express";
import crypto from "crypto";
import database from "../../database.js";

const router = express.Router();

const ENV    = (process.env.WOMPI_ENV || "sandbox").trim().toLowerCase();
const BASE   = ENV === "production" ? "https://production.wompi.co" : "https://sandbox.wompi.co";
const PRIV   = (process.env.WOMPI_PRIVATE_KEY || "").trim();
const FAILOPEN = process.env.WEBHOOK_FAILOPEN === "1";   // <--- habilita plan B
const ALLOW_INSECURE = process.env.ALLOW_INSECURE_WEBHOOK === "1";

const EVENTS_SECRET     = (process.env.WOMPI_EVENTS_SECRET || "").trim();
const EVENTS_SECRET_ALT = (process.env.WOMPI_EVENTS_SECRET_ALT || "").trim();

const getProp = (p, o) => p.split(".").reduce((a, k) => a?.[k], o);
const hmac = (s, t) => (s ? crypto.createHmac("sha256", s).update(t).digest("hex") : null);
const fp   = (s) => (s ? crypto.createHash("sha256").update(s).digest("hex").slice(0, 16) : null);

// === conciliación reutilizable ===
async function reconcileApproved(reference, txId, amountInCents) {
  const db = await database();
  // 1) orden
  const [ordRows] = await db.query(
    `SELECT id_orden, id_aliado, estado FROM orden_suscripcion WHERE external_id = ? LIMIT 1`,
    [reference]
  );
  if (!ordRows.length) return { ok: false, reason: "NO_ORDER" };
  const orden = ordRows[0];

  // 2) item
  const [itemRows] = await db.query(
    `SELECT id_suscripcion FROM orden_suscripcion_item WHERE id_orden = ? LIMIT 1`,
    [orden.id_orden]
  );
  if (!itemRows.length) return { ok: false, reason: "NO_ITEM" };
  const id_suscripcion = itemRows[0].id_suscripcion;

  // 3) idempotencia
  if (String(orden.estado).toLowerCase() === "pagado") {
    await db.query(
      `UPDATE orden_suscripcion
          SET tx_id = ?, tx_status = 'APPROVED', amount_in_cents = ?, updated_at = NOW()
        WHERE id_orden = ?`,
      [txId || null, amountInCents || null, orden.id_orden]
    );
    return { ok: true, idempotent: true, orderId: orden.id_orden };
  }

  // 4) transacción
  const conn = db.getConnection ? await db.getConnection() : db;
  try {
    if (conn.beginTransaction) await conn.beginTransaction();

    await conn.query(
      `UPDATE orden_suscripcion
          SET estado = 'pagado',
              tx_id = ?,
              tx_status = 'APPROVED',
              amount_in_cents = ?,
              fecha_pago = NOW(),
              updated_at = NOW()
        WHERE id_orden = ?`,
      [txId || null, amountInCents || null, orden.id_orden]
    );

    await conn.query(
      `UPDATE aliado
          SET id_suscripcion = ?
        WHERE id_aliado = ?`,
      [id_suscripcion, orden.id_aliado]
    );

    if (conn.commit) await conn.commit();
    return { ok: true, orderId: orden.id_orden, updatedPlanTo: id_suscripcion };
  } catch (e) {
    try { if (conn.rollback) await conn.rollback(); } catch {}
    throw e;
  } finally {
    try { if (conn.release) conn.release(); } catch {}
  }
}

// === confirmación s2s a Wompi por referencia ===
async function confirmWithWompi(reference) {
  if (!PRIV) throw new Error("Falta WOMPI_PRIVATE_KEY");
  const url = `${BASE}/v1/transactions?reference=${encodeURIComponent(reference)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${PRIV}` } });
  if (!r.ok) throw new Error(`Wompi ${r.status}`);
  const j = await r.json();
  const list = Array.isArray(j?.data) ? j.data : [];
  const tx = list.find(t => t.status === "APPROVED") || list[0];
  return tx || null;
}

// === webhook ===
router.post("/wompi/webhook", express.json({ type: "*/*" }), async (req, res) => {
  try {
    const event = req.body;
    const data = event?.data;
    const tx   = data?.transaction || data;

    console.log("🛰️  Wompi ▶︎ webhook hit", {
      env: event?.environment, event: event?.event,
      hasSig: !!event?.signature, propsLen: event?.signature?.properties?.length || 0,
      ref: tx?.reference, status: tx?.status
    });

    const receivedChecksum = event?.signature?.checksum || "";
    const props = Array.isArray(event?.signature?.properties) ? event.signature.properties : [];
    const concatenated = props.map(p => String(getProp(p, data) ?? "")).join("");

    // Validación de firma
    let valid = true;
    if (!ALLOW_INSECURE) {
      if (!EVENTS_SECRET || !receivedChecksum || props.length === 0) {
        valid = false;
      } else {
        const calc1 = hmac(EVENTS_SECRET, concatenated);
        const calc2 = EVENTS_SECRET_ALT ? hmac(EVENTS_SECRET_ALT, concatenated) : null;
        valid = (receivedChecksum === calc1) || (receivedChecksum === calc2);
        if (!valid) {
          console.warn("⚠️ Firma inválida", {
            receivedChecksum,
            computedPrimary: calc1,
            computedAlt: calc2,
            properties: props,
            concatenated,
            fp_primary: fp(EVENTS_SECRET),
            fp_alt: fp(EVENTS_SECRET_ALT)
          });
        }
      }
    } else {
      console.warn("🔓 ALLOW_INSECURE_WEBHOOK=1 (sandbox) — NO se valida firma");
    }

    // Si la firma es válida o estás en modo inseguro, continúa como siempre:
    const goNormal = valid || ALLOW_INSECURE;

    // Datos de la transacción
    const status        = tx?.status;
    const reference     = tx?.reference;
    const txId          = tx?.id;
    const amountInCents = tx?.amount_in_cents;

    if (!reference) return res.status(200).json({ ok: true, skipped: true });

    if (goNormal) {
      // Conciliar como ya lo haces normalmente (puedes reutilizar reconcileApproved)
      if (status === "APPROVED") {
        const out = await reconcileApproved(reference, txId, amountInCents);
        return res.status(out.ok ? 200 : 500).json(out);
      }
      // reflejar estado no aprobado si quieres…
      return res.status(200).json({ ok: true, status });
    }

    // === FAIL-OPEN (solo si lo activas) ===
    if (FAILOPEN && ENV === "sandbox") {
      try {
        const txApi = await confirmWithWompi(reference);
        if (txApi && txApi.status === "APPROVED") {
          const out = await reconcileApproved(reference, txApi.id, txApi.amount_in_cents);
          console.warn("🟡 FAIL-OPEN aplicado y conciliado por API:", out);
          return res.status(200).json({ ok: true, failOpen: true, ...out });
        }
        return res.status(200).json({ ok: true, failOpen: true, info: "No approved tx from API" });
      } catch (e) {
        console.error("❌ FAIL-OPEN error:", e);
        return res.status(200).json({ ok: true, failOpen: true, error: e.message });
      }
    }

    // Si no hay fail-open, responde 400 como antes
    return res.status(400).json({ message: "Firma inválida" });
  } catch (e) {
    console.error("❌ Webhook error:", e);
    return res.status(500).json({ message: "Error en webhook" });
  }
});

export default router;
