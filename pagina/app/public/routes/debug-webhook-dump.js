// app/public/routes/debug-webhook-dump.js
import { Router } from "express";
import crypto from "crypto";

const router = Router();

function requireDebugAuth(req, res, next) {
  const enabled = process.env.DEBUG_ROUTES === "1";
  if (!enabled) return res.status(404).end();
  const token = (process.env.DEBUG_TOKEN || "").trim();
  if (token) {
    const auth = req.headers.authorization || "";
    const ok = auth.startsWith("Bearer ") && auth.slice(7) === token;
    if (!ok) return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

const get = (p, o) => p.split(".").reduce((a,k)=>a?.[k], o);

router.post("/debug/webhook-dump", requireDebugAuth, (req, res) => {
  const event = req.body || {};
  const props = Array.isArray(event?.signature?.properties) ? event.signature.properties : [];
  const recv  = event?.signature?.checksum || null;
  const data  = event?.data || null;

  const secret = (process.env.WOMPI_EVENTS_SECRET || "").trim();
  const concat = props.map(p => String(get(p, data) ?? "")).join("");

  const calc = (secret && concat)
    ? crypto.createHmac("sha256", secret).update(concat).digest("hex")
    : null;

  res.json({
    now: new Date().toISOString(),
    secret_len: secret.length,
    properties: props,
    concatenated: concat,
    checksumRecv: recv,
    checksumCalc: calc,
    matches: !!recv && !!calc && recv === calc
  });
});

export default router;
