import express from 'express';
import database from '.../database.js';

const router = express.Router();

// Endpoint dinámico para obtener los aliados de cualquier servicio
router.get('/:servicio', async (req, res) => {
    const { servicio } = req.params; // Servicio dinámico desde la URL

    try {
        const connection = await database();
        
        // Consulta SQL para obtener aliados según el servicio
        const [rows] = await connection.query(`
            SELECT a.nombre, a.apellido, a.experiencia
            FROM aliado a
            JOIN aliado_servicio as on a.id = as.id_aliado
            JOIN servicio s ON as.id_servicio = s.id
            WHERE s.nombre = ?
        `, [servicio]);

        if (rows.length === 0) {
            return res.status(404).json({ message: `No se encontraron aliados para el servicio de ${servicio}.` });
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error obteniendo aliados:', error.message);
        res.status(500).json({ error: 'Error al obtener los aliados' });
    }
});

export default router;
