async function loadProfileData() {
    console.log("🔄 Cargando perfil...");

    try {
        const response = await fetch("http://localhost:4000/api/aliado/perfil", {
            method: "GET",
            credentials: "include", // ✅ Enviar cookies de autenticación
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.status === 401 || response.status === 403) {
            console.warn("⚠️ No autorizado. Redirigiendo al inicio de sesión.");
            alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            window.location.href = "/";
            return;
        }

        const data = await response.json();
        console.log("✅ Perfil cargado:", data);

        if (!data.aliado || !data.aliado.id_aliado) {
            throw new Error("Datos del aliado no encontrados.");
        }

        // ✅ Actualiza la información personal
        document.getElementById("nombreAliado").textContent = `${data.aliado.nombre} ${data.aliado.apellido}`;
        document.getElementById("telefonoAliado").textContent = data.aliado.telefono;
        document.getElementById("emailAliado").textContent = data.aliado.email;

        // ✅ Cargar foto de perfil si existe
        const profileImage = document.getElementById("profileImage");
        profileImage.src = data.aliado.foto ? data.aliado.foto : "/imagenes/acceso.png";

        // ✅ Renderizar experiencia laboral
        const habilidadesContainer = document.getElementById("habilidadesAliado");
        const experienciaContainer = document.getElementById("experienciaAliado");

        habilidadesContainer.innerHTML = "";
        experienciaContainer.innerHTML = "";

        if (data.experiencia && data.experiencia.length > 0) {
            data.experiencia.forEach(exp => {
                // 🔥 Agregar puesto a habilidades
                const puestoElement = document.createElement("li");
                puestoElement.innerHTML = `<strong>${exp.puesto}</strong>`;
                habilidadesContainer.appendChild(puestoElement);

                // 🔥 Agregar descripción a experiencia
                const descripcionElement = document.createElement("p");
                descripcionElement.textContent = exp.descripcion;
                experienciaContainer.appendChild(descripcionElement);
            });
        } else {
            habilidadesContainer.innerHTML = "<p>No se encontraron habilidades registradas.</p>";
            experienciaContainer.innerHTML = "<p>No se encontró experiencia laboral registrada.</p>";
        }

    } catch (error) {
        console.error("❌ Error al cargar la información del perfil:", error);
        alert("Error al cargar la información del perfil. Inicia sesión nuevamente.");
        window.location.href = "/";
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
    const aliadoId = sessionStorage.getItem("aliadoId") || localStorage.getItem("aliadoId");

    if (!file) {
        alert("Por favor selecciona una imagen.");
        return;
    }

    if (!aliadoId) {
        alert("No se encontró el ID del aliado. Inicia sesión nuevamente.");
        return;
    }

    const formData = new FormData();
    formData.append("fotoPerfil", file);
    formData.append("aliadoId", aliadoId); // Enviar el ID del aliado

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
        console.error("Error al subir la imagen:", error);
        alert("Error al subir la imagen. Intenta de nuevo.");
    }
}
