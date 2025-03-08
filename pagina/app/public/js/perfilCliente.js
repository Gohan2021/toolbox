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

    } catch (error) {
        console.error("❌ Error al cargar el perfil del cliente:", error);
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
