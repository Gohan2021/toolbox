// Ruta existente para obtener los aliados de un servicio específico
import express from "express";
import database from "../../database.js";
const router = express.Router();

router.get("/servicios/:servicioId", async (req, res) => {
    const { servicioId } = req.params;

    try {
        const connection = await database();

        const [rows] = await connection.query(
            ` SELECT 
    a.id_aliado, 
    a.nombre, 
    a.apellido, 
    a.telefono, 
    a.email, 
    a.foto,
    a.id_suscripcion,
    COALESCE(ROUND(AVG(ca.calificacion), 1), 0) AS promedio_calificacion
  FROM aliado a
  JOIN aliado_servicio asv ON asv.id_aliado = a.id_aliado
  JOIN servicio s ON asv.id_servicio = s.id_servicio
  LEFT JOIN calificacion_aliado ca ON ca.id_aliado = a.id_aliado
  WHERE s.id_servicio = ?
  GROUP BY a.id_aliado;
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