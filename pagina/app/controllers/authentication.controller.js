import bcryptjs from "bcryptjs";
import database from '../database.js'; // Import database connection
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
// Inicio de sesión
async function loginAliado(req, res) {
    const { email, password } = req.body; 
    console.log("Intento de inicio de sesión con:", email);

    try {
        // 🔍 1. Validar campos obligatorios
        if (!email || !password) {
            return res.status(400).send({ 
                status: "Error", 
                message: "Los campos están incompletos"
            });
        }

        const connection = await database(); 

        // 🔍 2. Consultar si el usuario existe
        const [rows] = await connection.query(
            "SELECT * FROM aliado WHERE email = ?", 
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).send({ 
                status: "Error", 
                message: "Correo o contraseña incorrectos" 
            });
        }

        const user = rows[0]; 

        // 🔑 3. Verificar la contraseña
        const isMatch = await bcryptjs.compare(password, user.contraseña);
        if (!isMatch) {
            return res.status(401).send({ 
                status: "Error", 
                message: "Credenciales incorrectas" 
            });
        }

        // 🔐 4. Generar token JWT seguro
        const token = jsonwebtoken.sign(
            { userId: user.id_aliado, email: user.email }, 
            process.env.JWT_LOGIN, 
            { expiresIn: process.env.JWT_EXPIRATION || "1h" }
        );

        // 🍪 5. Configuración segura de la cookie
        const cookieOptions = {
            httpOnly: true, 
            secure: false, // Establecer en true solo si usas HTTPS
            sameSite: "Lax", // "Strict" puede causar problemas con diferentes puertos
            maxAge: 60 * 60 * 1000 // 1 hora
        };

        res.cookie("jwt", token, cookieOptions);

        // 📤 6. Enviar la información del aliado al frontend
        return res.status(200).send({ 
            status: "Success", 
            message: "Inicio de sesión exitoso", 
            aliadoId: user.id_aliado, // Enviar el ID del aliado
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
        console.error("Error durante el inicio de sesión:", err.message);
        return res.status(500).json({ 
            status: "Error", 
            message: "Error durante el inicio de sesión", 
            details: err.message 
        });
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

// REGISTRO CLIENTE
async function registerCliente(req, res) {
    const { userNameCliente, surnameCliente, emailCliente, passwordCliente, telCliente, serviciosCliente } = req.body;
    try{
    if (!userNameCliente || !surnameCliente || !emailCliente || !passwordCliente || !telCliente || !serviciosCliente) {
        return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
    }
    const connection = await database(); // Get the database connection
    // Check for existing record
    const [existing] = await connection.query('SELECT * FROM cliente WHERE email = ?', [emailCliente]);
    if (existing.length > 0) {
        return res.status(400).send({ error: 'Este correo ya existe.' });
    }
    const salt = await bcryptjs.genSalt(5);
    const hashPassword = await bcryptjs.hash(passwordCliente, salt);
    const nuevoCliente = {
        user: userNameCliente,
        surnameCliente: surnameCliente,
        emailCliente: emailCliente,
        passwordCliente: hashPassword,
        telCliente: telCliente,
        serviciosCliente: serviciosCliente
    };
    const [result] = await connection.query('INSERT INTO cliente (nombre, apellido, email, contraseña, telefono) VALUES (?, ?, ?, ?, ?)', 
            [nuevoCliente.user, nuevoCliente.surnameCliente, nuevoCliente.emailCliente, nuevoCliente.passwordCliente, nuevoCliente.telCliente]);
    const clientId = result.insertId; // Get the ID of the newly created client

    // Initialize an array to hold new service IDs
    const newServiceIds = [];
    // Insert into cliente_servicio based on the selected services
    for (const servicio of serviciosCliente) {
        // Check if the service already exists
        const [serviceResult] = await connection.query('SELECT id_servicio FROM servicio WHERE nombre_servicio = ?', [servicio]);
        let servicioId;
        if (serviceResult.length > 0) {
            // Service exists, get the id_servicio
            servicioId = serviceResult[0].id_servicio;
        } else {
            // Service does not exist, insert it
            const [insertServiceResult] = await connection.query('INSERT INTO servicio (nombre_servicio) VALUES (?)', [servicio]);
            servicioId = insertServiceResult.insertId; // Get the new id_servicio
        }
        // Add the servicioId to the newServiceIds array
        newServiceIds.push(servicioId);
        // Insert into cliente_servicio
        await connection.query('INSERT INTO cliente_servicio (id_cliente, id_servicio) VALUES (?, ?)', 
            [clientId, servicioId]);
    }
    
    return res.status(201).send({ status: "Success", message: `Nuevo cliente ${nuevoCliente.user} registrado exitosamente`, redirect: "/form" });
    }
    catch (err) {
        console.error('Error registering cliente:', err.message);
        res.status(500).json({ error: 'Error registering cliente', details: err.message });
    }
}

// authMiddleware.js
export function verifyToken(req, res, next) {
    const token = req.cookies.jwt; // Asegúrate de que la cookie se lea correctamente

    if (!token) {
        return res.status(401).json({ message: "Acceso no autorizado, inicie sesión." });
    }

    try {
        const decoded = jsonwebtoken.verify(token, process.env.JWT_LOGIN);
        req.user = decoded; // Almacenar la info del usuario decodificado en la solicitud
        next(); // Continuar al siguiente middleware o controlador
    } catch (error) {
        console.error("Token inválido:", error.message);
        res.status(403).json({ message: "Token inválido o expirado." });
    }
}

export const methods = {
    loginAliado,
    registerAliado,
    registerCliente
    
};
