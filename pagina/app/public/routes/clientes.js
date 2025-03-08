import express from "express";
import database from "../../database.js";
import multer from "multer";
import path from "path";
import { verifyToken } from "../../controllers/authentication.controller.js";
import { methods as authentication } from "../../controllers/authentication.controller.js";
import { upload } from "../../multerConfig.js"; // ✅ Importar `upload` de index.js

const router = express.Router();

// ✅ Ruta protegida para obtener la información del cliente autenticado
router.get("/cliente/perfil", verifyToken, async (req, res) => {
    console.log("📡 Solicitud autenticada. ID del usuario:", req.user?.userId);
    
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "No autorizado, token inválido." });
    }

    try {
        const connection = await database();

        // 🔍 Obtener información del cliente
        const [clienteData] = await connection.query(
            `SELECT id_cliente, nombre, apellido, telefono, email, direccion, foto FROM cliente WHERE id_cliente = ?`, 
            [req.user.userId]
        );

        if (clienteData.length === 0) {
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        return res.json({ cliente: clienteData[0] });

    } catch (error) {
        console.error("❌ Error al obtener la información del cliente:", error.message);
        res.status(500).json({ message: "Error al obtener la información del cliente." });
    }
});

// ✅ **Endpoint para subir la imagen de perfil del cliente**
router.post("/cliente/uploadImage", upload.single("fotoPerfil"), async (req, res) => {
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
router.post("/cliente/obtenerServicio", async (req, res) => {
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

export default router;
