import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: '156.67.74.251',
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// ⚡ La función devuelve el pool directamente
const database = async () => pool;

export const closePool = async () => {
    try {
        await pool.end();
        await pool.query("SET time_zone = '-05:00'"); // America/Bogota (sin DST)
        console.log('Conexiones a la base de datos cerradas.');
    } catch (error) {
        console.error('Error al cerrar el pool:', error.message);
    }
};

export default database;
