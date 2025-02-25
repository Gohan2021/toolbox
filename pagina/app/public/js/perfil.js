document.addEventListener("DOMContentLoaded", async () => {
    console.log("Cargando información del perfil...");

    const aliadoId = localStorage.getItem("aliadoId");
    console.log("ID del aliado recuperado:", aliadoId);

    if (!aliadoId) {
        alert("No se ha encontrado información del usuario. Por favor, inicia sesión.");
        window.location.href = "/form";
        return;
    }

    try {
        const response = await fetch(`http://localhost:4000/api/aliado/${aliadoId}`);
        console.log("Respuesta de la API:", response);

        if (!response.ok) {
            throw new Error("No se pudo cargar la información del perfil.");
        }

        const aliado = await response.json();
        console.log("Datos del aliado:", aliado);

        document.getElementById("nombreAliado").textContent = `${aliado.nombre} ${aliado.apellido}`;
        document.getElementById("telefonoAliado").textContent = aliado.telefono;
        document.getElementById("emailAliado").textContent = aliado.email;

        if (aliado.fotoPerfil) {
            document.getElementById("profileImage").src = aliado.fotoPerfil;
        }

    } catch (error) {
        console.error("Error al cargar el perfil del aliado:", error);
        alert("Error al cargar la información del perfil. Intenta nuevamente.");
    }
});
