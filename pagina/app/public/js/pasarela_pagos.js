// pasarela_pagos.js — Web Checkout (sin widget)

async function iniciarCheckout() {
  const btn = document.getElementById("pagarWompiBtn");
  try {
    btn && (btn.disabled = true);

    const cartRes = await fetch("/api/cart", { credentials: "include" });
    const cart = await cartRes.json();
    if (!cart.items || !cart.items.length) throw new Error("El carrito está vacío");

    const planId = cart.items[0]?.id_suscripcion;
    const url = planId ? `/api/checkout/web?plan=${encodeURIComponent(planId)}` : `/api/checkout/web`;
    window.location.href = url; // redirige a Wompi
  } catch (e) {
    console.error("Web Checkout Error:", e);
    alert(e.message || "Error iniciando pago");
  } finally {
    btn && (btn.disabled = false);
  }
}

async function renderCarrito() {
  const mini = document.getElementById("carritoResumen");
  const res = await fetch("/api/cart", { credentials: "include" });
  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    mini.innerHTML = "<p class='text-muted'>Carrito vacío</p>";
    return;
  }
  const item = data.items[0];
  mini.innerHTML = `
    <div class="card p-3">
      <strong>Tipo de plan: ${item.nombre}</strong><br>
      $${Number(item.precio).toLocaleString('es-CO')} / mes
    </div>
  `;
}

async function agregarPlanSiExiste() {
  const params = new URLSearchParams(window.location.search);
  const planId = params.has("plan") ? Number(params.get("plan")) : null;
  if (!planId) return;

  try {
    const res = await fetch("/api/cart/add", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_suscripcion: planId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al agregar");
  } catch (e) {
    console.error(e);
    alert("No se pudo agregar el plan al carrito: " + e.message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await agregarPlanSiExiste();
  await renderCarrito();

  const btnPagar = document.getElementById("pagarWompiBtn");
  if (btnPagar) btnPagar.addEventListener("click", iniciarCheckout);

  const btnVaciar = document.getElementById("vaciarCarritoBtn");
  if (btnVaciar) btnVaciar.addEventListener("click", async () => {
    await fetch("/api/cart", { method: "DELETE", credentials: "include" });
    await renderCarrito();
  });
});
