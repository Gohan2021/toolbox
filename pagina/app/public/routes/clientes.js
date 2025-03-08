import express from "express";
import database from "../../database.js";
import { verifyToken } from "../../controllers/authentication.controller.js";
import { methods as authentication } from "../../controllers/authentication.controller.js";

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
            `SELECT id_cliente, nombre, apellido, telefono, email, direccion FROM cliente WHERE id_cliente = ?`, 
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
