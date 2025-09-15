// make_body.cjs  (CommonJS para que funcione igual en Windows/Git Bash/PowerShell)
const fs = require("fs");
const crypto = require("crypto");

// Lee argumentos
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.join("=")];
  })
);

// Secret y datos de prueba
const SECRET = (args.secret || "").trim();
const REFERENCE = args.ref || "ORD-TEST-999";
const TXID = args.txid || "tx_test_1";
const STATUS = args.status || "APPROVED";
const AMOUNT = Number(args.amount || 6000000);

if (!SECRET) {
  console.error("❌ Falta --secret=<WOMPI_EVENTS_SECRET_SANDBOX>");
  process.exit(1);
}

// Estructura Wompi
const data = {
  transaction: {
    id: TXID,
    status: STATUS,
    amount_in_cents: AMOUNT,
    reference: REFERENCE
  }
};

// Orden EXACTO de properties (usa el que te llegó en el webhook real)
const properties = [
  "transaction.id",
  "transaction.status",
  "transaction.amount_in_cents"
];

const get = (path, obj) => path.split(".").reduce((a, k) => (a ? a[k] : undefined), obj);
const concatenated = properties.map(p => String(get(p, data) ?? "")).join("");
const checksum = crypto.createHmac("sha256", SECRET).update(concatenated).digest("hex");

const body = {
  event: "transaction.updated",
  data,
  signature: { properties, checksum }
};

fs.writeFileSync("body.json", JSON.stringify(body, null, 2), "utf8");
console.log("✅ body.json generado");
console.log("   properties:", properties);
console.log("   concatenated:", concatenated);
console.log("   checksum:", checksum);
