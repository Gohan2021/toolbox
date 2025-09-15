import dotenv from 'dotenv';
dotenv.config({ path: '.env', override: true, debug: true }); // PRIMERA línea
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import database from "./database.js";
import { methods as authentication } from "./controllers/authentication.controller.js";
import servicesRoutes from "./public/routes/servicios.routes.js";
import clientesRoutes from "./public/routes/clientes.js";
import marketplaceRoutes from "./public/routes/marketplace.js";
import aliadosRoutes from "./public/routes/aliados.js";
import cartRoutes from "./public/routes/cart.js";
import wompiRoutes from "./public/routes/wompi.js";
import wompiWebhookRoutes from "./public/routes/wompi-webhook.js";
import debugRoutes from './public/routes/debug.js'; // ✅ Importar debugRoutes
import debugEcho from './public/routes/debug-echo.js';
import debugWebhookRoutes from "./public/routes/debug-webhook.js";
import debugEnvRoutes from "./public/routes/debug-env.js";
import { upload } from "./multerConfig.js"; // ✅ Importar `upload` correctamente
const app = express();
app.use(cookieParser()); // Middleware para manejar cookies

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Ajusta la ruta si tu .env está en otra carpeta
dotenv.config({
  path: path.join(__dirname, '../.env'),
  override: true,   // fuerza que .env reemplace valores previos del entorno
  debug: true       // log de carga (opcional, útil para verificar)
});

// Inicializar la aplicación
app.set("port", 4000);

// Middleware para CORS
app.use(cors({
    origin: ["http://127.0.0.1:5501", "http://127.0.0.1:5500", "http://127.0.0.1:4000"],
    credentials: true // Permitir el envío de cookies en las solicitudes
}));


// Middleware para manejar datos JSON y formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // 🔹 Middleware para manejar cookies correctamente
app.use(cors({
    origin: "http://localhost:4000",
    credentials: true // 🔥 Asegurar que se envían cookies en las solicitudes
}));

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads_marketplace", express.static(path.join(__dirname, "public/uploads_marketplace")));
// ✅ **Endpoint para subir imágenes incluyendo foto de perfil**
app.post("/api/register/aliado/loadImages", upload.fields([
    { name: "fotoPerfil", maxCount: 1 },
    { name: "idphotofront", maxCount: 1 },
    { name: "idphotoback", maxCount: 1 },
    { name: "imageFilecertName", maxCount: 10 }
]), async (req, res) => {

    console.log("Datos de la solicitud:", req.body);
    console.log("Archivos recibidos:", req.files);

    if (!req.files || !req.body.aliadoId) {
        return res.status(400).json({ error: "No se han subido archivos o falta el ID del aliado" });
    }

    // 📁 **Obtener las rutas de las imágenes**
    const fotoPerfilPath = req.files.fotoPerfil ? `/uploads/${req.files.fotoPerfil[0].filename}` : "";
    const imagePathFront = req.files.idphotofront ? `/uploads/${req.files.idphotofront[0].filename}` : "";
    const imagePathBack = req.files.idphotoback ? `/uploads/${req.files.idphotoback[0].filename}` : "";

    const certificationsPaths = req.files.imageFilecertName
        ? req.files.imageFilecertName.map(file => `/uploads/${file.filename}`)
        : [];

    // 🔗 **Conectar a la base de datos**
    try {
        const connection = await database();

        // 📥 **Actualizar la columna 'foto' en la tabla 'aliado'**
        const aliadoId = req.body.aliadoId; // Asegúrate de enviar el ID del aliado desde el front-end
        const [result] = await connection.query(
            "UPDATE aliado SET foto = ? WHERE id_aliado = ?",
            [fotoPerfilPath, aliadoId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Aliado no encontrado" });
        }

        return res.status(200).json({
            message: "Imágenes subidas y foto de perfil actualizada en la base de datos",
            fotoPerfil: fotoPerfilPath,
            idPhotoFront: imagePathFront,
            idPhotoBack: imagePathBack,
            certifications: certificationsPaths
        });

    } catch (error) {
        console.error("Error al guardar la foto en la base de datos:", error.message);
        return res.status(500).json({ error: "Error al guardar la foto en la base de datos" });
    }
});
// Rutas estáticas de la aplicación
app.use(express.static(path.join(__dirname, "public")));

// Rutas para las páginas principales
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "pages", "usuario.html")));
app.get("/aliado", (req, res) => res.sendFile(path.join(__dirname, "pages", "index.html")));
app.get("/form", (req, res) => res.sendFile(path.join(__dirname, "pages", "form.html")));
app.get("/form-cliente", (req, res) => res.sendFile(path.join(__dirname, "pages", "form_cliente.html")));
app.get("/cliente", (req, res) => res.sendFile(path.join(__dirname, "pages", "cliente.html")));
app.get("/formularioPublicacionCliente", (req, res) => res.sendFile(path.join(__dirname, "pages", "formularioPublicacionCliente.html")));
app.get("/hazteConocer", (req, res) => res.sendFile(path.join(__dirname, "pages", "hazteConocer.html")));
app.get("/perfilCliente", (req, res) => res.sendFile(path.join(__dirname, "pages", "perfilCliente.html")));
app.get("/myv", (req, res) => res.sendFile(path.join(__dirname, "pages", "myv.html")));
app.get("/myv_cliente", (req, res) => res.sendFile(path.join(__dirname, "pages", "myv_cliente.html")));
app.get("/uso", (req, res) => res.sendFile(path.join(__dirname, "pages", "uso.html")));
app.get("/uso_cliente", (req, res) => res.sendFile(path.join(__dirname, "pages", "uso_cliente.html")));

app.get("/marketplace", (req, res) => res.sendFile(path.join(__dirname, "pages", "marketplace.html")));
app.get("/publicar", (req, res) => res.sendFile(path.join(__dirname, "pages", "publicar.html")));
app.get("/elige_registro", (req, res) => res.sendFile(path.join(__dirname, "pages", "elige_registro.html")));
app.get("/pasarela_pagos", (req, res) => res.sendFile(path.join(__dirname, "pages", "pasarela_pagos.html")));

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
app.post("/api/login/cliente", authentication.loginCliente);
app.post("/api/register/aliado", authentication.registerAliado);
app.post("/api/register/cliente", authentication.registerCliente);

// Ruta para servicios y aliados
// Primero, lo específico
app.use("/api/aliado", aliadosRoutes);
app.use("/api/cliente", clientesRoutes);

// Luego, lo más general
app.use("/api", servicesRoutes);
app.use("/api", marketplaceRoutes);

//Ruta carrito de compras
app.use("/api", cartRoutes);
app.use("/api", wompiRoutes);
app.use("/api", wompiWebhookRoutes);
app.use('/api', debugRoutes);
app.use('/api', express.json(), debugEcho); // 👈 asegúrate de tener express.json aquí
app.use("/api", debugWebhookRoutes);
app.use("/api", debugEnvRoutes);

// Si estás en HTTP en local, deja HSTS tal cual (Helmet lo maneja).
// Importante: NO pongas meta CSP en el HTML si usas Helmet (evita doble política).
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],

    // JS externos permitidos
    scriptSrc: [
      "'self'",
      // Wompi (script del widget)
      "https://checkout.wompi.co",
      // Tus CDNs de UI (si los usas)
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com"
    ],

    // CSS externos (Bootstrap/Google Fonts)
    // Si tienes estilos inline tuyos, conserva 'unsafe-inline' en styleSrc.
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com"
    ],

    // Fuentes
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "data:"
    ],

    // iframes usados por el widget al abrirse
    frameSrc: [
      "'self'",
      "https://checkout.wompi.co",
      "https://checkout-sandbox.wompi.co"
    ],

    // Llamadas XHR/fetch (Wompi APIs)
    connectSrc: [
      "'self'",
      "https://production.wompi.co",
      "https://sandbox.wompi.co",
      "https://checkout.wompi.co"
    ],

    imgSrc: ["'self'", "data:", "blob:"],
    objectSrc: ["'none'"],
    // Desactiva esto si te rompe en dev http
    upgradeInsecureRequests: []
  }
}));


// Iniciar el servidor solo si no es un entorno de pruebas
if (process.env.NODE_ENV !== "test") {
    app.listen(4000, () => {
        console.log("Servidor corriendo en puerto 4000");
    });
}

