import bcryptjs from "bcryptjs";
import database from '../database.js'; // Import database connection
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
// Inicio de sesión
async function loginAliado(req, res) {
    const { email, password } = req.body;
    console.log("🔑 Intento de inicio de sesión ALIADO con:", email);

    try {
        if (!email || !password) {
            return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
        }

        const connection = await database();
        const [rows] = await connection.query("SELECT * FROM aliado WHERE email = ?", [email]);

        if (rows.length === 0) {
            return res.status(404).send({ status: "Error", message: "Correo o contraseña incorrectos" });
        }

        const user = rows[0];
        const isMatch = await bcryptjs.compare(password, user.contraseña);

        if (!isMatch) {
            return res.status(401).send({ status: "Error", message: "Credenciales incorrectas" });
        }

        // 🔐 Generar token JWT
        const token = jwt.sign(
            { userId: user.id_aliado, email: user.email, role: "aliado" }, // Agregamos `role`
            process.env.JWT_LOGIN,
            { expiresIn: "1h" }
        );

        // 🍪 Configurar la cookie con un nombre específico para Aliado
        res.cookie("jwt_aliado", token, { 
            httpOnly: true, 
            secure: false, 
            sameSite: "Lax", 
            maxAge: 60 * 60 * 1000 
        });

        console.log("✅ Cookie JWT de ALIADO configurada correctamente:", token);

        return res.status(200).send({
            status: "Success",
            message: "Inicio de sesión exitoso",
            aliadoId: user.id_aliado,
            redirect: "/hazteConocer",
            aliado: {
                id_aliado: user.id_aliado,
                nombre: user.nombre,
                apellido: user.apellido,
                telefono: user.telefono,
                email: user.email
            }
        });

    } catch (err) {
        console.error("❌ Error en el login ALIADO:", err.message);
        return res.status(500).json({ status: "Error", message: "Error en el inicio de sesión", details: err.message });
    }
}

async function registerAliado(req, res) {
    const { 
        userNameAliado, 
        surnameAliado, 
        userIDAliado, 
        emailAliado, 
        passwordAliado, 
        dobAliado, 
        telAliado, 
        dirAliado, 
        skills // 🔹 Skills incluye { skill: "Plomería", experience: "5 años" }
    } = req.body;

    try {
        // 1️⃣ Validación de campos obligatorios
        if (!userNameAliado || !surnameAliado || !userIDAliado || !emailAliado || !passwordAliado) {
            return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
        }

        const connection = await database(); // Conectar a la base de datos

        // 2️⃣ Verificar si el usuario ya existe en la base de datos
        const [existing] = await connection.query(
            'SELECT * FROM aliado WHERE cedula = ? OR email = ? OR telefono = ?', 
            [userIDAliado, emailAliado, telAliado]
        );

        if (existing.length > 0) {
            return res.status(400).send({ status: "Error", message: "Esta cédula, correo o teléfono ya están registrados" });
        }

        // 3️⃣ Hashear la contraseña
        const salt = await bcryptjs.genSalt(5);
        const hashPassword = await bcryptjs.hash(passwordAliado, salt);

        // 4️⃣ Manejo de la Imagen (Foto de Perfil)
        // const fotoPerfil = req.file ? `/uploads/${req.file.filename}` : null;

        // 5️⃣ Insertar el aliado en la base de datos (incluyendo la ruta de la foto)
        const [result] = await connection.query(
            'INSERT INTO aliado (nombre, apellido, email, contraseña, cedula, fecha_nacimiento, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            [userNameAliado, surnameAliado, emailAliado, hashPassword, userIDAliado, dobAliado, telAliado, dirAliado]
        );

        const aliadoId = result.insertId; // Obtener el ID del aliado recién insertado

        // 🔍 **Mapeo directo de los servicios a sus IDs correspondientes**
        const servicioMap = {
            "plomeria": 1,
            "Electricidad": 2,
            "carpinteria": 3,
            "enchape": 4,
            "metalicas": 5,
            "pintura": 6,
            "cerrajeria": 7,
            "refrigeracion": 8,
            "jardineria": 9,
            "obras": 10
        };

        const serviciosRelacionados = []; // Para almacenar las relaciones válidas
        
        // 6️⃣ Insertar habilidades (skills) y relacionarlas con servicios
        if (Array.isArray(skills) && skills.length > 0) {
            
            for (let skill of skills) {

                // Validar que el skill tenga una propiedad `skill` antes de continuar
                if (!skill || !skill.skill) {
                    console.warn('Skill inválido o faltante:', skill);
                    continue; // Saltar al siguiente skill
                }

                // Insertar la habilidad en la tabla `experiencia_laboral`
                await connection.query(
                    'INSERT INTO experiencia_laboral (id_aliado, puesto, descripcion) VALUES (?, ?, ?)', 
                    [aliadoId, skill.skill, skill.experience]
                );

                // Obtener el ID del servicio desde el mapa
                const servicioId = servicioMap[skill.skill.toLowerCase()];

                // Si el ID del servicio es válido, agregar a la relación
                if (servicioId) {
                    serviciosRelacionados.push([servicioId, aliadoId]);
                } else {
                    console.warn(`El servicio "${skill.skill}" no coincide con ningún registro válido.`);
                }
            }

            // 7️⃣ Insertar las relaciones en la tabla `aliado_servicio`
            if (serviciosRelacionados.length > 0) {
                await connection.query(
                    'INSERT INTO aliado_servicio (id_servicio, id_aliado) VALUES ?',
                    [serviciosRelacionados]
                );
            }
        }

        return res.status(201).send({ 
            status: "Success", 
            message: `Nuevo aliado ${userNameAliado} registrado exitosamente`, 
            redirect: "/hazteConocer" 
        });

    } catch (err) {
        console.error('Error registrando el aliado:', err.message);
        res.status(500).json({ error: 'Error registrando el aliado', details: err.message });
    }
}

// 🚀 REGISTRO CLIENTE
async function registerCliente(req, res) {
    const { 
        userNameCliente, 
        surnameCliente, 
        emailCliente, 
        passwordCliente, 
        telCliente,
        dirCliente,
        serviciosCliente 
    } = req.body;

    try {
        // ✅ 1️⃣ Validar campos obligatorios
        if (!userNameCliente || !surnameCliente || !emailCliente || !passwordCliente || !telCliente || !dirCliente) {
            return res.status(400).send({ status: "Error", message: "Todos los campos son obligatorios." });
        }

        const connection = await database();

        // ✅ 2️⃣ Verificar si ya existe el cliente
        const [existing] = await connection.query(
            "SELECT * FROM cliente WHERE email = ? OR telefono = ?", 
            [emailCliente, telCliente]
        );

        if (existing.length > 0) {
            return res.status(400).send({ status: "Error", message: "Este correo o teléfono ya están registrados." });
        }

        // ✅ 3️⃣ Hashear la contraseña
        const salt = await bcryptjs.genSalt(5);
        const hashPassword = await bcryptjs.hash(passwordCliente, salt);

        // ✅ 4️⃣ Insertar Cliente en la Base de Datos
        const [result] = await connection.query(
            "INSERT INTO cliente (nombre, apellido, email, contraseña, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)", 
            [userNameCliente, surnameCliente, emailCliente, hashPassword, telCliente, dirCliente]
        );

        const clientId = result.insertId; 

        // ✅ 5️⃣ Insertar servicios del cliente (si los hay)
        if (Array.isArray(serviciosCliente) && serviciosCliente.length > 0) {
            const servicioMap = {
                "plomeria": 1, "Electricidad": 2, "carpinteria": 3, "enchape": 4, 
                "metalicas": 5, "pintura": 6, "cerrajeria": 7, "refrigeracion": 8, 
                "jardineria": 9, "obras": 10
            };

            const serviciosRelacionados = serviciosCliente
                .map(servicio => [servicioMap[servicio.toLowerCase()], clientId])
                .filter(([servicioId]) => servicioId !== undefined);

            if (serviciosRelacionados.length > 0) {
                await connection.query(
                    "INSERT INTO cliente_servicio (id_servicio, id_cliente) VALUES ?",
                    [serviciosRelacionados]
                );
            }
        }

        // ✅ 6️⃣ Generar token JWT para el nuevo cliente
        const token = jwt.sign(
            { userId: clientId, email: emailCliente }, 
            process.env.JWT_LOGIN, 
            { expiresIn: "1h" }
        );

        // ✅ 7️⃣ Guardar la cookie `jwt_cliente`
        res.cookie("jwt_cliente", token, {
            httpOnly: true,
            secure: false, // Pon `true` si usas HTTPS
            sameSite: "Lax",
            maxAge: 60 * 60 * 1000 
        });

        console.log("✅ Registro exitoso. Token generado y enviado en cookie.");

        return res.status(201).send({ 
            status: "Success", 
            message: `Nuevo cliente ${userNameCliente} registrado exitosamente`, 
            redirect: "/perfilCliente"
        });

    } catch (err) {
        console.error("❌ Error registrando cliente:", err.message);
        res.status(500).json({ error: "Error registrando cliente", details: err.message });
    }
}

// 🚪 Inicio de Sesión Cliente
async function loginCliente(req, res) {
    console.log("📡 Intento de login CLIENTE:", req.body); // 🛠️ Ver qué datos recibe

    const { email, password } = req.body;

    if (!email || !password) {
        console.log("❌ Campos incompletos:", { email, password });
        return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
    }

    try {
        const connection = await database();

        const [rows] = await connection.query(
            "SELECT * FROM cliente WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            console.log("❌ Cliente no encontrado:", email);
            return res.status(404).send({ status: "Error", message: "Correo o contraseña incorrectos" });
        }

        const user = rows[0];
        console.log("✅ Cliente encontrado:", user);

        const isMatch = await bcryptjs.compare(password, user.contraseña);
        if (!isMatch) {
            console.log("❌ Contraseña incorrecta.");
            return res.status(401).send({ status: "Error", message: "Credenciales incorrectas" });
        }

        const token = jwt.sign(
            { userId: user.id_cliente, email: user.email },
            process.env.JWT_LOGIN,
            { expiresIn: "1h" }
        );

        res.cookie("jwt_cliente", token, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
            maxAge: 60 * 60 * 1000
        });

        console.log("✅ Cookie `jwt_cliente` generada correctamente:", token);

        return res.status(200).send({
            status: "Success",
            message: "Inicio de sesión exitoso",
            clienteId: user.id_cliente,
            redirect: "/perfilCliente",
            cliente: {
                id_cliente: user.id_cliente,
                nombre: user.nombre,
                apellido: user.apellido,
                telefono: user.telefono,
                direccion: user.direccion,
                email: user.email,
            }
        });

    } catch (err) {
        console.error("❌ Error en loginCliente:", err.message);
        return res.status(500).json({ status: "Error", message: "Error en el login", details: err.message });
    }
}

// authMiddleware.js
export function verifyToken(req, res, next) {
    const token = req.cookies?.jwt_aliado || req.cookies?.jwt_cliente; // 🔍 Buscar ambas cookies

    console.log("🔍 Token recibido en verifyToken:", token);

    if (!token) {
        console.warn("⚠️ No se recibió ningún token.");
        return res.status(401).json({ message: "Acceso no autorizado, token no encontrado." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_LOGIN);
        console.log("✅ Token decodificado:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("❌ Error al verificar el token:", error.message);
        return res.status(403).json({ message: "Token inválido o expirado." });
    }
}

// Configurar el transporte de Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail", // O usa tu servicio de correo SMTP (Mailgun, SendGrid, SMTP personal, etc.)
    auth: {
        user: process.env.EMAIL_USER, // Tu correo electrónico
        pass: process.env.EMAIL_PASS // Tu contraseña o App Password
    }
});

// ✅ Endpoint para solicitar la recuperación de contraseña
async function requestPasswordReset(req, res) {
    const { email } = req.body;

    try {
        const connection = await database();

        // Verificar si el correo existe en la base de datos
        const [user] = await connection.query(
            "SELECT id_aliado FROM aliado WHERE email = ?",
            [email]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: "Correo no encontrado." });
        }

        const userId = user[0].id_aliado;

        // 🔑 Generar un token de recuperación (puede ser más seguro usando JWT o un hash)
        const resetToken = Math.random().toString(36).substring(2);

        // Guardar el token en la base de datos (puede ser una tabla específica para tokens de recuperación)
        await connection.query(
            "UPDATE aliado SET reset_token = ? WHERE id_aliado = ?",
            [resetToken, userId]
        );

        // Enviar el correo electrónico con el enlace de recuperación
        const resetLink = `http://localhost:4000/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Recuperación de Contraseña - TOOLBOX",
            html: `
                <h2>Recuperación de Contraseña</h2>
                <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                <a href="${resetLink}">Restablecer Contraseña</a>
                <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            `
        });

        return res.status(200).json({ message: "Correo de recuperación enviado." });

    } catch (error) {
        console.error("Error al solicitar la recuperación de contraseña:", error.message);
        return res.status(500).json({ message: "Error al enviar el correo de recuperación." });
    }
}
export const methods = {
    loginAliado,
    loginCliente,
    registerAliado,
    registerCliente,
    requestPasswordReset
};
