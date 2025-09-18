// app/public/routes/debug.js (o donde tengas tus rutas de debug)
import express from "express";
import crypto from "crypto";

const dbg = express.Router();

// Recalcula HMAC de un payload pegado en el body con los secrets del .env
dbg.post("/debug/webhook-verify", express.json({type:"*/*"}), (req,res)=>{
  const ev = req.body;
  const s1 = (process.env.WOMPI_EVENTS_SECRET||"").trim();
  const s2 = (process.env.WOMPI_EVENTS_SECRET_ALT||"").trim();
  const props = Array.isArray(ev?.signature?.properties) ? ev.signature.properties : [];
  const data = ev?.data || {};
  const get = (p,o)=>p.split(".").reduce((a,k)=>a?.[k],o);
  const concat = props.map(p=>String(get(p,data)??"")).join("");
  const h = (s)=> s ? crypto.createHmac("sha256", s).update(concat).digest("hex") : null;
  const fp = (s)=> s ? crypto.createHash("sha256").update(s).digest("hex").slice(0,16) : null;

  const recv = ev?.signature?.checksum || "";
  const calc1 = h(s1), calc2 = h(s2);

  res.json({
    concat,
    recv,
    primary: { fp: fp(s1), calc: calc1, match: recv===calc1 },
    alt:     { fp: fp(s2), calc: calc2, match: recv===calc2 }
  });
});

export default dbg;
