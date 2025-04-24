import express from "express";
import database from "../../database.js";
import { uploadMarketplace } from "../../multerConfig.js"; // ✅ Importar `upload` de index.js
import { verifyToken } from "../../controllers/authentication.controller.js"; // 👈 asegúrate de que el path es correcto
import { verificarPlanAliado } from "../verificarPlanAliado.js";

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
//Publicar material
router.post("/marketplace/publicar", verifyToken, verificarPlanAliado, uploadMarketplace.array("imagenes", 5), async (req, res) => {
  const { userId, role } = req.user;
  const { planAliado } = req;
  const connection = await database();

  try {
    // 🔒 Límite del plan Básico (hasta 3 publicaciones/mes)
    if (role === "aliado" && planAliado === "basico") {
      const [count] = await connection.query(
        `SELECT COUNT(*) AS total 
         FROM publicacion_marketplace 
         WHERE id_aliado = ? 
         AND MONTH(fecha_publicacion) = MONTH(NOW())`,
        [userId]
      );
      if (count[0].total >= 3) {
        return res.status(403).json({ message: "Has alcanzado el límite de 3 publicaciones mensuales con el Plan Básico." });
      }
    }

    const { titulo, descripcion, precio, zona, destacado } = req.body;
    const files = req.files;

    if (!titulo || !descripcion || !precio || !zona || files.length === 0) {
      return res.status(400).json({ message: "Faltan campos requeridos." });
    }

    // 📌 Validar si puede destacar publicaciones
    let destacar = destacado === "true";
    let puedeDestacar = false;
    let limiteDestacadas = 0;

    if (role === "aliado") {
      const [subs] = await connection.query(`
        SELECT s.puede_destacar_publicaciones, s.limite_publicaciones_destacadas
        FROM aliado a
        JOIN suscripcion s ON a.id_suscripcion = s.id_suscripcion
        WHERE a.id_aliado = ?
      `, [userId]);

      if (subs.length > 0) {
        puedeDestacar = !!subs[0].puede_destacar_publicaciones;
        limiteDestacadas = subs[0].limite_publicaciones_destacadas;
      }

      if (!puedeDestacar) {
        destacar = false;
      } else {
        const [countDestacadas] = await connection.query(`
          SELECT COUNT(*) AS total FROM publicacion_marketplace
          WHERE id_aliado = ? AND destacado = 1
        `, [userId]);

        if (countDestacadas[0].total >= limiteDestacadas) {
          destacar = false;
        }
      }
    } else {
      // Clientes no pueden destacar publicaciones
      destacar = false;
    }

    // 📝 Guardar publicación
    const [result] = await connection.query(`
      INSERT INTO publicacion_marketplace (titulo, descripcion, precio, zona, estado, fecha_publicacion, tipo_usuario, destacado, id_aliado)
      VALUES (?, ?, ?, ?, 'activo', NOW(), ?, ?, ?)
    `, [titulo, descripcion, precio, zona, role, destacar, userId]);

    const idPublicacion = result.insertId;

    for (const file of files) {
      await connection.query(`
        INSERT INTO imagenes_marketplace (id_publicacion, ruta_imagen)
        VALUES (?, ?)`,
        [idPublicacion, `/uploads_marketplace/${file.filename}`]
      );
    }

    res.status(201).json({ message: "✅ Publicación creada exitosamente.", destacado: destacar });
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

