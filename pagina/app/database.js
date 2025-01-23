import mysql from 'mysql2/promise';
import dotenv from "dotenv";

dotenv.config();

// Create a pool of connections to the database
const pool = mysql.createPool({
    host: '156.67.74.251', // Your MySQL host
    user: process.env.USER, // Your MySQL username
    password: process.env.PASSWORD, // Your MySQL password
    database: process.env.DATABASE, // Your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}); 

const getConnection = async () => {
    return await pool.getConnection();
};

export default getConnection;
