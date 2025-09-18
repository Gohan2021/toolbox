// hazteConocer_confirm.js — confirma pago al volver de Wompi

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref) return; // llegó sin referencia

  try {
    const resp = await fetch(`/api/wompi/confirm?ref=${encodeURIComponent(ref)}`, {
      credentials: "include"
    });
    const data = await resp.json();
    console.log("Confirmación Wompi:", data);

    // Aquí actualiza la UI (mostrar éxito / pendiente / rechazado)
    // if (data.ok && (data.status === "APPROVED" || data.idempotent)) { ... }
  } catch (e) {
    console.error("Error confirmando Wompi:", e);
  }
});
