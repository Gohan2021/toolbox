import bcryptjs from "bcryptjs";
import database from '../database.js'; // Import database connection

async function login(req, res) {
    // Lógica de inicio de sesión
}

// REGISTRO ALIADO
async function registerAliado(req, res) {
    const { userNameAliado, surnameAliado, userIDAliado, emailAliado, passwordAliado, dobAliado, telAliado, dirAliado, expAliado, independentSkills } = req.body;
    try{
    if (!userNameAliado || !surnameAliado || !userIDAliado || !emailAliado || !passwordAliado) {
        return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
    }
    const connection = await database(); // Get the database connection
    // Check for existing record
    const [existing] = await connection.query('SELECT * FROM aliado WHERE cedula = ? OR email = ? OR telefono = ?', [userIDAliado, emailAliado,telAliado]);
    if (existing.length > 0) {
        return res.status(400).send({ status: "Error", message: "Esta cédula, correo o teléfono ya están registrados" });
    }
    const salt = await bcryptjs.genSalt(5);
    const hashPassword = await bcryptjs.hash(passwordAliado, salt);
    const nuevoAliado = {
        user: userNameAliado,
        surnameAliado: surnameAliado,
        userIDAliado: userIDAliado,
        email: emailAliado, 
        password: hashPassword,
        dob: dobAliado,
        tel: telAliado,
        dir: dirAliado
    };

    // Insert into the database
    await connection.query('INSERT INTO aliado (nombre, apellido, email, contraseña, cedula, fecha_nacimiento, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [nuevoAliado.user, nuevoAliado.surnameAliado, nuevoAliado.email, nuevoAliado.password, nuevoAliado.userIDAliado, nuevoAliado.dob, nuevoAliado.tel, nuevoAliado.dir]);
    // insert experience    
    await connection.query('INSERT INTO experiencia_laboral (puesto, descripcion) VALUES (?, ?)', [expAliado, independentSkills]);

    return res.status(201).send({ status: "Success", message: `Nuevo aliado ${nuevoAliado.user} registrado exitosamente`, redirect: "/form" });
    }
    catch (err) {
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
    login,
    registerAliado,
    registerCliente
};
