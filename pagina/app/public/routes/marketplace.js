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
// router.get("/marketplace/publicaciones/mis-publicaciones", async (req, res) => {
//   const id_aliado = req.session?.user?.id_aliado; // Ajusta según tu sesión

//   if (!id_aliado) {
//     return res.status(401).json({ message: "No autenticado" });
//   }

//   try {
//     const conn = await database();
//     const [publicaciones] = await conn.query(`
//       SELECT 
//         pm.id_publicacion, pm.titulo, pm.descripcion, pm.precio, pm.zona, 
//         pm.fecha_publicacion, pm.destacado, pm.tipo_usuario
//       FROM publicacion_marketplace pm
//       WHERE pm.estado = 'activo' AND pm.id_aliado = ?
//       ORDER BY pm.fecha_publicacion DESC
//     `, [id_aliado]);

//     for (const pub of publicaciones) {
//       const [imagenes] = await conn.query(
//         "SELECT ruta_imagen FROM imagenes_marketplace WHERE id_publicacion = ?",
//         [pub.id_publicacion]
//       );
//       pub.imagenes = imagenes.map(img => img.ruta_imagen);
//     }

//     res.json({ publicaciones });

//   } catch (error) {
//     console.error("❌ Error al obtener publicaciones del aliado:", error.message);
//     res.status(500).json({ message: "Error al cargar tus publicaciones." });
//   }
// });

// POST /marketplace/publicar
router.post("/marketplace/publicar", uploadMarketplace.array("imagenes", 5), async (req, res) => {
  const { titulo, descripcion, precio, zona, id_aliado, destacado } = req.body;
  const files = req.files;

  if (!titulo || !descripcion || !precio || !zona || !id_aliado || files.length === 0) {
    return res.status(400).json({ message: "Faltan campos requeridos." });
  }

  try {
    const conn = await database();

    // 🟡 Validar beneficios de suscripción
    const [subs] = await conn.query(`
      SELECT s.limite_publicaciones_destacadas, s.puede_destacar_publicaciones
      FROM aliado a
      JOIN suscripcion s ON a.id_suscripcion = s.id_suscripcion
      WHERE a.id_aliado = ?
    `, [id_aliado]);

    if (!subs.length) return res.status(400).json({ message: "Aliado inválido" });

    let destacar = destacado === "true";

    if (destacar && !subs[0].puede_destacar_publicaciones) {
      destacar = false;
    }

    const [countDestacadas] = await conn.query(`
      SELECT COUNT(*) AS total FROM publicacion_marketplace
      WHERE id_aliado = ? AND destacado = 1
    `, [id_aliado]);

    if (destacar && countDestacadas[0].total >= subs[0].limite_publicaciones_destacadas) {
      destacar = false;
    }

    const [result] = await conn.query(`
      INSERT INTO publicacion_marketplace (titulo, descripcion, precio, zona, estado, fecha_publicacion, tipo_usuario, destacado, id_aliado)
      VALUES (?, ?, ?, ?, 'activo', NOW(), 'cliente', ?, ?)
    `, [titulo, descripcion, precio, zona, destacar, id_aliado]);

    const idPublicacion = result.insertId;

    for (const file of files) {
      await conn.query(
        `INSERT INTO imagenes_marketplace (id_publicacion, ruta_imagen)
         VALUES (?, ?)`,
        [idPublicacion, `/uploads_marketplace/${file.filename}`]
      );
    }

    res.status(201).json({ message: "Publicación creada exitosamente", destacado: destacar });
  } catch (err) {
    console.error("❌ Error al publicar:", err.message);
    res.status(500).json({ message: "Error del servidor." });
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

