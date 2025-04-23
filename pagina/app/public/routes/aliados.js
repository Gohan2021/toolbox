import express from "express";
import database from "../../database.js";
import { verifyToken } from "../../controllers/authentication.controller.js";
import { methods as authentication } from "../../controllers/authentication.controller.js";

const router = express.Router();

// ✅ Ruta protegida para obtener la información completa del aliado (Perfil + Servicios Solicitados)
router.get("/aliado/perfil", verifyToken, async (req, res) => {
    console.log("📡 Solicitando perfil y servicios del aliado:", req.user?.userId);

    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "No autorizado, token inválido." });
    }

    try {
        const connection = await database();

        // 🔍 Obtener información del aliado
        const [aliadoData] = await connection.query(
            `SELECT id_aliado, nombre, apellido, telefono, email, foto 
             FROM aliado WHERE id_aliado = ?`, 
            [req.user.userId]
        );

        if (aliadoData.length === 0) {
            return res.status(404).json({ message: "Aliado no encontrado." });
        }

        // 🔍 Obtener experiencia laboral del aliado
        const [experienciaData] = await connection.query(
            `SELECT puesto, descripcion 
             FROM experiencia_laboral WHERE id_aliado = ?`, 
            [req.user.userId]
        );

        // 🔍 Obtener los servicios solicitados por clientes
        const [serviciosSolicitados] = await connection.query(
            `SELECT s.id_servicio, s.nombre_servicio, c.nombre AS cliente_nombre, 
                    c.apellido AS cliente_apellido, c.telefono AS cliente_telefono, 
                    c.email AS cliente_email, c.foto AS cliente_foto
             FROM cliente_aliado ca
             JOIN servicio s ON ca.id_servicio = s.id_servicio
             JOIN cliente c ON ca.id_cliente = c.id_cliente
             WHERE ca.id_aliado = ?`,
            [req.user.userId]
        );

        console.log("✅ Perfil y servicios obtenidos correctamente");

        // 🔄 Responder con toda la información en un solo JSON
        return res.json({
            aliado: aliadoData[0],
            experiencia: experienciaData,
            serviciosSolicitados: serviciosSolicitados
        });

    } catch (error) {
        console.error("❌ Error al obtener la información del aliado:", error.message);
        res.status(500).json({ message: "Error al obtener la información del aliado." });
    }
});

// Ruta existente para obtener los aliados de un servicio específico
router.get("/servicios/:servicioId", async (req, res) => {
    const { servicioId } = req.params;

    try {
        const connection = await database();

        const [rows] = await connection.query(
            `SELECT a.id_aliado, a.nombre, a.apellido, a.telefono, a.email, a.foto
            FROM aliado a
            JOIN aliado_servicio asv ON asv.id_aliado = a.id_aliado
            JOIN servicio s ON asv.id_servicio = s.id_servicio
            WHERE s.id_servicio = ?;`, 
            [servicioId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontraron aliados para este servicio." });
        }

        return res.json(rows);

    } catch (error) {
        console.error("Error al obtener los aliados:", error.message);
        res.status(500).json({ message: "Error al obtener los aliados.", error: error.message });
    }
});
// ✅ Nueva ruta para obtener la información de un aliado por su ID
router.get("/aliado/:id_aliado", async (req, res) => {
    const { id_aliado } = req.params;

    try {
        const connection = await database();

        // 🔍 Obtener información del aliado
        const [aliadoData] = await connection.query(
            `SELECT id_aliado, nombre, apellido, telefono, email, foto 
             FROM aliado WHERE id_aliado = ?`, 
            [id_aliado]
        );

        if (aliadoData.length === 0) {
            return res.status(404).json({ message: "Aliado no encontrado." });
        }

        // 🔍 Obtener experiencia laboral
        const [experienciaData] = await connection.query(
            `SELECT puesto, descripcion 
             FROM experiencia_laboral WHERE id_aliado = ?`, 
            [id_aliado]
        );

        return res.json({
            aliado: aliadoData[0],
            experiencia: experienciaData
        });

    } catch (error) {
        console.error("❌ Error al obtener la información del aliado:", error.message);
        res.status(500).json({ message: "Error al obtener la información del aliado." });
    }
});
// 🚪 Endpoint para cerrar sesión
router.post("/logout", (req, res) => {
    res.clearCookie("jwt_aliado", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        path: "/"
    });
    return res.status(200).json({ 
        message: "Sesión cerrada correctamente", 
        redirect: "/aliado" 
    });
});
// Ruta para solicitar la recuperación de contraseña
router.post("/request-password-reset", authentication.requestPasswordReset);
//Ruta para obtener detalles de suscripcion de un aliado
router.get("/aliado/:id/suscripcion", async (req, res) => {
    const { id } = req.params;
    try {
      const conn = await database();
  
      const [result] = await conn.query(`
        SELECT s.*
        FROM aliado a
        JOIN suscripcion s ON a.id_suscripcion = s.id_suscripcion
        WHERE a.id_aliado = ?
      `, [id]);
  
      if (result.length === 0) {
        return res.status(404).json({ message: "Suscripción no encontrada." });
      }
  
      res.json({ suscripcion: result[0] });
    } catch (err) {
      console.error("❌ Error al obtener la suscripción:", err.message);
      res.status(500).json({ message: "Error del servidor." });
    }
  });
// GET /api/aliado/:id/publicaciones
// router.get("/aliado/:id/publicaciones", async (req, res) => {
//     const { id } = req.params;
//     try {
//       const conn = await database();
  
//       const [publicaciones] = await conn.query(`
//         SELECT pm.*, GROUP_CONCAT(im.ruta_imagen) AS imagenes
//         FROM publicacion_marketplace pm
//         LEFT JOIN imagenes_marketplace im ON pm.id_publicacion = im.id_publicacion
//         WHERE pm.id_aliado = ?
//         GROUP BY pm.id_publicacion
//         ORDER BY pm.fecha_publicacion DESC
//       `, [id]);
  
//       const formatted = publicaciones.map(pub => ({
//         ...pub,
//         imagenes: pub.imagenes ? pub.imagenes.split(",") : []
//       }));
  
//       res.json({ publicaciones: formatted });
//     } catch (err) {
//       console.error("❌ Error al obtener publicaciones del aliado:", err.message);
//       res.status(500).json({ message: "Error al cargar publicaciones del aliado." });
//     }
//   });
  
export default router;
