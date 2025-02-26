async function loadProfileData() {
    const aliadoId = localStorage.getItem("aliadoId");
    
    if (!aliadoId) {
        console.error("ID del aliado no encontrado.");
        return;
    }

    try {
        // Cargar datos personales
        const response = await fetch(`http://localhost:4000/api/aliado/${aliadoId}`);
        if (!response.ok) {
            throw new Error("No se pudo obtener la información del aliado.");
        }

        const data = await response.json();
        document.getElementById("profileImage").src = data.fotoPerfil || "/imagenes/acceso.png";
        document.getElementById("nombreAliado").textContent = `${data.nombre} ${data.apellido}`;
        document.getElementById("telefonoAliado").textContent = data.telefono;
        document.getElementById("emailAliado").textContent = data.email;

        // Cargar habilidades y experiencia laboral
        await loadExperienceData(aliadoId);

    } catch (error) {
        console.error("Error al cargar la información del perfil:", error);
    }
}

async function loadExperienceData(aliadoId) {
    try {
        const response = await fetch(`http://localhost:4000/api/aliado/experiencia/${aliadoId}`);
        if (!response.ok) {
            throw new Error("No se pudo obtener la experiencia laboral.");
        }

        const experienciaData = await response.json();

        // Mapear habilidades y experiencia
        const habilidades = experienciaData.map(item => item.puesto).join(", ");
        const experiencia = experienciaData.map(item => item.descripcion).join(". ");

        document.getElementById("habilidadesAliado").textContent = habilidades || "No especificadas";
        document.getElementById("experienciaAliado").textContent = experiencia || "Sin experiencia registrada";

    } catch (error) {
        console.error("Error al cargar la experiencia laboral:", error);
    }
}

// Llamar la función cuando la página cargue
document.addEventListener("DOMContentLoaded", loadProfileData);


// Para la foto
async function uploadProfileImage(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor selecciona una imagen.");
        return;
    }

    const formData = new FormData();
    formData.append("fotoPerfil", file);

    try {
        const response = await fetch("http://localhost:4000/api/register/aliado/loadImages", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Error al subir la imagen.");
        }

        const data = await response.json();

        if (data.fotoPerfil) {
            document.getElementById('profileImage').src = data.fotoPerfil;
            alert("Imagen de perfil actualizada con éxito.");
        } else {
            alert("No se pudo obtener la URL de la imagen.");
        }

    } catch (error) {
        console.error("Error al subir la imagen:", error);
        alert("Error al subir la imagen. Intenta de nuevo.");
    }
}

