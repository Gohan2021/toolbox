// database.js
import mysql from 'mysql2/promise';
import dotenv from "dotenv";

dotenv.config();

// Crear un pool de conexiones a la base de datos
const pool = mysql.createPool({
    host: '156.67.74.251',
    user: process.env.USER, 
    password: process.env.PASSWORD, 
    database: process.env.DATABASE, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4" // Para evitar el error de 'cesu8'
}); 

// Obtener una conexión del pool
const getConnection = async () => {
    return await pool.getConnection();
};

// Cerrar todas las conexiones del pool
export const closePool = async () => {
    try {
        await pool.end();
        console.log("Conexiones a la base de datos cerradas.");
    } catch (error) {
        console.error("Error al cerrar las conexiones del pool:", error.message);
    }
};

export default getConnection;
