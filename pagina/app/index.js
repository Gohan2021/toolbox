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
app.post("/api/register/aliado/loadImages", upload.fields([
    { name: "idphotofront", maxCount: 1 },
    { name: "idphotoback", maxCount: 1 }
]), (req, res) => {
    console.log("Datos de la solicitud:", req.body);
    console.log("Archivos recibidos:", req.files);

    // Verificar si se recibieron los archivos
    if (!req.files || (!req.files.idphotofront && !req.files.idphotoback)) {
        return res.status(400).json({ error: "No se han subido archivos" });
    }

    // Obtener las rutas de las imágenes (si existen)
    const imagePathFront = req.files.idphotofront ? `/uploads/${req.files.idphotofront[0].filename}` : "";
    const imagePathBack = req.files.idphotoback ? `/uploads/${req.files.idphotoback[0].filename}` : "";

    console.log("Ruta de la imagen frontal:", imagePathFront);
    console.log("Ruta de la imagen trasera:", imagePathBack);

    return res.status(200).json({
        message: "Imágenes subidas con éxito",
        idPhotoFront: imagePathFront,
        idPhotoBack: imagePathBack
    });
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
