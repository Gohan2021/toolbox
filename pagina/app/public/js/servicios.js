// iconos de los servicios en la pagina del CLiente
document.addEventListener('DOMContentLoaded', () => {
    // Mapeo de servicios a iconos y rutas
    const services = [
        { name: "Plomería", icon: "fa-solid fa-shower", link: "/servicios/plomeria?servicioId=1&servicioNombre=Plomería" },
        { name: "Electricidad", icon: "fa-solid fa-bolt", link: "/servicios/electricidad?servicioId=2&servicioNombre=Electricidad" },
        { name: "Carpintería", icon: "fa-solid fa-hammer", link: "/servicios/carpinteria?servicioId=3&servicioNombre=Carpintería" },
        { name: "Enchape y acabados", icon: "fa-solid fa-th", link: "/servicios/enchape?servicioId=4&servicioNombre=Enchape" },
        { name: "Estructuras Metálicas", icon: "fa-solid fa-industry", link: "/servicios/metalicas?servicioId=5&servicioNombre=Estructuras Metálicas" },
        { name: "Pintura y acabados", icon: "fa-solid fa-paint-roller", link: "/servicios/pintura?servicioId=6&servicioNombre=Pintura y acabados" },
        { name: "Cerrajería", icon: "fa-solid fa-key", link: "/servicios/cerrajeria?servicioId=7&servicioNombre=Cerrajería" },
        { name: "Refrigeración y aire acondicionado", icon: "fa-solid fa-snowflake", link: "/servicios/refrigeracion?servicioId=8&servicioNombre=Refrigeración y aire acondicionado" },
        { name: "Jardinería y paisajismo", icon: "fa-solid fa-seedling", link: "/servicios/jardineria?servicioId=9&servicioNombre=Jardinería y paisajismo" },
        { name: "Obras Civiles", icon: "fa-solid fa-building", link: "/servicios/obras?servicioId=10&servicioNombre=Obras Civiles" }
    ];

    const container = document.getElementById('servicesContainer');

    services.forEach(service => {
        const col = document.createElement('div');
        col.classList.add('col-md-4', 'mb-4');

        col.innerHTML = `
            <a href="${service.link}" class="text-decoration-none">
                <button class="service-btn btn-light w-100 h-100">
                    <div class="text-center py-3">
                        <i class="${service.icon} service-icon mb-3"></i>
                        <h5 class="card-title">${service.name}</h5>
                    </div>
                </button>
            </a>
        `;
        container.appendChild(col);
    });
});
// Codigo para cada pagina de servicio
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
            <div class="row mb-3">
                <div class="card shadow-sm">
                    <div class="card-body d-flex align-items-center">
                        <div class="flex-grow-1">
                            <h5 class="card-title">${aliado.nombre} ${aliado.apellido}</h5>
                            <p class="card-text">
                                <strong>Teléfono:</strong> ${aliado.telefono}<br>
                                <strong>Email:</strong> ${aliado.email}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error al obtener los aliados:", error);
        serviceTitle.textContent = "Error al cargar los aliados.";
    }
});
