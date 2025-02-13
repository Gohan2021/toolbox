import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import database from "./database.js";
import { methods as authentication } from "./controllers/authentication.controller.js";

// Configuración de __dirname en ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inicializar la aplicación
const app = express();
app.set("port", 4000);

// Middleware para CORS
app.use(cors({
    origin: ["http://127.0.0.1:5501", "http://127.0.0.1:5500", "http://127.0.0.1:4000"]
}));

// Middleware para manejar datos JSON y formularios
app.use(express.urlencoded({ extended: true })); // Formularios
app.use(express.json()); // JSON

// Intentar conectar a la base de datos antes de iniciar el servidor
(async () => {
    try {
        await database();
        console.log("Conexión a la base de datos exitosa");
    } catch (error) {
        console.error("Error conectando a la base de datos:", error.message);
        process.exit(1);
    }
})();

// Crear la carpeta 'uploads/' si no existe
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

// Configurar Multer para el almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder); // Guardar en 'uploads/'
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// ✅ **Endpoint para subir imagen**
app.post("/api/register/aliado/loadImages", upload.single("idphotofront"), (req, res) => {
    console.log("Datos de la solicitud:", req.body);
    console.log("Archivo recibido:", req.file);

    if (!req.file) {
        return res.status(400).json({ error: "No se ha subido ningún archivo" });
    }

    // Ruta de la imagen guardada
    const imagePath = `/uploads/${req.file.filename}`;

    console.log("Ruta de la imagen guardada:", imagePath);
    return res.status(200).json({ message: "Imagen subida con éxito", imagePath });
});

// Servir archivos estáticos desde la carpeta 'uploads'
app.use("/uploads", express.static(uploadFolder));

// Rutas estáticas de la aplicación
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "pages", "index.html")));
app.get("/form", (req, res) => res.sendFile(path.join(__dirname, "pages", "form.html")));
app.get("/cliente", (req, res) => res.sendFile(path.join(__dirname, "pages", "cliente.html")));
app.get("/hazteConocer", (req, res) => res.sendFile(path.join(__dirname, "pages", "hazteConocer.html")));
app.get("/myv", (req, res) => res.sendFile(path.join(__dirname, "pages", "myv.html")));
app.get("/politicas", (req, res) => res.sendFile(path.join(__dirname, "pages", "politicas.html")));
app.get("/uso", (req, res) => res.sendFile(path.join(__dirname, "pages", "uso.html")));

// Rutas de autenticación
app.post("/api/login/aliado", authentication.loginAliado);
app.post("/api/register/aliado", authentication.registerAliado);
app.post("/api/register/cliente", authentication.registerCliente);

// Iniciar el servidor
app.listen(app.get("port"), () => {
    console.log(`Servidor corriendo en puerto ${app.get("port")}`);
});
