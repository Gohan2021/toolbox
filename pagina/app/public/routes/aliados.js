import express from "express";
import database from "../../database.js";
import { verifyToken } from "../../controllers/authentication.controller.js";
import { methods as authentication } from "../../controllers/authentication.controller.js";
import { verificarPlanAliado } from "../verificarPlanAliado.js";
const router = express.Router();

// ✅ Ruta protegida para obtener la información completa del aliado (Perfil + Servicios Solicitados)
router.get("/perfil", verifyToken, async (req, res) => {
    console.log("📡 Solicitando perfil y servicios del aliado:", req.user?.userId);

    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "No autorizado, token inválido." });
    }

    try {
        const connection = await database();

        // 🔍 Obtener información del aliado
        const [aliadoData] = await connection.query(
            `SELECT id_aliado, nombre, apellido, telefono, email, foto, id_suscripcion  
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
router.get("/mis-publicaciones", verifyToken, async (req, res) => {
  try {
    const connection = await database();
    const [rows] = await connection.query(`
      SELECT 
        p.id_publicacion, 
        p.titulo, 
        p.descripcion, 
        p.precio, 
        p.zona, 
        p.fecha_publicacion,
        i.ruta_imagen
      FROM publicacion_marketplace p
      LEFT JOIN imagenes_marketplace i ON p.id_publicacion = i.id_publicacion
      WHERE p.id_aliado = ?
      ORDER BY p.fecha_publicacion DESC
    `, [req.user.userId]);

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener publicaciones del aliado:", error.message);
    res.status(500).json({ message: "Error al cargar publicaciones." });
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

// POST /api/aliado/suscribirse
router.post("/suscribirse", verifyToken, async (req, res) => {
    const { id_suscripcion } = req.body;

    if (!id_suscripcion) {
        return res.status(400).json({ message: "ID de suscripción requerido." });
    }

    try {
        const conn = await database();

        // Verificar existencia de la suscripción
        const [subs] = await conn.query("SELECT * FROM suscripcion WHERE id_suscripcion = ?", [id_suscripcion]);
        if (subs.length === 0) {
            return res.status(404).json({ message: "Suscripción no encontrada." });
        }

        // Actualizar la suscripción del aliado
        await conn.query("UPDATE aliado SET id_suscripcion = ? WHERE id_aliado = ?", [id_suscripcion, req.user.userId]);

        res.status(200).json({ message: "Suscripción actualizada correctamente." });

    } catch (error) {
        console.error("❌ Error al actualizar suscripción:", error.message);
        res.status(500).json({ message: "Error al actualizar la suscripción." });
    }
});
router.get("/destacados/contador", verifyToken, verificarPlanAliado, async (req, res) => {
    const { userId } = req.user;
    const plan = req.planAliado;
  
    console.log("🔍 [API] Verificando plan para destacados:", plan?.nombre || "Sin plan");
    console.log("🧠 Plan recibido en req.planAliado:", plan);

    if (!plan || !plan.puede_destacar_publicaciones) {
      console.log("⛔ Plan no permite destacar");
      return res.json({ permitido: false });
    }
  
    try {
      const connection = await database();
      const [count] = await connection.query(`
        SELECT COUNT(*) AS total FROM publicacion_marketplace
        WHERE id_aliado = ? AND destacado = 1
      `, [userId]);
  
      console.log(`✅ Publicaciones destacadas usadas: ${count[0].total} / ${plan.limite_publicaciones_destacadas}`);
  
      res.json({
        permitido: true,
        usados: count[0].total,
        limite: plan.limite_publicaciones_destacadas
      });
  
    } catch (err) {
      console.error("❌ Error al obtener contador de destacados:", err.message);
      res.status(500).json({ message: "Error al consultar publicaciones destacadas." });
    }
  });
// GET /api/aliado/marketplace/contador
router.get("/marketplace/contador", verifyToken, async (req, res) => {
    try {
      const connection = await database();
      const [user] = await connection.query(`
        SELECT id_suscripcion
        FROM aliado
        WHERE id_aliado = ?
      `, [req.user.userId]);
  
      const idSuscripcion = user[0]?.id_suscripcion || 1;
  
      let query = "";
      if (idSuscripcion === 2) { // Intermedio (por semana)
        query = `
          SELECT COUNT(*) AS total
          FROM publicacion_marketplace
          WHERE id_aliado = ?
          AND WEEK(fecha_publicacion, 1) = WEEK(NOW(), 1)
        `;
      } else { // Básico o por defecto
        query = `
          SELECT COUNT(*) AS total
          FROM publicacion_marketplace
          WHERE id_aliado = ?
          AND MONTH(fecha_publicacion) = MONTH(NOW())
        `;
      }
  
      const [count] = await connection.query(query, [req.user.userId]);
  
      res.json({ total: count[0].total });
    } catch (error) {
      console.error("❌ Error al contar publicaciones:", error.message);
      res.status(500).json({ message: "Error al obtener contador." });
    }
  });
// POST /api/aliado/calificar
router.post("/calificar", verifyToken, async (req, res) => {
  try {
    const { id_aliado, calificacion, comentario } = req.body;
    const id_cliente = req.user.userId; // Cliente autenticado

    // Validaciones básicas
    if (!id_aliado || !calificacion) {
      return res.status(400).json({ message: "ID del aliado y calificación son requeridos." });
    }

    const calificacionNum = Number(calificacion);

    if (isNaN(calificacionNum) || calificacionNum < 1 || calificacionNum > 5) {
      return res.status(400).json({ message: "La calificación debe ser un número entre 1 y 5." });
    }

    const connection = await database();

    // (Opcional) Verificar que el aliado exista
    const [aliadoExiste] = await connection.query(
      `SELECT id_aliado FROM aliado WHERE id_aliado = ?`,
      [id_aliado]
    );

    if (aliadoExiste.length === 0) {
      return res.status(404).json({ message: "El aliado que intentas calificar no existe." });
    }

    // (Opcional avanzado) Verificar si el cliente ya calificó antes
    const [yaCalificado] = await connection.query(
      `SELECT id_calificacion FROM calificacion_aliado WHERE id_cliente = ? AND id_aliado = ?`,
      [id_cliente, id_aliado]
    );

    if (yaCalificado.length > 0) {
      return res.status(400).json({ message: "Ya has calificado a este aliado anteriormente." });
    }

    // Insertar calificación
    await connection.query(
      `INSERT INTO calificacion_aliado (id_aliado, id_cliente, calificacion, comentario)
       VALUES (?, ?, ?, ?)`,
      [id_aliado, id_cliente, calificacionNum, comentario || null]
    );

    res.status(201).json({ message: "✅ Calificación enviada exitosamente." });

  } catch (error) {
    console.error("❌ Error al procesar la calificación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
router.get("/:id_aliado/calificacion", async (req, res) => {
    const { id_aliado } = req.params;
  
    try {
      const conn = await database();
      const [result] = await conn.query(`
        SELECT AVG(calificacion) AS promedio, COUNT(*) AS total
        FROM calificacion_aliado
        WHERE id_aliado = ?`,
        [id_aliado]
      );
  
      res.json(result[0]);
    } catch (error) {
      console.error("Error al obtener calificación:", error);
      res.status(500).json({ message: "Error interno" });
    }
  });
// ✅ Obtener lista de calificaciones individuales de un aliado
router.get("/:id_aliado/calificaciones", async (req, res) => {
  const { id_aliado } = req.params;

  try {
    const conn = await database();
    const [calificaciones] = await conn.query(`
      SELECT c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, ca.calificacion, ca.comentario, ca.fecha
      FROM calificacion_aliado ca
      JOIN cliente c ON ca.id_cliente = c.id_cliente
      WHERE ca.id_aliado = ?
      ORDER BY ca.fecha DESC
    `, [id_aliado]);

    res.json(calificaciones);

  } catch (error) {
    console.error("❌ Error al obtener calificaciones individuales:", error.message);
    res.status(500).json({ message: "Error al obtener las calificaciones." });
  }
});

//Ruta para obtener detalles de suscripcion de un aliado
router.get("/:id/suscripcion", async (req, res) => {
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
  // ✅ Nueva ruta para obtener la información de un aliado por su ID
router.get("/:id_aliado", async (req, res) => {
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

export default router;
