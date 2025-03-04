import express from "express";
import database from "../../database.js";
import { verifyToken } from "../../controllers/authentication.controller.js";
import { methods as authentication } from "../../controllers/authentication.controller.js";

const router = express.Router();

// ✅ Ruta protegida para obtener la información del aliado autenticado
router.get("/aliado/perfil", verifyToken, async (req, res) => {
    console.log("📡 Solicitud autenticada. ID del usuario:", req.user?.userId);
    
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

        // 🔍 Obtener experiencia laboral
        const [experienciaData] = await connection.query(
            `SELECT puesto, descripcion 
             FROM experiencia_laboral WHERE id_aliado = ?`, 
            [req.user.userId]
        );

        return res.json({
            aliado: aliadoData[0],
            experiencia: experienciaData // ✅ Ahora la experiencia se envía correctamente
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
            `SELECT a.nombre, a.apellido, a.telefono, a.email, a.foto
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
// 🚪 Endpoint para cerrar sesión
router.post("/logout", (req, res) => {
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        path: "/"
    });
    return res.status(200).json({ message: "Sesión cerrada correctamente", redirect: "/" });
});

// Ruta para solicitar la recuperación de contraseña
router.post("/request-password-reset", authentication.requestPasswordReset);

export default router;
