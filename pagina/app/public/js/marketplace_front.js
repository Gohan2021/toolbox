let debounceTimer;
    
function esReciente(fechaISO) {
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const diferenciaHoras = (ahora - fecha) / 1000 / 60 / 60;
  return diferenciaHoras < 48;
}

async function buscarMaterial(nombre, zona) {
  const contenedor = document.getElementById("productosContainer");

  if (!nombre && !zona) {
    cargarMarketplace(); // Si ambos campos están vacíos, cargamos todo
    return;
  }

  contenedor.innerHTML = "<p class='text-muted'>🔄 Buscando materiales...</p>";

  try {
    const res = await fetch(`http://localhost:4000/api/marketplace/buscar?q=${encodeURIComponent(nombre)}&zona=${encodeURIComponent(zona)}`);
    const data = await res.json();

    if (!data.publicaciones || data.publicaciones.length === 0) {
      contenedor.innerHTML = "<p class='text-muted'>😕 No se encontraron resultados.</p>";
      return;
    }

    contenedor.innerHTML = "";

    data.publicaciones.forEach(pub => {
      const card = document.createElement("div");
      card.className = "col-md-4 mb-4";

      card.innerHTML = `
        <div class="card marketplace-card position-relative">
          ${pub.destacado ? `<span class="premium-badge bg-warning">PREMIUM</span>` : ""}
          ${esReciente(pub.fecha_publicacion) ? `<span class="badge bg-info text-dark position-absolute top-0 end-0 m-2">Nuevo</span>` : ""}
          <img src="${pub.ruta_imagen || '/imagenes/default-material.jpg'}" class="product-img" alt="${pub.titulo}">
          <div class="card-body">
            <h5 class="card-title">${pub.titulo}</h5>
            <p class="card-text"><strong class="text-warning">Descripción:</strong> <span class="text-muted">${pub.descripcion || 'Sin descripción'}</span></p>
            <p class="card-text"><strong class="text-warning">Zona:</strong> <span class="text-muted">${pub.zona || 'No especificada'}</span></p>
            <p class="fw-bold text-success">$${parseFloat(pub.precio).toLocaleString()}</p>
            <div class="d-grid">
              <a href="https://wa.me/573001112233" target="_blank" class="btn btn-outline-success">
                <i class="fab fa-whatsapp"></i> Contactar
              </a>
            </div>
          </div>
        </div>
      `;
      contenedor.appendChild(card);
    });

  } catch (err) {
    console.error("❌ Error al buscar materiales:", err);
    contenedor.innerHTML = "<p class='text-danger'>Error al buscar materiales.</p>";
  }
}

function activarBuscadorReactivo() {
  const inputNombre = document.getElementById("buscarNombre");
  const inputZona = document.getElementById("buscarZona");

  [inputNombre, inputZona].forEach(input => {
    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        buscarMaterial(inputNombre.value.trim(), inputZona.value.trim());
      }, 400); // Espera 400ms después de dejar de escribir
    });
  });
}

async function cargarMarketplace() {
  const contenedor = document.getElementById("productosContainer");

  try {
    const res = await fetch("http://localhost:4000/api/marketplace/publicaciones");
    const data = await res.json();

    if (!data.publicaciones || data.publicaciones.length === 0) {
      contenedor.innerHTML = "<p class='text-muted'>No hay publicaciones disponibles.</p>";
      return;
    }

    contenedor.innerHTML = "";

    data.publicaciones.forEach(pub => {
      const card = document.createElement("div");
      card.className = "col-md-4 mb-4";

      card.innerHTML = `
        <div class="card marketplace-card position-relative">
          ${pub.destacado ? `<span class="premium-badge bg-warning">PREMIUM</span>` : ""}
          ${esReciente(pub.fecha_publicacion) ? `<span class="badge bg-info text-dark position-absolute top-0 end-0 m-2">Nuevo</span>` : ""}
          <img src="${pub.ruta_imagen || '/imagenes/default-material.jpg'}" class="product-img" alt="${pub.titulo}">
          <div class="card-body">
            <h5 class="card-title">${pub.titulo}</h5>
            <p class="card-text"><strong class="text-warning">Descripción:</strong> <span class="text-muted">${pub.descripcion || 'Sin descripción'}</span></p>
            <p class="card-text"><strong class="text-warning">Zona:</strong> <span class="text-muted">${pub.zona || 'No especificada'}</span></p>
            <p class="fw-bold text-success">$${parseFloat(pub.precio).toLocaleString()}</p>
            <div class="d-grid">
              <a href="https://wa.me/573001112233" target="_blank" class="btn btn-outline-success">
                <i class="fab fa-whatsapp"></i> Contactar
              </a>
            </div>
          </div>
        </div>
      `;
      contenedor.appendChild(card);
    });

  } catch (error) {
    console.error("❌ Error al cargar el marketplace:", error);
    contenedor.innerHTML = "<p class='text-danger'>Error al cargar los productos.</p>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarMarketplace();
  activarBuscadorReactivo();
});