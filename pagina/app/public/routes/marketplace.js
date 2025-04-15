import express from "express";
import database from "../../database.js";
import { uploadMarketplace } from "../../multerConfig.js"; // ✅ Importar `upload` de index.js

const router = express.Router();

// ✅ Obtener todas las publicaciones del marketplace
router.get("/marketplace/publicaciones", async (req, res) => {
  try {
    const connection = await database();

    const [publicaciones] = await connection.query(`
      SELECT 
        pm.id_publicacion, pm.titulo, pm.descripcion, pm.precio, pm.zona, 
        pm.fecha_publicacion, pm.destacado, pm.tipo_usuario
      FROM publicacion_marketplace pm
      WHERE pm.estado = 'activo'
      ORDER BY pm.destacado DESC, pm.fecha_publicacion DESC
    `);

    // Por cada publicación, buscar sus imágenes
    for (const pub of publicaciones) {
      const [imagenes] = await connection.query(
        "SELECT ruta_imagen FROM imagenes_marketplace WHERE id_publicacion = ?",
        [pub.id_publicacion]
      );
      pub.imagenes = imagenes.map(img => img.ruta_imagen);
    }

    res.json({ publicaciones });
  } catch (error) {
    console.error("❌ Error al obtener publicaciones:", error.message);
    res.status(500).json({ message: "Error al cargar publicaciones." });
  }
});


router.post("/marketplace/publicar", uploadMarketplace.array("imagenes", 5), async (req, res) => {
  console.log("🟡 Files recibidos:", req.files);
  console.log("🟡 Body recibido:", req.body);  
  const { titulo, descripcion, precio, zona } = req.body;
  const files = req.files;

  if (!titulo || !descripcion || !precio || !zona || files.length === 0) {
    return res.status(400).json({ message: "Todos los campos son requeridos y se debe subir al menos 1 imagen." });
  }

  try {
    const conn = await database();
    console.log("📸 Archivos recibidos:", req.files);

    const [result] = await conn.query(
      `INSERT INTO publicacion_marketplace (titulo, descripcion, precio, zona, estado, fecha_publicacion, tipo_usuario)
       VALUES (?, ?, ?, ?, 'activo', NOW(), 'cliente')`,
      [titulo, descripcion, precio, zona]
    );

    const idPublicacion = result.insertId;

    for (const file of files) {
      await conn.query(
        `INSERT INTO imagenes_marketplace (id_publicacion, ruta_imagen)
         VALUES (?, ?)`,
        [idPublicacion, `/uploads_marketplace/${file.filename}`]
      );
    }

    res.status(201).json({ message: "✅ Publicación creada correctamente." });
  } catch (err) {
    console.error("❌ Error al guardar publicación:", err);
    res.status(500).json({ message: err.message || "Error del servidor." });
  }
});
// Ruta para el buscador
router.get("/marketplace/buscar", async (req, res) => {
  const { q, zona } = req.query;

  try {
    const connection = await database();

    let query = `
      SELECT 
        p.id_publicacion, p.titulo, p.descripcion, p.precio, p.zona, 
        p.fecha_publicacion, p.destacado, p.tipo_usuario
      FROM publicacion_marketplace p
      WHERE p.estado = 'activo'
    `;

    const params = [];

    if (q) {
      query += " AND (p.titulo LIKE ? OR p.descripcion LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }

    if (zona) {
      query += " AND p.zona LIKE ?";
      params.push(`%${zona}%`);
    }

    query += " ORDER BY p.destacado DESC, p.fecha_publicacion DESC";

    const [result] = await connection.query(query, params);

    // 🔁 Agregar imágenes a cada publicación
    for (const pub of result) {
      const [imagenes] = await connection.query(
        "SELECT ruta_imagen FROM imagenes_marketplace WHERE id_publicacion = ?",
        [pub.id_publicacion]
      );
      pub.imagenes = imagenes.map(img => img.ruta_imagen);
    }

    return res.json({ publicaciones: result });

  } catch (error) {
    console.error("❌ Error en la búsqueda del marketplace:", error.message);
    res.status(500).json({ message: "Error al buscar publicaciones." });
  }
});

export default router;

