document.addEventListener('DOMContentLoaded', async () => {
    // 💡 Lógica para los iconos de los servicios en la página del Cliente
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
    if (container) {
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
    }

    // 💡 Lógica para cargar los aliados en la página específica del servicio
    const urlParams = new URLSearchParams(window.location.search);
    const servicioId = urlParams.get("servicioId");
    const servicioNombre = urlParams.get("servicioNombre");

    const serviceTitle = document.getElementById("serviceTitle");
    if (serviceTitle) {
        serviceTitle.textContent = servicioId 
            ? `Aliados que ofrecen el servicio de ${servicioNombre}` 
            : "Servicio no especificado.";
    }

    if (!servicioId) return;

    try {
        const response = await fetch(`http://localhost:4000/api/servicios/${servicioId}`);
        if (!response.ok) throw new Error("No se encontraron aliados para este servicio.");

        const aliados = await response.json();
        const aliadosContainer = document.getElementById("aliadosContainer");

        if (aliadosContainer) {
            aliadosContainer.innerHTML = aliados.map(aliado => `
                <div class="row mb-3">
                    <div class="col-md-12">
                        <div class="card aliado-card shadow-sm p-3">
                            <div class="card-body d-flex align-items-center">
                                <!-- Imagen del aliado -->
                                <div class="aliado-image-container me-3">
                                    <img src="${aliado.foto || '../imagenes/acceso.png'}" class="aliado-image" alt="Foto de ${aliado.nombre}">
                                </div>
                                
                                <!-- Información del aliado -->
                                <div class="flex-grow-1">
                                    <h5 class="card-title">${aliado.nombre} ${aliado.apellido}</h5>
                                    <p class="card-text">
                                        <i class="fas fa-phone"></i> <strong>Teléfono:</strong> ${aliado.telefono}<br>
                                        <i class="fas fa-envelope"></i> <strong>Email:</strong> ${aliado.email}
                                    </p>
                                </div>
        
                                <!-- Botones de contacto -->
                                <div class="aliado-contact">
                                    <a href="tel:${aliado.telefono}" class="btn btn-warning me-2">
                                        <i class="fas fa-phone-alt"></i> Llamar
                                    </a>
                                    <a href="mailto:${aliado.email}" class="btn btn-dark">
                                        <i class="fas fa-envelope"></i> Email
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        

    } catch (error) {
        console.error("Error al obtener los aliados:", error);
        if (serviceTitle) {
            serviceTitle.textContent = "Error al cargar los aliados.";
        }
    }
});
