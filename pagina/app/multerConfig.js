import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Configurar __dirname correctamente en módulos ES
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 📂 Crear la carpeta 'uploads/' si no existe
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

// ✅ Configuración de almacenamiento con Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder); // 📂 Almacenar en la carpeta 'uploads'
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// ✅ Crear instancia de `multer`
const upload = multer({ storage });

export { upload };
