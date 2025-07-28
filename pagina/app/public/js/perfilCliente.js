async function loadClientProfile() {
    console.log("🔄 Cargando perfil del cliente...");
  
    try {
      console.log("🍪 Verificando cookies del cliente:", document.cookie);
  
      const response = await fetch("http://localhost:4000/api/cliente/perfil", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
  
      console.log("📡 Respuesta del servidor:", response);
  
      if (response.status === 401 || response.status === 403) {
        console.warn("⚠️ No autorizado. Redirigiendo al inicio de sesión.");
        alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        window.location.href = "/cliente";
        return;
      }
  
      const data = await response.json();
      console.log("✅ Perfil cargado:", data);
  
      if (!data.cliente || !data.cliente.id_cliente) {
        throw new Error("Datos del cliente no encontrados.");
      }
  
      // Guardar ID del cliente en `sessionStorage` y `localStorage`
      sessionStorage.setItem("clienteId", data.cliente.id_cliente);
      localStorage.setItem("clienteId", data.cliente.id_cliente);
  
      // Cargar datos personales
      document.getElementById("nombreCliente").textContent = `${data.cliente.nombre} ${data.cliente.apellido}`;
      document.getElementById("telefonoCliente").textContent = data.cliente.telefono;
      document.getElementById("emailCliente").textContent = data.cliente.email;
      document.getElementById("direccionCliente").textContent = data.cliente.direccion;
      document.getElementById("profileImage").src = data.cliente.foto || "/imagenes/acceso.png";
  
      // 📌 Mostrar los servicios tomados
      const serviciosPendientes = data.serviciosTomados.filter(servicio => servicio.estado === 'pendiente');
      const serviciosCompletados = data.serviciosTomados.filter(servicio => servicio.estado === 'completado');
  
      const pendientesContainer = document.getElementById("serviciosPendientes");
      const completadosContainer = document.getElementById("serviciosCompletados");
  
      if (!pendientesContainer || !completadosContainer) {
        throw new Error("No se encontraron los contenedores de servicios pendientes o completados en el HTML.");
      }
  
      pendientesContainer.innerHTML = "";
      completadosContainer.innerHTML = "";
  
      serviciosPendientes.forEach(servicio => {
        const card = crearCardServicio(servicio, "pendiente");
        pendientesContainer.appendChild(card);
      });
  
      serviciosCompletados.forEach(servicio => {
        const card = crearCardServicio(servicio, "completado");
        completadosContainer.appendChild(card);
      });
  
    } catch (error) {
      console.error("❌ Error al cargar el perfil del cliente:", error);
    }
  }
let currentRating = 0;

// Crear estrellas dinámicamente
function inicializarEstrellas() {
  const starsContainer = document.getElementById("ratingStars");
  starsContainer.innerHTML = ""; // Limpia si existían

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("i");
    star.classList.add("fas", "fa-star", "star");
    star.dataset.value = i;

    star.addEventListener("mouseover", () => pintarEstrellas(i));
    star.addEventListener("mouseout", () => pintarEstrellas(currentRating));
    star.addEventListener("click", () => {
      currentRating = i;
      pintarEstrellas(currentRating);
    });

    starsContainer.appendChild(star);
  }
}

// Pintar estrellas según rating
function pintarEstrellas(valor) {
  const stars = document.querySelectorAll("#ratingStars .star");
  stars.forEach(star => {
    star.classList.remove("selected");
    if (parseInt(star.dataset.value) <= valor) {
      star.classList.add("selected");
    }
  });
}

// Abrir modal y preparar estrellas
function abrirModalCalificacion(idAliado) {
  console.log("⭐ Abrir modal para calificar al aliado:", idAliado);
  document.getElementById('idAliadoCalificar').value = idAliado;
  currentRating = 0;
  inicializarEstrellas();
  pintarEstrellas(0);

  const modal = new bootstrap.Modal(document.getElementById('modalCalificar'));
  modal.show();
}
function crearCardServicio(servicio, estado) {
    const col = document.createElement("div");
    col.classList.add("col-md-6", "mb-3");
  
    col.innerHTML = `
      <div class="card shadow-sm ${estado === 'pendiente' ? 'border-warning' : 'border-success'}">
        <div class="card-body">
          <h5 class="card-title">${servicio.nombre_servicio}</h5>
          <p class="card-text">
            <i class="fas fa-user"></i> Atendido por: 
            <strong>${servicio.aliado_nombre} ${servicio.aliado_apellido}</strong>
          </p>
          <div class="text-center">
            <img src="${servicio.aliado_foto || '../imagenes/acceso.png'}" 
                 class="rounded-circle aliado-img" 
                 alt="Foto aliado" height="100">
          </div>
          ${estado === 'pendiente' ? `
            <button class="btn btn-warning btn-sm mt-2 fw-semibold finalizar-servicio" data-id="${servicio.id_servicio_cliente}">
              Finalizar Servicio
            </button>
            <a href="https://wa.me/${servicio.telefono_sin_formato}?text=Hola%2C%20quisiera%20consultar%20sobre%20el%20servicio%20de%20${encodeURIComponent(servicio.nombre_servicio)}" 
             target="_blank" 
             class="btn btn-success btn-sm mt-2 whatsapp-chat">
            <i class="fab fa-whatsapp"></i> Chat WhatsApp
          </a>
          ` : ''}
        </div>
      </div>
    `;
  
    // Si el servicio está pendiente, añadir listener al botón
    if (estado === 'pendiente') {
      setTimeout(() => { // para asegurarte que esté en el DOM
        const btn = col.querySelector(".finalizar-servicio");
        if (btn) {
          btn.addEventListener("click", async () => {
            await finalizarServicio(servicio.id_servicio_cliente, servicio.id_aliado);
          });
        }
      }, 0);
    }
  
    return col;
}
async function finalizarServicio(idServicioCliente, idAliado) {
    if (!confirm("¿Estás seguro que quieres finalizar este servicio?")) return;
  
    try {
      const response = await fetch(`http://localhost:4000/api/cliente/finalizar-servicio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idServicioCliente })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert("✅ Servicio finalizado correctamente.");
  
        // 🔥 Abrir el modal de calificación automáticamente
        abrirModalCalificacion(idAliado);
  
        loadClientProfile(); // Recargar perfil (si quieres refrescar los servicios también)
      } else {
        alert(`❌ No se pudo finalizar: ${data.message}`);
      }
  
    } catch (error) {
      console.error("❌ Error al finalizar servicio:", error);
      alert("Ocurrió un error. Inténtalo nuevamente.");
    }
}
  
// Enviar calificación
document.getElementById("formCalificacion").addEventListener("submit", async (e) => {
  e.preventDefault();

  const idAliado = document.getElementById("idAliadoCalificar").value;
  const comentario = document.getElementById("comentario").value.trim();

  if (currentRating === 0) {
    alert("Por favor selecciona una calificación antes de enviar.");
    return;
  }

  try {
    const response = await fetch("http://localhost:4000/api/aliado/calificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id_aliado: idAliado,
        calificacion: currentRating,
        comentario: comentario
      })
    });

    const data = await response.json();
    if (response.ok) {
      alert("✅ ¡Calificación enviada con éxito!");
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalCalificar'));
      modal.hide();
    } else {
      alert(`❌ Error: ${data.message}`);
    }
  } catch (error) {
    console.error("❌ Error al enviar calificación:", error);
    alert("Ocurrió un error al enviar tu calificación.");
  }
});
  // 🚪 **Lógica para cerrar sesión**
function logout() {
    fetch("http://localhost:4000/api/cliente/logout", {
        method: "POST",
        credentials: "include" // Incluir cookies en la solicitud
    })
    .then(response => response.json())
    .then(data => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = data.redirect || "/";
    })
    .catch(error => {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar la sesión correctamente.");
    });
}

// **Ejecutar cuando la página cargue**
document.addEventListener("DOMContentLoaded", () => {
    loadClientProfile();

    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
});

// 📸 **Subir imagen de perfil**
async function uploadProfileImage(event) {
    const fileInput = document.getElementById("fotoPerfil");
    const file = fileInput.files[0];

    let clienteId = sessionStorage.getItem("clienteId") || localStorage.getItem("clienteId");

    if (!clienteId) {
        console.warn("⚠️ ID del cliente no encontrado. Intentando recargar perfil...");
        await loadClientProfile();
        clienteId = sessionStorage.getItem("clienteId") || localStorage.getItem("clienteId");
    }

    if (!file) {
        alert("Por favor selecciona una imagen.");
        return;
    }

    if (!clienteId) {
        alert("No se encontró el ID del cliente. Inicia sesión nuevamente.");
        window.location.href = "/cliente";
        return;
    }

    const formData = new FormData();
    formData.append("fotoPerfil", file);
    formData.append("clienteId", clienteId);

    try {
        console.log("📤 Enviando imagen al servidor...");
        const response = await fetch("http://localhost:4000/api/cliente/uploadImage", {
            method: "POST",
            body: formData
        });

        const text = await response.text(); // Capturar respuesta como texto
        console.log("📡 Respuesta cruda del servidor:", text);

        // Verificar si la respuesta es un JSON válido
        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            throw new Error("La respuesta no es un JSON válido.");
        }

        if (response.ok) {
            document.getElementById("profileImage").src = data.fotoPerfil || "/imagenes/default-profile.png";
            alert("Imagen de perfil actualizada con éxito.");
        } else {
            alert(data.error || "Error al subir la imagen.");
        }
    } catch (error) {
        console.error("❌ Error al subir la imagen:", error);
        alert("Error al subir la imagen. Intenta de nuevo.");
    }
}
async function cargarMisSolicitudes() { 
  const container = document.getElementById("solicitudesContainer");

  try {
    const response = await fetch("http://localhost:4000/api/cliente/mis-necesidades", {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("No se pudieron cargar tus solicitudes");
    }

    const solicitudes = await response.json();
    container.innerHTML = "";

    if (solicitudes.length === 0) {
      container.innerHTML = "<p class='text-muted text-center'>Aún no has publicado solicitudes.</p>";
      return;
    }

    solicitudes.forEach((solicitud) => {
      const col = document.createElement("div");
      col.classList.add("col-md-6", "col-lg-4", "mb-4");

      // Validar fecha_publicacion
      let fechaFormateada = "No definida";
      if (solicitud.fecha_tentativa) {
        const fecha = new Date(solicitud.fecha_tentativa.replace(" ", "T"));
        if (!isNaN(fecha)) {
          fechaFormateada = fecha.toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric"
          });
        }
      }
      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          ${solicitud.imagen_destacada ? `<img src="${solicitud.imagen_destacada}" class="card-img-top" alt="Imagen del servicio">` : ""}
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold">${solicitud.especialidad_requerida}</h5>
            <p class="card-text">
              ${solicitud.descripcion.length > 80 ? solicitud.descripcion.slice(0, 80) + "..." : solicitud.descripcion}
            </p>
            <p class="card-text"><i class="fas fa-map-marker-alt"></i> ${solicitud.zona}</p>
            <p class="card-text"><i class="fas fa-calendar-alt"></i> ${new Date(solicitud.fecha_tentativa.replace(" ", "T")).toLocaleDateString('es-CO')}</p>
            <div class="mt-auto text-center">
              <button class="btn btn-outline-warning btn-sm w-75" onclick="mostrarDetalle(${solicitud.id_publicacion})">Ver Detalle</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(col);
    });

  } catch (error) {
    console.error("❌ Error al cargar solicitudes:", error);
    container.innerHTML = "<p class='text-danger text-center'>No se pudieron cargar tus solicitudes.</p>";
  }
}
async function mostrarDetalle(idPublicacion) {
  try {
    const response = await fetch(`http://localhost:4000/api/cliente/necesidad/${idPublicacion}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Error al obtener detalle de la solicitud.");
    }

    const solicitud = await response.json();
    console.log("📝 Detalle de la solicitud:", solicitud);

    const modalBody = document.querySelector("#detalleModal .modal-body");

    // Crear galería de imágenes
    let imagenesHTML = "";
    if (solicitud.imagenes && solicitud.imagenes.length > 0) {
      imagenesHTML = solicitud.imagenes.map(img => `
        <img src="${img.ruta_imagen}" 
             class="img-fluid rounded mb-2" 
             style="max-height: 200px; object-fit: cover;">
      `).join("");
    } else {
      imagenesHTML = `<p class="text-muted">No hay imágenes disponibles.</p>`;
    }

    modalBody.innerHTML = `
      <p><strong>Descripción:</strong> ${solicitud.descripcion}</p>
      <p><strong>Zona:</strong> ${solicitud.zona}</p>
      <p><strong>Fecha tentativa:</strong> ${solicitud.fecha_tentativa ? new Date(solicitud.fecha_tentativa).toISOString().split("T")[0] : "No definida"}</p>
      <p><strong>Presupuesto:</strong> $${solicitud.presupuesto || "Sin definir"}</p>
      <p><strong>Urgencia:</strong> ${solicitud.urgencia}</p>
      <div class="mt-3">${imagenesHTML}</div>
    `;

    const modal = new bootstrap.Modal(document.getElementById("detalleModal"));
    modal.show();

  } catch (error) {
    console.error("❌ Error al mostrar detalle:", error);
  }
}

document.addEventListener("DOMContentLoaded", cargarMisSolicitudes);


