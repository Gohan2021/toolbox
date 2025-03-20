document.addEventListener('DOMContentLoaded', async () => {
    const searchForm = document.getElementById("serviceSearchForm");
    const searchInput = document.getElementById("searchServiceInput");

    // Lista de servicios con sus enlaces
    const servicesSearch = {
        "plomería": "/servicios/plomeria?servicioId=1&servicioNombre=Plomería",
        "electricidad": "/servicios/electricidad?servicioId=2&servicioNombre=Electricidad",
        "carpintería": "/servicios/carpinteria?servicioId=3&servicioNombre=Carpintería",
        "enchape y acabados": "/servicios/enchape?servicioId=4&servicioNombre=Enchape",
        "estructuras metálicas": "/servicios/metalicas?servicioId=5&servicioNombre=Estructuras Metálicas",
        "pintura y acabados": "/servicios/pintura?servicioId=6&servicioNombre=Pintura y acabados",
        "cerrajería": "/servicios/cerrajeria?servicioId=7&servicioNombre=Cerrajería",
        "refrigeración y aire acondicionado": "/servicios/refrigeracion?servicioId=8&servicioNombre=Refrigeración y aire acondicionado",
        "jardinería y paisajismo": "/servicios/jardineria?servicioId=9&servicioNombre=Jardinería y paisajismo",
        "obras civiles": "/servicios/obras?servicioId=10&servicioNombre=Obras Civiles"
    };

    if (searchForm) {
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault(); // Evita el comportamiento por defecto del formulario
            
            const query = searchInput.value.trim().toLowerCase();

            if (!query) {
                alert("Por favor, ingresa el nombre de un servicio.");
                return;
            }

            if (servicesSearch[query]) {
                window.location.href = servicesSearch[query];
            } else {
                alert("No se encontró el servicio solicitado.");
            }
        });
    }
    // 💡 Carga de los servicios en la página del Cliente
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

    // 💡 Carga de los aliados en la página específica del servicio
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
            aliadosContainer.innerHTML = aliados.map(aliado => {
                console.log("🔍 Aliado encontrado:", aliado);

                return `
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

                                    <!-- Botones de acción -->
                                    <div class="aliado-buttons">
                                        <button class="btn btn-outline-dark me-2 ver-detalle-btn"
                                            data-id="${aliado.id_aliado}"
                                            data-bs-toggle="modal" 
                                            data-bs-target="#aliadoModal">
                                            <i class="fas fa-info-circle"></i> Ver más detalle
                                        </button>
                                        <button class="btn btn-warning" onclick="obtenerServicio(${aliado.id_aliado}, ${servicioId})">
                                            <i class="fas fa-handshake"></i> Obtener servicio
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        // ✅ Agregar eventos a los botones "Ver más detalle" después de renderizar el DOM
        document.querySelectorAll('.ver-detalle-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id_aliado = this.getAttribute("data-id");
                console.log("🟡 ID del aliado recibido en el evento click:", id_aliado);
                await mostrarDetalleAliado(id_aliado);
            });
        });
    } catch (error) {
        console.error("Error al obtener los aliados:", error);
        if (serviceTitle) {
            serviceTitle.textContent = "Error al cargar los aliados.";
        }
    }
});

/**
 * 🔍 **Función global para obtener la información del aliado y mostrarla en el modal.**
 */
async function mostrarDetalleAliado(id_aliado) {
    console.log("🟡 Buscando información del aliado con ID:", id_aliado);

    try {
        if (!id_aliado) {
            throw new Error("❌ El ID del aliado es inválido o no se ha recibido correctamente.");
        }

        const response = await fetch(`http://localhost:4000/api/aliado/${id_aliado}`);
        if (!response.ok) throw new Error("❌ Error al cargar los datos del aliado");

        const data = await response.json();
        if (!data.aliado) throw new Error("❌ No se encontraron datos del aliado.");

        // Llenar el modal con la información del aliado
        document.getElementById("modalProfileImage").src = data.aliado.foto || "../imagenes/acceso.png";
        document.getElementById("modalNombreAliado").textContent = `${data.aliado.nombre} ${data.aliado.apellido}`;
        document.getElementById("modalTelefonoAliado").textContent = data.aliado.telefono;
        document.getElementById("modalEmailAliado").textContent = data.aliado.email;

        // Cargar habilidades y experiencia
        const habilidadesYExperiencia = document.getElementById("modalHabilidadesYExperiencia");
        habilidadesYExperiencia.innerHTML = data.experiencia.map(exp => `
            <p><strong>${exp.puesto}:</strong> ${exp.descripcion}</p>
        `).join('') || "<p class='text-muted'>No se encontró experiencia laboral registrada.</p>";

    } catch (error) {
        console.error("❌ Error al obtener los detalles del aliado:", error);
        alert("No se pudo cargar la información del aliado.");
    }
}
// obtener servicio
async function obtenerServicio(aliadoId, servicioId) {
    console.log("🟡 Intentando obtener servicio con ID:", servicioId, " y aliado ID:", aliadoId);

    let clienteId = sessionStorage.getItem("clienteId") || localStorage.getItem("clienteId");

    if (!clienteId) {
        console.warn("⚠️ Cliente no autenticado. Redirigiendo al login.");
        alert("Debes iniciar sesión para solicitar un servicio.");
        window.location.href = "/cliente";
        return;
    }

    try {
        const response = await fetch("http://localhost:4000/api/cliente/obtenerServicio", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ clienteId, aliadoId, servicioId })
        });

        const data = await response.json();
        console.log("📡 Respuesta del servidor:", data);

        if (response.ok) {
            alert("✅ Servicio solicitado correctamente con el aliado.");
        } else {
            alert(`❌ Error al solicitar el servicio: ${data.message}`);
        }
    } catch (error) {
        console.error("❌ Error al solicitar el servicio:", error);
        alert("Ocurrió un error al procesar la solicitud.");
    }
}

