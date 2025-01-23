import express from "express";
import database from './database.js';
import cors from "cors"; // Importing CORS

//fix para el dirname
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { methods as authentication } from "./controllers/authentication.controller.js";

//server
const app = express();
app.use(cors({
    origin: ["http://127.0.0.1:5501","http://127.0.0.1:5500"]
})); // CORS configuration
app.set("port", 4000);

// Attempt to connect to the database before starting the server
try {
    await database(); // Attempt to get a connection
} catch (error) {
    console.error('Failed to connect to the database:', error.message);
    process.exit(1); // Exit the process if the connection fails
}

app.listen(app.get("port"), () => {
    console.log("Servidor corriendo en puerto", app.get("port"));
});

//configuracion 
app.use(express.static(__dirname + "/public"));
app.use(express.json());

//rutas
app.get("/prueba", (req, res) => res.send("Mensaje"));

app.get("/", (req, res) => res.sendFile(__dirname + "/pages/index.html"));
app.get("/form", (req, res) => res.sendFile(__dirname + "/pages/form.html"));

// Route for SELECT query
app.get('/clientes', async (req, res) => {
    try {
        const connection = await database(); // Get the database connection
        const [rows] = await connection.query('SELECT * FROM cliente'); // Use the connection to query
        res.json(rows);
    } catch (err) {
        console.error('Error en la consulta:', err.message); // Log the specific error message
        res.status(500).json({ error: 'Error al obtener los datos de la base de datos', details: err.message });
    }
});

// Endpoint for registering aliado
app.post('/api/register/aliado', async (req, res) => {
    const { userNameAliado, surnameAliado, userIDAliado, emailAliado, passwordAliado } = req.body;
    try {
        const connection = await database(); // Get the database connection
        await connection.query('INSERT INTO aliados (userName, surname, userID, email, password) VALUES (?, ?, ?, ?, ?)', 
            [userNameAliado, surnameAliado, userIDAliado, emailAliado, passwordAliado]);
        res.status(201).json({ message: 'Aliado registered successfully' });
    } catch (err) {
        console.error('Error registering aliado:', err.message);
        res.status(500).json({ error: 'Error registering aliado', details: err.message });
    }
});

// Endpoint for registering cliente
app.post('/api/register/cliente', async (req, res) => {
    const { userNameCliente, surnameCliente, emailCliente, passwordCliente, telCliente, serviciosCliente } = req.body;
    try {
        const connection = await database(); // Get the database connection
        await connection.query('INSERT INTO cliente (nombre, apellido, email, contraseña, telefono) VALUES (?, ?, ?, ?, ?)', 
            [userNameCliente, surnameCliente, emailCliente, passwordCliente, telCliente, serviciosCliente]);
        res.status(201).json({ message: 'Cliente registered successfully' });
    } catch (err) {
        console.error('Error registering cliente:', err.message);
        res.status(500).json({ error: 'Error registering cliente', details: err.message });
    }
});

app.get("/cliente", (req, res) => res.sendFile(__dirname + "/pages/cliente.html"));
app.get("/hazteConocer", (req, res) => res.sendFile(__dirname + "/pages/hazteConocer.html"));
app.get("/myv", (req, res) => res.sendFile(__dirname + "/pages/myv.html"));
app.get("/politicas", (req, res) => res.sendFile(__dirname + "/pages/politicas.html"));
app.get("/uso", (req, res) => res.sendFile(__dirname + "/pages/uso.html"));

app.post("/api/login", authentication.login);
app.post("/api/register/aliado", authentication.registerAliado);
app.post("/api/register/cliente", authentication.registerCliente);
