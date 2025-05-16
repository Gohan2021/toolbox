import express from "express";
import database from "../../database.js";
import multer from "multer";
import path from "path";
import { verifyToken } from "../../controllers/authentication.controller.js";
import { methods as authentication } from "../../controllers/authentication.controller.js";
import { upload } from "../../multerConfig.js"; // ✅ Importar `upload` de index.js

const router = express.Router();
// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads"); // carpeta donde guardarás las imágenes y videos
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${file.fieldname}${ext}`);
    }
  });
  
  const upload_image = multer({ storage: storage });
// ✅ Ruta protegida para obtener la información del cliente autenticado junto con los servicios tomados
router.get("/perfil", verifyToken, async (req, res) => {
    console.log("📡 Solicitud autenticada. ID del usuario:", req.user?.userId);

    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "No autorizado, token inválido." });
    }

    try {
        const connection = await database();

        // 🔍 Obtener información del cliente
        const [clienteData] = await connection.query(
            `SELECT id_cliente, nombre, apellido, telefono, email, direccion, foto 
             FROM cliente 
             WHERE id_cliente = ?`, 
            [req.user.userId]
        );

        if (clienteData.length === 0) {
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        // 🔍 Obtener servicios tomados por el cliente
        const [serviciosTomados] = await connection.query(
        `SELECT 
        s.id_servicio, 
        s.nombre_servicio, 
        a.id_aliado,   -- <-- Agrega este
        a.nombre AS aliado_nombre, 
        a.apellido AS aliado_apellido, 
        a.foto AS aliado_foto,
        ca.estado, 
        ca.id AS id_servicio_cliente
        FROM cliente_aliado ca
        JOIN servicio s ON ca.id_servicio = s.id_servicio
        JOIN aliado a ON ca.id_aliado = a.id_aliado
        WHERE ca.id_cliente = ?
            `, 
            [req.user.userId]
        );

        return res.json({ 
            cliente: clienteData[0], 
            serviciosTomados 
        });

    } catch (error) {
        console.error("❌ Error al obtener la información del cliente:", error.message);
        res.status(500).json({ message: "Error al obtener la información del cliente." });
    }
});
router.post("/finalizar-servicio", verifyToken, async (req, res) => {
    const { idServicioCliente } = req.body;
  
    if (!idServicioCliente) {
      return res.status(400).json({ message: "Falta el ID del servicio cliente." });
    }
  
    try {
      const conn = await database();
      await conn.query(`
        UPDATE cliente_aliado 
        SET estado = 'completado'
        WHERE id = ?`, 
        [idServicioCliente]
      );
  
      res.status(200).json({ message: "Servicio marcado como completado." });
    } catch (error) {
      console.error("Error al finalizar servicio:", error.message);
      res.status(500).json({ message: "Error interno." });
    }
  });
// ✅ **Endpoint para subir la imagen de perfil del cliente**
router.post("/uploadImage", upload.single("fotoPerfil"), async (req, res) => {
    console.log("📡 Recibiendo imagen de perfil del cliente...");
    console.log("🔍 Archivo recibido:", req.file);
    console.log("🔍 ID del cliente:", req.body.clienteId);

    const { clienteId } = req.body;
    const fotoPerfilPath = req.file ? `/uploads/${req.file.filename}` : "";

    if (!clienteId || !fotoPerfilPath) {
        console.error("⚠️ Faltan datos: clienteId o imagen no válida.");
        return res.status(400).json({ error: "Faltan datos o imagen inválida." });
    }

    try {
        const connection = await database();
        await connection.query("UPDATE cliente SET foto = ? WHERE id_cliente = ?", [fotoPerfilPath, clienteId]);

        console.log("✅ Imagen de perfil actualizada correctamente:", fotoPerfilPath);
        return res.status(200).json({
            message: "Imagen de perfil actualizada en la base de datos",
            fotoPerfil: fotoPerfilPath
        });

    } catch (error) {
        console.error("❌ Error al actualizar imagen en la base de datos:", error.message);
        return res.status(500).json({ error: "Error al actualizar imagen." });
    }
});
// ✅ Endpoint para registrar qué aliado fue seleccionado por el cliente
router.post("/obtenerServicio", async (req, res) => {
    const { clienteId, aliadoId, servicioId } = req.body;

    if (!clienteId || !aliadoId || !servicioId) {
        return res.status(400).json({ message: "Faltan datos: clienteId, aliadoId y servicioId son obligatorios." });
    }

    try {
        const connection = await database();

        // Verificar si ya existe la relación
        const [existing] = await connection.query(
            "SELECT * FROM cliente_aliado WHERE id_cliente = ? AND id_aliado = ? AND id_servicio = ?", 
            [clienteId, aliadoId, servicioId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Ya has solicitado este servicio con este aliado anteriormente." });
        }

        // Insertar la relación en cliente_aliado
        await connection.query(
            "INSERT INTO cliente_aliado (id_cliente, id_aliado, id_servicio) VALUES (?, ?, ?)", 
            [clienteId, aliadoId, servicioId]
        );

        return res.status(201).json({ message: "Servicio registrado correctamente con el aliado." });

    } catch (error) {
        console.error("❌ Error al registrar el servicio con el aliado:", error);
        return res.status(500).json({ message: "Error interno al registrar el servicio." });
    }
});
// ✅ Endpoint de Login para clientes
router.post("/login/cliente", authentication.loginCliente);

// ✅ Endpoint de Registro para clientes
router.post("/register/cliente", authentication.registerCliente);

// 🚪 Endpoint para cerrar sesión
router.post("/logout/cliente", (req, res) => {
    res.clearCookie("jwt_cliente", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        path: "/"
    });
    return res.status(200).json({ message: "Sesión de cliente cerrada correctamente", redirect: "/cliente" });
});
// ✅ Ruta para solicitar la recuperación de contraseña
router.post("/request-password-reset", authentication.requestPasswordReset);
// Endpoint para publicar necesidad
router.post("/publicar-necesidad", verifyToken, upload_image.fields([
  { name: 'imagenes', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  const { nombre_cliente, telefono_cliente, email_cliente, zona, horario_contacto, especialidad_requerida, descripcion, presupuesto, fecha_tentativa, urgencia } = req.body;
  const id_cliente = req.user?.userId;

  if (!id_cliente || !descripcion) {
    return res.status(400).json({ message: "Faltan campos obligatorios." });
  }

  try {
    const conn = await database();

    const [result] = await conn.query(`
      INSERT INTO publicacion_necesidad_cliente 
      (id_cliente, nombre_cliente, telefono_cliente, email_cliente, zona, horario_contacto, especialidad_requerida, descripcion, presupuesto, fecha_tentativa, urgencia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_cliente, nombre_cliente, telefono_cliente, email_cliente, zona, horario_contacto, especialidad_requerida, descripcion, presupuesto || null, fecha_tentativa || null, urgencia || 'Media']
    );

    const idPublicacion = result.insertId;

    // Guardar imágenes si existen
    if (req.files['imagenes']) {
      const imagenes = req.files['imagenes'];
      for (const img of imagenes) {
        await conn.query(`
          INSERT INTO imagenes_necesidad_cliente (id_publicacion, ruta_imagen)
          VALUES (?, ?)`,
          [idPublicacion, `/uploads/${img.filename}`]
        );
      }
    }

    // Guardar video si existe
    if (req.files['video']) {
      const video = req.files['video'][0];
      await conn.query(`
        UPDATE publicacion_necesidad_cliente
        SET video_url = ?
        WHERE id_publicacion = ?`,
        [`/uploads/${video.filename}`, idPublicacion]
      );
    }

    return res.status(201).json({ message: "Solicitud publicada exitosamente." });

  } catch (error) {
    console.error("❌ Error al publicar necesidad:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

export default router;
