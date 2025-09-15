// app/public/routes/debug-env.js
import { Router } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
const router = Router();

const fp = (v) => v ? crypto.createHash("sha256").update(v).digest("hex").slice(0,16) : null;

router.get("/debug/env", (req, res) => {
  const primary = (process.env.WOMPI_EVENTS_SECRET || "").trim();
  const alt     = (process.env.WOMPI_EVENTS_SECRET_ALT || "").trim();

  const cwd = process.cwd();
  const envPath = path.resolve(".env");

  res.json({
    pid: process.pid,
    cwd,
    envPath,
    envExists: fs.existsSync(envPath),
    primary_len: primary.length,
    primary_fp: fp(primary),
    alt_len: alt.length,
    alt_fp: fp(alt),
    wompi_env: process.env.WOMPI_ENV,
    node_version: process.version,
    started_at: new Date().toISOString()
  });
});

export default router;
