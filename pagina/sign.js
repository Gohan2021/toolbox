// node sign.js
import crypto from "crypto";

// Simula el evento que enviarás (ajusta reference al tuyo real)
const eventData = {
  transaction: {
    id: "tx_dummy_123",
    status: "APPROVED",
    amount_in_cents: 600000,
    reference: "ORD-ALIADO-1725555555"
  }
};

// Las properties deben ser EXACTAMENTE las que Wompi manda
const properties = [
  "transaction.id",
  "transaction.status",
  "transaction.amount_in_cents",
  "transaction.reference"
];

const EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET; // exporta tu secret antes de correr

const getProp = (path, obj) =>
  path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);

const concatenated = properties.map(p => String(getProp(p, eventData) ?? "")).join("");

const checksum = crypto
  .createHmac("sha256", EVENTS_SECRET)
  .update(concatenated)
  .digest("hex");

console.log(JSON.stringify({
  event: "transaction.updated",
  data: eventData,
  signature: { properties, checksum }
}, null, 2));
