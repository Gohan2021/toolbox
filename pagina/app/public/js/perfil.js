async function loadProfileData() {
    // const aliadoId = sessionStorage.getItem("aliadoId");

    // if (!aliadoId) {
    //     alert("No se ha encontrado el ID del usuario. Por favor, inicie sesión.");
    //     window.location.href = "/";
    //     return;
    try {
        const response = await fetch("http://localhost:4000/api/aliado/perfil", {
            method: "GET",
            credentials: "include" // Incluir las cookies en la solicitud
            
        });

        if (!response.ok) {
            alert("No autorizado. Redirigiendo al inicio de sesión.");
            window.location.href = "/";
            return;
        }

        const data = await response.json();

        // Cargar la información del perfil
        document.getElementById("nombreAliado").textContent = `${data.aliado.nombre} ${data.aliado.apellido}`;
        document.getElementById("telefonoAliado").textContent = data.aliado.telefono;
        document.getElementById("emailAliado").textContent = data.aliado.email;

        // Cargar la foto de perfil si existe
        if (data.aliado.foto) {
            document.getElementById("profileImage").src = data.aliado.foto;
        }

        // Renderizar la experiencia laboral
        const habilidadesContainer = document.getElementById("habilidadesAliado");
        const experienciaContainer = document.getElementById("experienciaAliado");

        habilidadesContainer.innerHTML = "";
        experienciaContainer.innerHTML = "";

        if (data.experiencia && data.experiencia.length > 0) {
            data.experiencia.forEach(exp => {
                const puestoElement = document.createElement("li");
                puestoElement.textContent = exp.puesto;
                habilidadesContainer.appendChild(puestoElement);

                const descripcionElement = document.createElement("li");
                descripcionElement.textContent = exp.descripcion;
                experienciaContainer.appendChild(descripcionElement);
            });
        } else {
            habilidadesContainer.innerHTML = "<p>No se encontraron habilidades registradas.</p>";
            experienciaContainer.innerHTML = "<p>No se encontró experiencia laboral registrada.</p>";
        }

    } catch (error) {
        console.error("Error al cargar la información del perfil:", error);
    }
}

// 🚪 Lógica para cerrar sesión
function logout() {
    fetch("http://localhost:4000/api/logout", {
        method: "POST",
        credentials: "include" // Incluir cookies en la solicitud
    })
    .then(response => response.json())
    .then(data => {
        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar la sesión correctamente.");
    });
}

// Para la foto
async function uploadProfileImage(event) {
    const fileInput = document.getElementById('fotoPerfil');
    const file = fileInput.files[0];
    const aliadoId = sessionStorage.getItem('aliadoId'); // Recuperar el ID del aliado

    if (!file || !aliadoId) {
        alert("Por favor selecciona una imagen e inicia sesión.");
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
            document.getElementById('profileImage').src = data.fotoPerfil;
            alert("Imagen de perfil actualizada con éxito.");
        } else {
            alert(data.error || "Error al subir la imagen.");
        }

    } catch (error) {
        console.error("Error al subir la imagen:", error);
        alert("Error al subir la imagen. Intenta de nuevo.");
    }
}
document.addEventListener("DOMContentLoaded", () => {
    // Cargar los datos del perfil cuando el DOM esté listo
    loadProfileData();

    // Asignar la función al botón de cerrar sesión
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    } else {
        console.error("El botón de cierre de sesión no se encontró en el DOM.");
    }
});


