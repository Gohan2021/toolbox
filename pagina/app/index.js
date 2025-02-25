import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import database from "./database.js";
import { methods as authentication } from "./controllers/authentication.controller.js";
import servicesRoutes from "./public/routes/aliados.js";

const app = express();
const router = express.Router();

// Configuración de __dirname en ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inicializar la aplicación
app.set("port", 4000);

// Middleware para CORS
app.use(cors({
    origin: ["http://127.0.0.1:5501", "http://127.0.0.1:5500", "http://127.0.0.1:4000"]
}));

// Middleware para manejar datos JSON y formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

// Configuración de Multer para múltiples archivos, incluida la foto de perfil
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder); // Almacenar en la carpeta 'uploads'
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// ✅ **Endpoint para subir imágenes incluyendo foto de perfil**
app.post("/api/register/aliado/loadImages", upload.fields([
    { name: "fotoPerfil", maxCount: 1 },
    { name: "idphotofront", maxCount: 1 },
    { name: "idphotoback", maxCount: 1 },
    { name: "imageFilecertName", maxCount: 10 }
]), (req, res) => {
    console.log("Datos de la solicitud:", req.body);
    console.log("Archivos recibidos:", req.files);

    if (!req.files) {
        return res.status(400).json({ error: "No se han subido archivos" });
    }

    const fotoPerfilPath = req.files.fotoPerfil ? `/uploads/${req.files.fotoPerfil[0].filename}` : "";
    const imagePathFront = req.files.idphotofront ? `/uploads/${req.files.idphotofront[0].filename}` : "";
    const imagePathBack = req.files.idphotoback ? `/uploads/${req.files.idphotoback[0].filename}` : "";

    const certificationsPaths = req.files.imageFilecertName
        ? req.files.imageFilecertName.map(file => `/uploads/${file.filename}`)
        : [];

    return res.status(200).json({
        message: "Imágenes subidas con éxito",
        fotoPerfil: fotoPerfilPath,
        idPhotoFront: imagePathFront,
        idPhotoBack: imagePathBack,
        certifications: certificationsPaths
    });
});

// Servir archivos estáticos desde la carpeta 'uploads'
app.use("/uploads", express.static(uploadFolder));

// Rutas estáticas de la aplicación
app.use(express.static(path.join(__dirname, "public")));

// Rutas para las páginas principales
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "pages", "index.html")));
app.get("/form", (req, res) => res.sendFile(path.join(__dirname, "pages", "form.html")));
app.get("/cliente", (req, res) => res.sendFile(path.join(__dirname, "pages", "cliente.html")));
app.get("/hazteConocer", (req, res) => res.sendFile(path.join(__dirname, "pages", "hazteConocer.html")));
app.get("/myv", (req, res) => res.sendFile(path.join(__dirname, "pages", "myv.html")));
app.get("/politicas", (req, res) => res.sendFile(path.join(__dirname, "pages", "politicas.html")));
app.get("/uso", (req, res) => res.sendFile(path.join(__dirname, "pages", "uso.html")));

// Rutas dinámicas para las páginas de servicios
app.get("/servicios/:servicio", (req, res) => {
    const { servicio } = req.params;
    const servicioFile = path.join(__dirname, "pages/servicios", `${servicio}.html`);

    if (fs.existsSync(servicioFile)) {
        res.sendFile(servicioFile);
    } else {
        res.status(404).send("Página del servicio no encontrada");
    }
});

// Rutas de autenticación
app.post("/api/login/aliado", authentication.loginAliado);
app.post("/api/register/aliado", authentication.registerAliado);
app.post("/api/register/cliente", authentication.registerCliente);

// Ruta para servicios y aliados
app.use("/api", servicesRoutes);

// ✅ Nueva ruta para obtener la información del aliado por su ID
app.get("/api/aliado/:id", async (req, res) => {
    const { id } = req.params; // ✅ Cambiado a 'id' en lugar de 'id_aliado'
    try {
        const connection = await database();
        const [rows] = await connection.query(
            `SELECT nombre, apellido, telefono, email, foto
             FROM aliado WHERE id_aliado = ?`, // ✅ Columna corregida a 'id'
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Aliado no encontrado." });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener la información del aliado:", error.message);
        res.status(500).json({ message: "Error al obtener la información del aliado." });
    }
});


// Iniciar el servidor
app.listen(app.get("port"), () => {
    console.log(`Servidor corriendo en puerto ${app.get("port")}`);
});
