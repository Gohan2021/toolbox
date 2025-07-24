// multerConfig.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// === Almacenamiento para aliados y clientes ===
const storageAliadoCliente = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads")); // Carpeta general para aliados/clientes
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// === Almacenamiento para marketplace ===
const storageMarketplace = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/uploads_marketplace")); // Carpeta para publicaciones del marketplace
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
//Almacenamiento para solicitudes de clientes
const storageSolicitudes = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads/solicitudes")); // Carpeta específica para necesidades
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

export const uploadSolicitudes = multer({ storage: storageSolicitudes });

// Exportar ambas instancias de multer
export const upload = multer({ storage: storageAliadoCliente }); // Para aliados y clientes
export const uploadMarketplace = multer({ storage: storageMarketplace }); // Para publicaciones del marketplace
