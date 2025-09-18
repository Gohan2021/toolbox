import { Router } from "express";
import crypto from "crypto";

const router = Router();

const get = (p, o) => p.split(".").reduce((a,k)=>a?.[k], o);
const hmac = (s, t) => s ? crypto.createHmac("sha256", s.trim()).update(t).digest("hex") : null;
const fp = (s) => s ? crypto.createHash("sha256").update(s.trim()).digest("hex").slice(0,16) : null;

router.post("/debug/webhook-verify", (req, res) => {
  const event = req.body || {};
  const props = Array.isArray(event?.signature?.properties) ? event.signature.properties : [];
  const recv  = event?.signature?.checksum || null;
  const data  = event?.data || null;

  const S1 = (process.env.WOMPI_EVENTS_SECRET || "").trim();
  const S2 = (process.env.WOMPI_EVENTS_SECRET_ALT || "").trim();

  const concat = props.map(p => String(get(p, data) ?? "")).join("");

  const calc1 = hmac(S1, concat);
  const calc2 = hmac(S2, concat);

  res.json({
    now: new Date().toISOString(),
    properties: props,
    concatenated: concat,
    checksumRecv: recv,
    primary: { fp: fp(S1), calc: calc1, matches: !!recv && recv === calc1 },
    alt:     { fp: fp(S2), calc: calc2, matches: !!recv && recv === calc2 }
  });
});

export default router;
