import bcryptjs from "bcryptjs";
import database from '../database.js'; // Import database connection
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
// Inicio de sesión
async function loginAliado(req, res) {
    const { email, password } = req.body; // Retrieve email and password from request body
    console.log(email, password);
    try {
        if (!email || !password ) {
            return res.status(400).send({ status: "Error", message: "Los campos están incompletos"});
        }
        const connection = await database(); // Get the database connection
        const [user] = await connection.query('SELECT * FROM aliado WHERE email = ?', [email]); // Check if user exists

        if (user.length === 0) {
            return res.status(404).send({ status: "Error", message: "Usuario no encontrado" }); // User not found
        }
        const isMatch = await bcryptjs.compare(password, user[0].contraseña); // Compare passwords
        if (!isMatch) {
            return res.status(401).send({ status: "Error", message: "Credenciales incorrectas" }); // Incorrect password
        }
        // const token = jsonwebtoken.sign({userToken:user.email},
        //     process.env.JWT_LOGIN,
        //     {expiresIn:process.env.JWT_EXPIRATION})

        // //COOKIE
        // const cookieOption = {
        //     expires: new Date (Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        //     path: "/",
        // }
        // res.cookie("jwt",token,cookieOption);
        // res.send({status:"ok",message:"Usuario loggead", redirect:"/"})

        return res.status(200).send({ status: "Success", message: "Inicio de sesión exitoso" }); // Successful login
        } catch (err) {
            console.error('Error during login:', err.message);
            res.status(500).json({ error: 'Error during login', details: err.message });
        }
}

// REGISTRO ALIADO
// async function registerAliado(req, res) {
//     const { userNameAliado, surnameAliado, userIDAliado, emailAliado, passwordAliado, dobAliado, telAliado, dirAliado, expAliado, independentSkills } = req.body;
//     try{
//     if(!userNameAliado || !surnameAliado || !userIDAliado || !emailAliado || !passwordAliado) {
//         return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
//     }
//     const connection = await database(); // Get the database connection
//     // Check for existing record
//     const [existing] = await connection.query('SELECT * FROM aliado WHERE cedula = ? OR email = ? OR telefono = ?', [userIDAliado, emailAliado,telAliado]);
//     if (existing.length > 0) {
//         return res.status(400).send({ status: "Error", message: "Esta cédula, correo o teléfono ya están registrados" });
//     }
//     const salt = await bcryptjs.genSalt(5);
//     const hashPassword = await bcryptjs.hash(passwordAliado, salt);
//     const nuevoAliado = {
//         user: userNameAliado,
//         surnameAliado: surnameAliado,
//         userIDAliado: userIDAliado,
//         email: emailAliado, 
//         password: hashPassword,
//         dob: dobAliado,
//         tel: telAliado,
//         dir: dirAliado
//     };

//     // Insert into the database
//     await connection.query('INSERT INTO aliado (nombre, apellido, email, contraseña, cedula, fecha_nacimiento, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
//         [nuevoAliado.user, nuevoAliado.surnameAliado, nuevoAliado.email, nuevoAliado.password, nuevoAliado.userIDAliado, nuevoAliado.dob, nuevoAliado.tel, nuevoAliado.dir]);
//     // insert experience    
//     await connection.query('INSERT INTO experiencia_laboral (puesto, descripcion) VALUES (?, ?)', [expAliado, skillsAliado]);

//     return res.status(201).send({ status: "Success", message: `Nuevo aliado ${nuevoAliado.user} registrado exitosamente`, redirect: "/form" });
//     }
//     catch (err) {
//         console.error('Error registering aliado:', err.message);
//         res.status(500).json({ error: 'Error registering aliado', details: err.message });
//     }
// }
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
        skills, // 🔹 Ahora se recibe como `skills`

    } = req.body;

    try {
        // Validación de campos obligatorios
        if (!userNameAliado || !surnameAliado || !userIDAliado || !emailAliado || !passwordAliado) {
            return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
        }

        const connection = await database(); // Obtener la conexión a la base de datos

        // Verificar si el usuario ya existe en la base de datos
        const [existing] = await connection.query(
            'SELECT * FROM aliado WHERE cedula = ? OR email = ? OR telefono = ?', 
            [userIDAliado, emailAliado, telAliado]
        );

        if (existing.length > 0) {
            return res.status(400).send({ status: "Error", message: "Esta cédula, correo o teléfono ya están registrados" });
        }

        // Hashear la contraseña
        const salt = await bcryptjs.genSalt(5);
        const hashPassword = await bcryptjs.hash(passwordAliado, salt);

        // Insertar el aliado en la base de datos
        const [result] = await connection.query(
            'INSERT INTO aliado (nombre, apellido, email, contraseña, cedula, fecha_nacimiento, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            [userNameAliado, surnameAliado, emailAliado, hashPassword, userIDAliado, dobAliado, telAliado, dirAliado]
        );

        const aliadoId = result.insertId; // Obtener el ID del aliado recién insertado
        

        // Insertar habilidades (skills debe ser un array)
        if (Array.isArray(skills) && skills.length > 0) {
            for (let skill of skills) {
                await connection.query(
                    'INSERT INTO experiencia_laboral (id_aliado, puesto, descripcion) VALUES (?, ?, ?)', 
                    [aliadoId, skill.skill, skill.experience]
                );
            }
        }

        return res.status(201).send({ 
            status: "Success", 
            message: `Nuevo aliado ${userNameAliado} registrado exitosamente`, 
            redirect: "/form" 
        });

    } catch (err) {
        console.error('Error registering aliado:', err.message);
        res.status(500).json({ error: 'Error registering aliado', details: err.message });
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

export const methods = {
    loginAliado,
    registerAliado,
    registerCliente
};
