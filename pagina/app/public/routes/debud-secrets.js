// app/public/routes/debug-secrets.js
import { Router } from "express";
import crypto from "crypto";

const router = Router();

const fp = (s) => s ? crypto.createHash("sha256").update(s.trim()).digest("hex").slice(0,16) : null;

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

router.get("/debug/secret-fp", requireDebugAuth, (req, res) => {
  const cur = (process.env.WOMPI_EVENTS_SECRET || "").trim();
  const alt = (process.env.WOMPI_EVENTS_SECRET_ALT || "").trim();
  res.json({
    now: new Date().toISOString(),
    len: cur.length,
    fp_primary: fp(cur),
    fp_alt: fp(alt),
    wompi_env: process.env.WOMPI_ENV || null
  });
});

export default router;
