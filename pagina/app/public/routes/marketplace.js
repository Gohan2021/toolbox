import express from "express";
import database from "../../database.js";
import { upload } from "../../multerConfig.js"; // ✅ Importar `upload` de index.js

const router = express.Router();

// ✅ Obtener todas las publicaciones del marketplace
router.get("/marketplace/publicaciones", async (req, res) => {
  try {
    const connection = await database();

    const [publicaciones] = await connection.query(`
      SELECT 
        pm.id_publicacion, pm.titulo, pm.descripcion, pm.precio, pm.ubicacion, 
        pm.fecha_publicacion, pm.destacado, pm.tipo_usuario,
        img.ruta_imagen
      FROM publicacion_marketplace pm
      LEFT JOIN (
        SELECT id_publicacion, MIN(ruta_imagen) as ruta_imagen
        FROM imagenes_marketplace
        GROUP BY id_publicacion
      ) img ON pm.id_publicacion = img.id_publicacion
      WHERE pm.estado = 'activo'
      ORDER BY pm.destacado DESC, pm.fecha_publicacion DESC
    `);

    res.json({ publicaciones });
  } catch (error) {
    console.error("❌ Error al obtener publicaciones:", error.message);
    res.status(500).json({ message: "Error al obtener publicaciones." });
  }
});

router.post("/marketplace/publicar", upload.array("imagenes", 5), async (req, res) => {
    const { titulo, descripcion, precio, zona } = req.body;
    const files = req.files;
  
    if (!titulo || !descripcion || !precio || !zona || !files.length) {
      return res.status(400).json({ message: "Todos los campos son requeridos." });
    }
  
    try {
      const conn = await database();
      const [result] = await conn.query(
        "INSERT INTO publicacion_marketplace (titulo, descripcion, precio, ubicacion, estado, fecha_publicacion, tipo_usuario) VALUES (?, ?, ?, ?, 'activo', NOW(), 'cliente')",
        [titulo, descripcion, precio, zona]
      );
      const idPublicacion = result.insertId;
  
      for (const file of files) {
        await conn.query(
          "INSERT INTO imagenes_marketplace (id_publicacion, ruta_imagen) VALUES (?, ?)",
          [idPublicacion, `/uploads/${file.filename}`]
        );
      }
  
      res.status(201).json({ message: "Publicación creada con éxito." });
    } catch (err) {
      console.error("❌ Error al guardar la publicación:", err.message);
      res.status(500).json({ message: "Error del servidor." });
    }
  });
  

export default router;
