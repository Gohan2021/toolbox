import mysql from 'mysql2/promise';
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

// app.use(cors({
//     origin: ["http://127.0.0.1:5501","http://127.0.0.1:5500"]
// }));

// Create a connection to the database
const connection = mysql.createConnection({
    host: '156.67.74.251', // Your MySQL host
    user: process.env.USER, // Your MySQL username
    password: process.env.PASSWORD, // Your MySQL password
    database: process.env.DATABASE // Your database name
}); 

const getConnection = async ()=> await connection;

export default getConnection;
// Connect to the database
// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err);
//         return;
//     }
//     console.log('Connected to the MySQL database.');
// });