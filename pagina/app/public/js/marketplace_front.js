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
    cargarMarketplace();
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
    data.publicaciones.forEach(pub => contenedor.appendChild(renderCard(pub)));
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
      }, 400);
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
    data.publicaciones.forEach(pub => contenedor.appendChild(renderCard(pub)));
  } catch (error) {
    console.error("❌ Error al cargar el marketplace:", error);
    contenedor.innerHTML = "<p class='text-danger'>Error al cargar los productos.</p>";
  }
}

function renderCard(pub) {
  const card = document.createElement("div");
  card.className = "col-md-4 mb-4";

  card.innerHTML = `
    <div class="card marketplace-card position-relative">
      ${pub.destacado ? `<span class="premium-badge bg-warning">PREMIUM</span>` : ""}
      ${esReciente(pub.fecha_publicacion) ? `<span class="badge bg-info text-dark position-absolute top-0 end-0 m-2" style="z-index: 10;">Nuevo</span>` : ""}
      ${renderCarrusel(pub)}
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
  return card;
}
function renderCarrusel(pub) {
  const id = `carousel-${pub.id_publicacion}`;
  const imagenes = Array.isArray(pub.imagenes) ? pub.imagenes.slice(0, 5) : [];

  if (!imagenes.length) {
    return `
      <div class="d-flex justify-content-center align-items-center bg-light border rounded py-5 mb-3" style="height: 200px;">
        <div class="text-center text-muted">
          <div style="font-size: 2rem;">📭</div>
          <p class="m-0">Sin imágenes disponibles</p>
        </div>
      </div>
    `;
  }

  const items = imagenes.map((ruta, i) => {
    const cleanPath = ruta.startsWith("/") ? ruta : `/uploads_marketplace/${ruta}`;
    return `
      <div class="carousel-item ${i === 0 ? 'active' : ''}">
        <img src="${cleanPath}" class="d-block w-100 product-img" alt="Imagen ${i + 1}">
      </div>
    `;
  }).join('');

  return `
    <div id="${id}" class="carousel slide" data-bs-ride="carousel">
      <div class="carousel-inner">${items}</div>
      ${imagenes.length > 1 ? `
        <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev">
          <span class="carousel-control-prev-icon"></span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next">
          <span class="carousel-control-next-icon"></span>
        </button>
      ` : ''}
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  cargarMarketplace();
  activarBuscadorReactivo();
});
