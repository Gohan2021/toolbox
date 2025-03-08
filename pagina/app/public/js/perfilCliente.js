async function loadClientProfile() {
    console.log("🔄 Cargando perfil del cliente...");

    try {
        // 💡 Depurar cookies en el navegador
        console.log("🍪 Verificando cookies del cliente:", document.cookie);

        const response = await fetch("http://localhost:4000/api/cliente/perfil", {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
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

        // 📌 Guardar ID del cliente en `sessionStorage`
        sessionStorage.setItem("clienteId", data.cliente.id_cliente);
        localStorage.setItem("clienteId", data.cliente.id_cliente);

        // Cargar datos personales
        document.getElementById("nombreCliente").textContent = `${data.cliente.nombre} ${data.cliente.apellido}`;
        document.getElementById("telefonoCliente").textContent = data.cliente.telefono;
        document.getElementById("emailCliente").textContent = data.cliente.email;
        document.getElementById("profileImage").src = data.cliente.foto || "/imagenes/acceso.png";

        // Cargar servicios solicitados
        const serviciosContainer = document.getElementById("serviciosSolicitados");
        serviciosContainer.innerHTML = "";

        if (data.servicios && data.servicios.length > 0) {
            data.servicios.forEach(servicio => {
                const li = document.createElement("li");
                li.textContent = `🛠 ${servicio.nombre_servicio}`;
                serviciosContainer.appendChild(li);
            });
        } else {
            serviciosContainer.innerHTML = "<p class='text-muted'>No se encontraron servicios registrados.</p>";
        }

    } catch (error) {
        console.error("❌ Error al cargar el perfil del cliente:", error);
    }
}

// 🚀 Ejecutar cuando la página cargue
document.addEventListener("DOMContentLoaded", loadClientProfile);
