async function loadProfileData() {
    console.log("🔄 Cargando perfil del aliado...");

    try {
        // No dependemos solo de sessionStorage/localStorage
        const response = await fetch("http://localhost:4000/api/aliado/perfil", {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("⚠️ No autorizado. Redirigiendo al inicio de sesión.");
                alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
                window.location.href = "/aliado";
                return;
            }
            throw new Error(`Error HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Datos de perfil:", data);

        if (!data.aliado || !data.aliado.id_aliado) {
            throw new Error("Datos del aliado no encontrados en el backend.");
        }

        // Guardamos el ID en session/localStorage
        sessionStorage.setItem("aliadoId", data.aliado.id_aliado);
        localStorage.setItem("aliadoId", data.aliado.id_aliado);

        // Mostrar datos del aliado
        document.getElementById("nombreAliado").textContent = `${data.aliado.nombre} ${data.aliado.apellido}`;
        document.getElementById("telefonoAliado").textContent = data.aliado.telefono || "No registrado";
        document.getElementById("emailAliado").textContent = data.aliado.email;
        document.getElementById("profileImage").src = data.aliado.foto || "/imagenes/acceso.png";

        // Cargar experiencia
        const habilidadesContainer = document.getElementById("habilidadesYExperiencia");
        habilidadesContainer.innerHTML = data.experiencia.length
            ? data.experiencia.map(exp => `<p>🛠 <strong>${exp.puesto}</strong> – ${exp.descripcion}</p>`).join("")
            : "<p class='text-muted'>No se encontraron habilidades registradas.</p>";

        // Cargar servicios solicitados
        loadServiciosSolicitados(data.serviciosSolicitados);

        // Cargar calificaciones
        cargarCalificacionesAliado(data.aliado.id_aliado);

    } catch (error) {
        console.error("❌ Error al cargar el perfil:", error);
    }
}

// 📌 **Cargar los servicios solicitados al aliado**
async function loadServiciosSolicitados() {
    console.log("🔄 Cargando servicios solicitados...");

    try {
        const response = await fetch("http://localhost:4000/api/aliado/perfil", {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("❌ No se pudieron cargar los servicios solicitados.");
        }

        const data = await response.json();
        console.log("✅ Servicios solicitados:", data.serviciosSolicitados);

        const servicesContainer = document.getElementById("servicesContainer");
        servicesContainer.innerHTML = ""; // Limpiar contenido previo

        if (data.serviciosSolicitados.length > 0) {
            data.serviciosSolicitados.forEach(servicio => {
                const col = document.createElement("div");
                col.classList.add("col-md-6", "mb-3");

                col.innerHTML = `
                <div class="card shadow-sm">
                    <div class="card-body">
                        <div class="text-center">
                            <img src="${servicio.cliente_foto || '../imagenes/acceso.png'}" 
                                 class="rounded-circle aliado-img" 
                                 alt="Cliente que solicitó el servicio" height="100">
                        </div>
                        <h5 class="card-title">${servicio.nombre_servicio}</h5>
                        <p class="card-text">
                            <i class="fas fa-user"></i> Cliente: <strong>${servicio.cliente_nombre} ${servicio.cliente_apellido}</strong><br>
                            <i class="fas fa-phone"></i> Teléfono: ${servicio.cliente_telefono}<br>
                            <i class="fas fa-envelope"></i> Email: ${servicio.cliente_email}
                        </p>
                        <div class="text-center mt-3">
                            <button class="btn btn-warning iniciar-chat-btn" data-cliente-id="${servicio.id_cliente}" data-cliente-nombre="${servicio.cliente_nombre}">
                                <i class="fas fa-comments"></i> Chatear
                            </button>
                        </div>
                    </div>
                </div>
            `;            
                servicesContainer.appendChild(col);
            });
        } else {
            servicesContainer.innerHTML = "<p class='text-muted'>No tienes solicitudes de servicios aún.</p>";
        }

    } catch (error) {
        console.error("❌ Error al cargar los servicios solicitados:", error);
    }
}
// 🚪 **Lógica para cerrar sesión**
function logout() {
    fetch("http://localhost:4000/api/aliado/logout", {
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
    loadProfileData();

    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
});

// 📸 **Subir imagen de perfil**
async function uploadProfileImage(event) {
    const fileInput = document.getElementById("fotoPerfil");
    const file = fileInput.files[0];

    // 🛠 Intentar obtener el ID del aliado
    let aliadoId = sessionStorage.getItem("aliadoId") || localStorage.getItem("aliadoId");

    // 🚀 Si no existe, intentar recargar el perfil antes de fallar
    if (!aliadoId) {
        console.warn("⚠️ ID del aliado no encontrado. Intentando recargar perfil...");
        await loadProfileData();  
        aliadoId = sessionStorage.getItem("aliadoId") || localStorage.getItem("aliadoId");
    }

    if (!file) {
        alert("Por favor selecciona una imagen.");
        return;
    }

    if (!aliadoId) {
        alert("No se encontró el ID del aliado. Inicia sesión nuevamente.");
        window.location.href = "/"; 
        return;
    }

    const formData = new FormData();
    formData.append("fotoPerfil", file);
    formData.append("aliadoId", aliadoId); 

    try {
        const response = await fetch("http://localhost:4000/api/register/aliado/loadImages", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

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
// Logica para el chat
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("iniciar-chat-btn")) {
        const clienteId = event.target.getAttribute("data-cliente-id");
        const clienteNombre = event.target.getAttribute("data-cliente-nombre");

        // Abrir el chat con el cliente
        iniciarChat(clienteId, clienteNombre);
    }
});

function iniciarChat(clienteId, clienteNombre) {
    console.log(`💬 Iniciando chat con ${clienteNombre} (ID: ${clienteId})`);

    // Aquí podrías redirigir a una página específica de chat o abrir un modal
    window.location.href = `/chat?clienteId=${clienteId}&clienteNombre=${clienteNombre}`;
}
async function cargarPlan() {
  try {
    const res = await fetch("/api/aliado/perfil", { credentials: "include" });
    const data = await res.json();

    const idSuscripcion = data.aliado.id_suscripcion;
    const planBadge = document.getElementById("planActual");
    const mejorarTexto = document.getElementById("mejorarPlanTexto"); // <-- agregamos esta línea

    switch (idSuscripcion) {
      case 1:
        planBadge.textContent = "BÁSICO";
        planBadge.className = "badge bg-success fs-5 mt-2";
        if (mejorarTexto) mejorarTexto.classList.remove("d-none");
        break;
      case 2:
        planBadge.textContent = "INTERMEDIO";
        planBadge.className = "badge bg-primary fs-5 mt-2";
        if (mejorarTexto) mejorarTexto.classList.remove("d-none");
        break;
      case 3:
        planBadge.textContent = "PREMIUM";
        planBadge.className = "badge bg-warning text-dark fs-5 mt-2";
        if (mejorarTexto) mejorarTexto.classList.add("d-none"); // 🔥 Ocultar si es premium
        break;
      default:
        planBadge.textContent = "Desconocido";
        planBadge.className = "badge bg-danger fs-5 mt-2";
        if (mejorarTexto) mejorarTexto.classList.remove("d-none");
        break;
    }

  } catch (err) {
    console.error("Error al obtener plan del aliado:", err);
  }
  await cargarContadorDestacados();
}

async function elegirPlan(idSuscripcion) {
    try {
        // 🔍 Verificar si el aliado está autenticado
        const authCheck = await fetch("/api/aliado/perfil", {
            method: "GET",
            credentials: "include"
        });

        if (authCheck.status === 401 || authCheck.status === 403) {
            alert("⚠️ Debes iniciar sesión o registrarte antes de elegir un plan.");
            window.location.href = "/form";
            return;
        }

        // 📥 Continuar con la suscripción
        const res = await fetch("/api/aliado/suscribirse", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_suscripcion: idSuscripcion })
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ Te has suscrito correctamente.");
            window.location.href = "/hazteConocer";
        } else {
            alert(`❌ Error: ${data.message}`);
        }

    } catch (error) {
        console.error("❌ Error al suscribirse:", error);
        alert("No se pudo completar la suscripción.");
    }
}
async function cargarContadorDestacados() {
    try {
      console.log("🔁 Intentando fetch de destacados...");
  
      const res = await fetch("/api/aliado/destacados/contador", {
        method: "GET",
        credentials: "include"
      });
  
      console.log("🌐 Fetch realizado. Status:", res.status);
      if (!res.ok) throw new Error("No se pudo obtener datos de destacados");
  
      const data = await res.json();
      console.log("📦 Datos recibidos:", data);
  
      const contenedor = document.getElementById("destacadosContainer");
      const texto = document.getElementById("textoDestacados");
      const medalla = document.getElementById("medallaPremium");
  
      if (!data.permitido) {
        contenedor.classList.remove("d-none");
        texto.innerHTML = `<span class="text-muted">Tu plan actual <strong>no permite destacar</strong> publicaciones.</span>`;
        return;
      }
  
      // Si tiene permitido destacar (solo plan premium)
      contenedor.classList.remove("d-none");
  
      if (data.limite === null || data.limite >= 999) {
        texto.innerHTML = `<strong>Publicaciones destacadas:</strong> Ilimitadas 🎉`;
        medalla.innerHTML = `<i class="fas fa-medal text-warning ms-2" title="Plan Premium"></i>`;
      } else {
        texto.innerHTML = `
          <strong>Usadas:</strong> ${data.usados}<br>
          <strong>Límite según tu plan:</strong> ${data.limite}
        `;
      }
  
    } catch (err) {
      console.error("❌ Error en fetch de destacados:", err);
    }
  }  
async function cargarContadorPublicaciones() {
  try {
    const res = await fetch("http://localhost:4000/api/aliado/perfil", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      console.warn("⚠️ No autorizado para cargar perfil.");
      return;
    }

    const data = await res.json();
    const idSuscripcion = data.aliado.id_suscripcion;
    const contadorDiv = document.getElementById("contadorPublicaciones");

    if (!contadorDiv) return;

    if (idSuscripcion === 3) {
      contadorDiv.textContent = "📦 Publicaciones disponibles: Ilimitadas (Plan Premium)";
      contadorDiv.classList.remove("d-none");
      return;
    }

    // Ahora si es básico o intermedio, pedimos el contador
    const contadorRes = await fetch("/api/aliado/marketplace/contador", {
      method: "GET",
      credentials: "include"
    });

    if (!contadorRes.ok) {
      console.warn("⚠️ No se pudo cargar contador de publicaciones.");
      return;
    }

    const contadorData = await contadorRes.json();
    const usados = contadorData.total || 0;

    let limite = 0;
    let restante = 0;
    let periodo = "";

    if (idSuscripcion === 1) { // Básico
      limite = 3;
      restante = limite - usados;
      periodo = "mes";
    } else if (idSuscripcion === 2) { // Intermedio
      limite = 4;
      restante = limite - usados;
      periodo = "semana";
    }

    if (restante < 0) restante = 0;

    contadorDiv.innerHTML = `📦 Publicaciones disponibles este ${periodo}: <strong>${restante}</strong>`;
    contadorDiv.classList.remove("d-none");

  } catch (err) {
    console.error("❌ Error al cargar contador de publicaciones:", err);
  }
}
async function cargarPublicacionesAliado() {
  const container = document.getElementById("publicacionesAliadoContainer");
  if (!container) return;

  try {
    const res = await fetch("/api/aliado/mis-publicaciones", {
      method: "GET",
      credentials: "include"
    });

    if (res.status === 401 || res.status === 403) {
      console.warn("⚠️ Usuario no autenticado. No se cargarán publicaciones.");
      container.innerHTML = "<p class='text-muted'>Inicia sesión para ver tus publicaciones.</p>";
      return;
    }

    if (!res.ok) {
      console.warn("⚠️ No se pudieron cargar publicaciones:", res.status);
      container.innerHTML = "<p class='text-muted'>No se pudieron cargar tus publicaciones.</p>";
      return;
    }

    const publicaciones = await res.json();
    container.innerHTML = "";

    if (publicaciones.length === 0) {
      container.innerHTML = "<p class='text-muted'>Aún no has publicado materiales en el Marketplace.</p>";
      return;
    }
    publicaciones.forEach(pub => {
      const card = document.createElement("div");
      card.classList.add("w-100","col-md-6", "mb-4");
    
      card.innerHTML = `
        <div class="card shadow-sm h-100">
          ${pub.ruta_imagen ? `<img src="${pub.ruta_imagen}" class="card-img-top" alt="Imagen de publicación">` : ""}
          <div class="card-body">
            <h5 class="card-title fw-bold">${pub.titulo}</h5>
            <p class="card-text">${pub.descripcion.length > 80 ? pub.descripcion.slice(0, 80) + "..." : pub.descripcion}</p>
            <p class="card-text"><i class="fas fa-map-marker-alt"></i> ${pub.zona}</p>
            <p class="card-text fw-semibold">$${parseInt(pub.precio).toLocaleString('es-CO')}</p>
            <small class="text-muted">Publicado el ${new Date(pub.fecha_publicacion).toLocaleDateString('es-CO')}</small>
          </div>
        </div>
      `;
      
      container.appendChild(card);
    });
    
  } catch (error) {
    console.error("❌ Error al cargar publicaciones del aliado:", error);
    container.innerHTML = "<p class='text-muted'>Error al cargar tus publicaciones.</p>";
  }
}
async function cargarCalificacionesAliado(idAliado) {
  try {
    const response = await fetch(`http://localhost:4000/api/aliado/${idAliado}/calificaciones`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("No se pudieron cargar las calificaciones");

    const calificaciones = await response.json();
    const contenedor = document.getElementById("calificacionesAliado");

    contenedor.innerHTML = "";

    if (calificaciones.length === 0) {
      contenedor.innerHTML = "<p class='text-muted'>Aún no tienes calificaciones.</p>";
      return;
    }

    calificaciones.forEach(calificacion => {
      const card = document.createElement("div");
      card.classList.add("card", "mb-3", "shadow-sm");

      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${calificacion.cliente_nombre} ${calificacion.cliente_apellido}</h5>
          <p class="card-text">
            <strong>Calificación:</strong> ${"⭐".repeat(calificacion.calificacion)} (${calificacion.calificacion}/5)<br>
            <strong>Comentario:</strong> ${calificacion.comentario || "Sin comentario"}<br>
            <small class="text-muted">${new Date(calificacion.fecha).toLocaleDateString('es-CO')}</small>
          </p>
        </div>
      `;

      contenedor.appendChild(card);
    });

  } catch (error) {
    console.error("❌ Error al cargar calificaciones:", error);
  }
}

  document.addEventListener("DOMContentLoaded", () => {
    cargarPlan();
    cargarContadorPublicaciones();
    cargarPublicacionesAliado();
  });
  
  