// 🔥 Toda la lógica concentrada en un solo DOMContentLoaded
let plan = null;
let publicacionesUsadas = 0;
let limitePublicaciones = 9999; // por defecto sin límite

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("formPublicar");
  const mensaje = document.getElementById("mensajeUsuario");
  const destacarOpt = document.getElementById("destacarOption");
  const ayudaPlan = document.getElementById("ayudaPlan");

  const maxImagenes = 5;
  let contador = 0;

  // Función para agregar inputs de imágenes
  function agregarInputImagen() {
    if (contador >= maxImagenes) return;

    const inputGroup = document.createElement("div");
    inputGroup.classList.add("col-4", "text-center");

    const inputId = `input-${contador}`;
    const previewId = `preview-${contador}`;

    inputGroup.innerHTML = `
      <input type="file" accept="image/*" class="d-none" name="imagenes" id="${inputId}" onchange="mostrarPreview(this, '${previewId}')">
      <label for="${inputId}">
        <div class="image-preview" id="${previewId}">
          <span class="plus-icon">+</span>
        </div>
      </label>
    `;

    document.getElementById("imageInputs").appendChild(inputGroup);
    contador++;
  }

  // Función para mostrar la preview de la imagen
  window.mostrarPreview = function(input, previewId) {
    const preview = document.getElementById(previewId);

    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.innerHTML = `<img src="${e.target.result}" class="img-fluid rounded" style="width: 100%; height: 100%; object-fit: cover;">`;
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  // Inicializar 5 inputs
  for (let i = 0; i < maxImagenes; i++) {
    agregarInputImagen();
  }

  // 🔥 Validación de sesión y plan de suscripción
  try {
    const res = await fetch("http://localhost:4000/api/aliado/perfil", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn("⚠️ Sesión inválida. Redirigiendo al registro.");
        alert("Tu sesión ha expirado o no tienes permisos para acceder. Inicia sesión nuevamente.");
        window.location.href = "/form";
        return;
      }
      throw new Error(`Error inesperado de respuesta: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Respuesta de perfil:", data);

    if (!data.aliado || typeof data.aliado.id_suscripcion === "undefined") {
      throw new Error("No se pudo encontrar el id_suscripcion en el perfil del aliado.");
    }

    plan = data.aliado.id_suscripcion;
    console.log("🧾 Plan detectado:", plan);

    form.classList.remove("d-none");

    // 🔥 Switch basado en el plan
    switch (plan) {
      case 2: // Intermedio
        destacarOpt.classList.remove("d-none");
        document.getElementById("destacar").disabled = true;
        ayudaPlan.textContent = "Puedes destacar hasta 1 publicación por semana (disponible próximamente).";
        break;
      case 3: // Premium
        destacarOpt.classList.remove("d-none");
        document.getElementById("destacar").disabled = false;
        ayudaPlan.textContent = "Publicaciones destacadas ilimitadas.";
        break;
      default:
        destacarOpt.classList.remove("d-none");
        document.getElementById("destacar").disabled = true;
        ayudaPlan.textContent = "Plan gratuito: sin opción para destacar publicaciones.";
        break;
    }

    // 🔥 Contador solo para plan básico
    if (plan === 1) {
      const contadorRes = await fetch("/api/aliado/marketplace/contador", {
        method: "GET",
        credentials: "include"
      });

      if (contadorRes.ok) {
        const contadorData = await contadorRes.json();
        publicacionesUsadas = contadorData.total || 0;
        limitePublicaciones = 3;
        console.log(`🧮 Publicaciones usadas este mes: ${publicacionesUsadas}`);
      } else {
        console.warn("⚠️ No se pudo obtener el contador de publicaciones.");
      }
    }

  } catch (err) {
    console.error("❌ Error al validar sesión o procesar perfil:", err);
    alert("Ocurrió un error al validar tu sesión. Por favor, intenta más tarde o vuelve a iniciar sesión.");
    window.location.href = "/form";
  }

  // 📦 Evento de envío de formulario (¡SOLO UNO!)
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // 🔥 Validar límite de publicaciones
    if (plan === 1 && publicacionesUsadas >= limitePublicaciones) {
      alert("🚫 Has alcanzado el límite de 3 publicaciones gratuitas este mes. ¡Actualiza a Plan Premium para seguir publicando!");
      return;
    }

    const formData = new FormData(form);

    try {
      const res = await fetch("http://localhost:4000/api/marketplace/publicar", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const result = await res.json();
      if (res.ok) {
        alert("✅ Material publicado correctamente");
        form.reset();
        window.location.href = "/marketplace";
      } else {
        alert("❌ Error: " + result.message);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("❌ Error en el servidor");
    }
  });

});
