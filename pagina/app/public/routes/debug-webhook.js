// app/public/routes/debug-webhook.js
import express from "express";
import crypto from "crypto";
const router = express.Router();

router.post("/debug/webhook-dump", express.json({ type: "*/*" }), (req, res) => {
  const event = req.body || {};
  const secret = (process.env.WOMPI_EVENTS_SECRET || "").trim();

  const props = event?.signature?.properties || [];
  const recv  = event?.signature?.checksum || null;
  const get = (p, o) => p.split(".").reduce((a,k)=>a?.[k], o);
  const concat = props.map(p => String(get(p, event?.data) ?? "")).join("");
  const calc = secret && concat
    ? crypto.createHmac("sha256", secret).update(concat).digest("hex")
    : null;

  res.json({
    now: new Date().toISOString(),
    secret_len: secret.length,
    properties: props,
    concatenated: concat,
    checksumRecv: recv,
    checksumCalc: calc,
    matches: recv && calc ? recv === calc : false
  });
});

export default router;
