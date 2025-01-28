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
    const { userNameAliado, surnameAliado, userIDAliado, dobAliado, emailAliado, passwordAliado, telAliado, dirAliado, expAliado, independentSkills } = req.body;
    try {
        const connection = await database(); // Get the database connection
        
        // Check for existing record
        const [existing] = await connection.query('SELECT * FROM aliado WHERE cedula = ? OR email = ?', [userIDAliado, emailAliado]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Aliado with this userID or email already exists.' });
        }

        await connection.query('INSERT INTO aliado (nombre, apellido, email, contraseña, cedula, fecha_nacimiento, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            [userNameAliado, surnameAliado, emailAliado, passwordAliado, userIDAliado, dobAliado, telAliado, dirAliado]);
        
        // Handle skills if needed
        // for (const skill of skills) {
        await connection.query('INSERT INTO experiencia_laboral (puesto, descripcion) VALUES (?, ?)', [expAliado, independentSkills]);
        // }

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
        
        // Check for existing record
        const [existing] = await connection.query('SELECT * FROM cliente WHERE email = ?', [emailCliente]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Cliente with this email already exists.' });
        }

        // Insert the client data into the clientes table
        const [result] = await connection.query('INSERT INTO cliente (nombre, apellido, email, contraseña, telefono) VALUES (?, ?, ?, ?, ?)', 
            [userNameCliente, surnameCliente, emailCliente, passwordCliente, telCliente]);
        
        const clientId = result.insertId; // Get the ID of the newly created client

        // Initialize an array to hold new service IDs
        const newServiceIds = [];

        // Insert into cliente_servicio based on the selected services
        for (const servicio of serviciosCliente) {
            // Check if the service already exists
            const [serviceResult] = await connection.query('SELECT id_servicio FROM servicio WHERE nombre_servicio = ?', [servicio]);
            let servicioId;

            if (serviceResult.length > 0) {
                // Service exists, get the id_servicio
                servicioId = serviceResult[0].id_servicio;
            } else {
                // Service does not exist, insert it
                const [insertServiceResult] = await connection.query('INSERT INTO servicio (nombre_servicio) VALUES (?)', [servicio]);
                servicioId = insertServiceResult.insertId; // Get the new id_servicio
            }

            // Add the servicioId to the newServiceIds array
            newServiceIds.push(servicioId);

            // Insert into cliente_servicio
            await connection.query('INSERT INTO cliente_servicio (id_cliente, id_servicio) VALUES (?, ?)', 
                [clientId, servicioId]);
        }

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
