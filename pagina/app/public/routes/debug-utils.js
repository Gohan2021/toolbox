// app/public/routes/debug-utils.js
import { Router } from "express";

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

router.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.post("/debug/echo", requireDebugAuth, (req, res) => {
  res.json({
    headers: req.headers,
    body: req.body,
    keys: Object.keys(req.body || {})
  });
});

export default router;
