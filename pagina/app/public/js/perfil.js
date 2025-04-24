async function loadProfileData() {
    console.log("🔄 Cargando perfil del aliado...");

    try {
        const response = await fetch("http://localhost:4000/api/aliado/perfil", {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.status === 401 || response.status === 403) {
            console.warn("⚠️ No autorizado. Redirigiendo al inicio de sesión.");
            alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            window.location.href = "/aliado";
            return;
        }

        const data = await response.json();
        console.log("✅ Perfil cargado:", data);

        if (!data.aliado || !data.aliado.id_aliado) {
            throw new Error("Datos del aliado no encontrados.");
        }
        // 🔥 **Asegurar que el ID se guarde en sessionStorage y localStorage**
        if (!sessionStorage.getItem("aliadoId")) {
            sessionStorage.setItem("aliadoId", data.aliado.id_aliado);
        }
        if (!localStorage.getItem("aliadoId")) {
            localStorage.setItem("aliadoId", data.aliado.id_aliado);
        }
        // Cargar datos personales
        document.getElementById("nombreAliado").textContent = `${data.aliado.nombre} ${data.aliado.apellido}`;
        document.getElementById("telefonoAliado").textContent = data.aliado.telefono;
        document.getElementById("emailAliado").textContent = data.aliado.email;
        document.getElementById("profileImage").src = data.aliado.foto || "/imagenes/acceso.png";

        // Cargar habilidades y experiencia combinadas
        const habilidadesContainer = document.getElementById("habilidadesYExperiencia");
        habilidadesContainer.innerHTML = "";

        if (data.experiencia && data.experiencia.length > 0) {
            data.experiencia.forEach(exp => {
                habilidadesContainer.innerHTML += `<p>🛠 <strong>${exp.puesto}</strong> – ${exp.descripcion}</p>`;
            });
        } else {
            habilidadesContainer.innerHTML = "<p class='text-muted'>No se encontraron habilidades registradas.</p>";
        }

        // 📌 Cargar servicios solicitados
        loadServiciosSolicitados();

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
    fetch("http://localhost:4000/api/logout", {
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
  
      // Establecer nombre del plan y clases visuales
      switch (idSuscripcion) {
        case 1:
          planBadge.textContent = "BÁSICO";
          planBadge.className = "badge bg-success fs-5 mt-2";
          break;
        case 2:
          planBadge.textContent = "INTERMEDIO";
          planBadge.className = "badge bg-primary fs-5 mt-2";
          break;
        case 3:
          planBadge.textContent = "PREMIUM";
          planBadge.className = "badge bg-warning text-dark fs-5 mt-2";
          break;
        default:
          planBadge.textContent = "Desconocido";
          planBadge.className = "badge bg-danger fs-5 mt-2";
          break;
      }
  
    } catch (err) {
      console.error("Error al obtener plan del aliado:", err);
    }
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
  document.addEventListener("DOMContentLoaded", cargarPlan);
  