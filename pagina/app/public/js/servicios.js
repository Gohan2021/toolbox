document.addEventListener("DOMContentLoaded", async () => {
    // Obtener el ID del servicio desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const servicioId = urlParams.get("servicioId");
    const servicioNombre = urlParams.get("servicioNombre");

    // Mostrar el nombre del servicio en la página
    const serviceTitle = document.getElementById("serviceTitle");
    serviceTitle.textContent = `Aliados que ofrecen el servicio de ${servicioNombre}`;

    if (!servicioId) {
        serviceTitle.textContent = "Servicio no especificado.";
        return;
    }

    try {
        // Hacer la petición al backend para obtener los aliados
        const response = await fetch(`http://localhost:4000/api/servicios/${servicioId}`);
        if (!response.ok) {
            throw new Error("No se encontraron aliados para este servicio.");
        }

        const aliados = await response.json();
        const aliadosContainer = document.getElementById("aliadosContainer");

        aliadosContainer.innerHTML = aliados.map(aliado => `
            <div class="col-md-4">
                <div class="card mb-4 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">${aliado.nombre} ${aliado.apellido}</h5>
                        <p class="card-text">
                            <strong>Teléfono:</strong> ${aliado.telefono}<br>
                            <strong>Email:</strong> ${aliado.email}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error al obtener los aliados:", error);
        serviceTitle.textContent = "Error al cargar los aliados.";
    }
});