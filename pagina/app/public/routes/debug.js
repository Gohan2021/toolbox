// routes/debug.js
import { Router } from 'express';
import crypto from 'crypto';

const router = Router();
// EN CUALQUIER ROUTER DE /api SOLO PARA PRUEBA:
router.get("/debug/secret-fp", (req, res) => {
  const s = (process.env.WOMPI_EVENTS_SECRET || "").trim();
  const fp = crypto.createHash("sha256").update(s).digest("hex");
  res.json({ len: s.length, sha256_prefix: fp.slice(0, 16) });
});

router.get('/debug/webhook-check', (req, res) => {
  try {
    const concat = req.query.concat || '';
    const expected = (req.query.expected || '').toLowerCase();
    const secret = (process.env.WOMPI_EVENTS_SECRET || '').trim();

    if (!concat) return res.status(400).json({ ok:false, error:'Falta ?concat=' });
    if (!secret) return res.status(400).json({ ok:false, error:'WOMPI_EVENTS_SECRET vacío' });

    const computed = crypto.createHmac('sha256', secret).update(concat).digest('hex');
    return res.json({
      ok: true,
      secret_len: secret.length,     // no enviamos el secret, solo su largo
      concat_len: concat.length,
      computed,
      expected,
      matches: expected ? computed === expected : null
    });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e.message });
  }
});

export default router;
