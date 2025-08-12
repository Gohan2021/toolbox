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
  
      let aliados = await response.json();
  
      // Ordenar: tipo suscripción (Premium > Intermedio > Basico) y luego calificacion promedio
      aliados.sort((a, b) => {
        if ((b.id_suscripcion || 0) !== (a.id_suscripcion || 0)) {
          return (b.id_suscripcion || 0) - (a.id_suscripcion || 0);
        }
        return (b.promedio_calificacion || 0) - (a.promedio_calificacion || 0);
      });
      const aliadosContainer = document.getElementById("aliadosContainer");
      if (!aliadosContainer) return;
  
      aliadosContainer.innerHTML = aliados.map(aliado => {
        // 🔥 Determinar sello y clase de borde
        let sello = '';
        let cardClass = '';

        if (aliado.id_suscripcion === 3) {
          sello ='<span class="badge-sello badge-premium" data-tooltip="Técnico destacado - Verificado">Premium</span>';
          cardClass = "card-premium";
        } else if (aliado.id_suscripcion === 2) {
          sello = `<span class="badge-sello badge-intermedio" data-tooltip="Técnico intermedio - Verificado">Intermedio</span>`;
          cardClass = "card-intermedio";
        } else {
          sello = ``;
          cardClass = "card-basico";
        }
  
        return `
          <div class="row mb-3">
          <div class="col-md-12">
            <div class="card aliado-card shadow-sm p-3 ${cardClass}">
              <div class="card-body card-body-aliado">
                <div class="aliado-image-container me-3">
                  <img src="${aliado.foto || '../imagenes/acceso.png'}" class="aliado-image" alt="Foto de ${aliado.nombre}">
                </div>

                <div class="flex-grow-1">
                  <h5 class="card-title">${aliado.nombre} ${aliado.apellido} ${sello}</h5>
                  <p class="card-text">
                    <i class="fas fa-phone"></i> <strong>Teléfono:</strong> ${aliado.telefono}<br>
                    <i class="fas fa-envelope"></i> <strong>Email:</strong> ${aliado.email}<br>
                    ⭐ <strong>${aliado.promedio_calificacion || 0}</strong> / 5.0
                  </p>
                </div>

                <div class="aliado-buttons">
                  <button class="btn btn-outline-dark me-2 ver-detalle-btn"
                    data-id="${aliado.id_aliado}" data-bs-toggle="modal" data-bs-target="#aliadoModal">
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
  
      // Agregar eventos a los botones "Ver más detalle"
      document.querySelectorAll('.ver-detalle-btn').forEach(button => {
        button.addEventListener('click', async function () {
          const id_aliado = this.getAttribute("data-id");
          await mostrarDetalleAliado(id_aliado);
        });
      });
  
    } catch (error) {
      console.error("Error al obtener aliados:", error);
      if (serviceTitle) {
        serviceTitle.textContent = "Error al cargar los aliados.";
      }
    }
  });
  
  // Función para mostrar detalles del aliado
  async function mostrarDetalleAliado(id_aliado) {
    try {
      const response = await fetch(`http://localhost:4000/api/aliado/${id_aliado}`);
      if (!response.ok) throw new Error("Error al cargar los datos del aliado");
  
      const data = await response.json();
  
      document.getElementById("modalProfileImage").src = data.aliado.foto || "../imagenes/acceso.png";
      document.getElementById("modalNombreAliado").textContent = `${data.aliado.nombre} ${data.aliado.apellido}`;
      document.getElementById("modalTelefonoAliado").textContent = data.aliado.telefono;
      document.getElementById("modalEmailAliado").textContent = data.aliado.email;
  
      document.getElementById("modalHabilidadesYExperiencia").innerHTML = data.experiencia.map(exp => {
  
        // 🔥 MAPEO personalizado de servicios
        const serviciosMapeados = {
          "enchape": "Enchape y acabados",
          "carpinteria": "Carpintería y Muebles",
          "electricidad": "Instalaciones Eléctricas",
          "plomeria": "Servicios de Plomería",
          "pintura": "Pintura y Remodelaciones",
          "cerrajeria": "Cerrajería y Seguridad",
          "refrigeracion": "Refrigeración y Aire Acondicionado",
          "jardineria": "Jardinería y Paisajismo",
          "obras": "Obras Civiles",
          "metalicas": "Estructuras Metálicas"
          // 🔵 Puedes agregar más según necesites
        };
      
        // 🔎 Buscar si el puesto (nombre del servicio) tiene una versión "amigable"
        const nombreFormateado = serviciosMapeados[exp.puesto.toLowerCase()] || capitalizarPrimeraLetra(exp.puesto);
      
        return `${exp.descripcion} de experiencia en ${nombreFormateado}`;
      
      }).join(' y ') + "."|| "<p class='text-muted'>No se encontró experiencia laboral registrada.</p>";
      function capitalizarPrimeraLetra(texto) {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
      }      
      // 🔥 NUEVO: cargar calificación y reseñas
      const calificacionRes = await fetch(`http://localhost:4000/api/aliado/${id_aliado}/calificaciones`, {
        credentials: "include"
      });
  
      if (!calificacionRes.ok) throw new Error("Error al cargar calificaciones");
  
      const calificaciones = await calificacionRes.json();
      const calificacionContainer = document.getElementById("modalCalificaciones");
  
      if (calificaciones.length === 0) {
        calificacionContainer.innerHTML = "<p class='text-muted'>Aún no tiene calificaciones.</p>";
      } else {
        const promedio = (
          calificaciones.reduce((sum, cal) => sum + cal.calificacion, 0) / calificaciones.length
        ).toFixed(1);
  
        // 🔥 Primero ordenamos las calificaciones por fecha descendente
        calificaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
        let reseñasHTML = "";
  
        calificaciones.slice(0, 3).forEach((resena, index) => {
          reseñasHTML += `
            <div class="card mt-2">
              <div class="card-body p-2">
                <p class="mb-1"><strong>Comentario ${index + 1}:</strong> ${resena.comentario || "Sin comentario."}</p>
                <small class="text-muted">${new Date(resena.fecha).toLocaleDateString('es-CO')}</small>
              </div>
            </div>
          `;
        });
  
        calificacionContainer.innerHTML = `
          <p><strong>⭐ Calificación promedio:</strong> ${"⭐".repeat(Math.round(promedio))} (${promedio}/5)</p>
          <h6 class="mt-3">📝 Reseñas recientes:</h6>
          ${reseñasHTML}
        `;
      }
  
    } catch (error) {
      console.error("Error al obtener los detalles del aliado:", error);
      alert("No se pudo cargar la información del aliado.");
    }
  }
  
  // Función para solicitar servicio
  async function obtenerServicio(aliadoId, servicioId) {
    let clienteId = sessionStorage.getItem("clienteId") || localStorage.getItem("clienteId");
  
    if (!clienteId) {
      alert("Debes iniciar sesión para solicitar un servicio.");
      window.location.href = "/cliente";
      return;
    }
  
    try {
      const response = await fetch("http://localhost:4000/api/cliente/obtenerServicio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clienteId, aliadoId, servicioId })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert("✅ Servicio solicitado correctamente.");
      } else {
        alert(`❌ Error al solicitar el servicio: ${data.message}`);
      }
    } catch (error) {
      console.error("Error al solicitar servicio:", error);
      alert("Ocurrió un error al procesar la solicitud.");
    }
}

