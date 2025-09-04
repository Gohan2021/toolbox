async function loadWompiWidgetScript() {
    return new Promise((resolve, reject) => {
        if (window.WidgetCheckout) return resolve(); // ya cargado

        const s = document.createElement("script");
        // ✅ URL actual del widget (una sola para sandbox/prod)
        s.src = "https://checkout.wompi.co/widget.js";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("No se pudo cargar el widget de Wompi"));
        document.head.appendChild(s);
    });
}
async function iniciarCheckout() {
  try {
    await loadWompiWidgetScript();

    // 1) Pide al backend los datos del checkout
    const res = await fetch("/api/checkout/init", {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    console.log("INIT DATA:", data);
    if (!res.ok) throw new Error(data.message || "No se pudo iniciar el checkout.");

    // 2) Crea el widget con redirectUrl
    const checkout = new WidgetCheckout({
      currency: data.currency,           // "COP"
      amountInCents: data.amountInCents, // ej: 600000
      reference: data.reference,         // ej: "toolbox-172..."
      publicKey: data.publicKey,
      signature: data.signature,         // pub_test_... (sandbox) / pub_prod_... (prod)
      redirectUrl: window.location.origin + "/hazteConocer"
    });

    // 3) Abre el widget con callback (así evitamos el “Debes especificar una función de respuesta”)
    checkout.open(function (result) {
      // result.transaction: { id, status, ... } (según docs)
      // Puedes enviar al backend para verificar o redirigir a una página intermedia
      // Ejemplo: redirigir inmediatamente a la página de pendiente/resultado
      window.location.href = "hazteConocer";
    });
  } catch (e) {
    console.error("Wompi Widget Error:", e);
    alert(e.message || "Error iniciando pago");
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
async function vaciarCarrito() {
  await fetch("/api/cart", { method: "DELETE", credentials: "include" });
  await renderCarrito();
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
    // Si agregas por ?plan=ID, etc.
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
