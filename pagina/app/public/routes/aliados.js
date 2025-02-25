import express from "express";
import database from "../../database.js";

const router = express.Router();

// Endpoint para obtener los aliados de un servicio específico
router.get("/servicios/:servicioId", async (req, res) => {
    const { servicioId } = req.params;

    try {
        const connection = await database();

        // Consultar la información de los aliados que ofrecen el servicio
        const [rows] = await connection.query(
            `SELECT a.nombre, a.apellido, a.telefono, a.email 
            FROM aliado a
            JOIN aliado_servicio asv ON asv.id_aliado = a.id_aliado
            JOIN servicio s ON asv.id_servicio = s.id_servicio
            WHERE s.id_servicio = ?;
            `, 
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

export default router;
