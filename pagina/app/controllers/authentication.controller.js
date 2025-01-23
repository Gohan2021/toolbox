import bcryptjs from "bcryptjs";

const aliados = [{
    user:"a",
    email:"a@a.com",
    password:"2a$05$gk02sPE/XJ.LkqOeiBMEyOFAJWzadklV42nbvjt3mu3ty13z5bEYa"
}];
const clientes = [{
    user:"a",
    email:"a@a.com",
    password:"2a$05$gk02sPE/XJ.LkqOeiBMEyOFAJWzadklV42nbvjt3mu3ty13z5bEYa"}];

async function login(req, res) {
    // Lógica de inicio de sesión
}

// REGISTRO ALIADO
async function registerAliado(req, res) {
    const { userNameAliado, surnameAliado, userIDAliado, emailAliado, passwordAliado } = req.body;

    if (!userNameAliado || !surnameAliado || !userIDAliado || !emailAliado || !passwordAliado) {
        return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
    }

    const usuarioRevisar = aliados.find(usuario => usuario.user === userNameAliado);
    if (usuarioRevisar) {
        return res.status(400).send({ status: "Error", message: "Este usuario ya existe" });
    }

    const salt = await bcryptjs.genSalt(5);
    const hashPassword = await bcryptjs.hash(passwordAliado, salt);
    const nuevoAliado = {
        user: userNameAliado,
        surnameAliado: surnameAliado,
        userIDAliado: userIDAliado,
        email: emailAliado, 
        password: hashPassword
    };

    aliados.push(nuevoAliado);
    console.log(aliados);
    return res.status(201).send({ status: "Success", message: `Nuevo aliado ${nuevoAliado.user} registrado exitosamente`, redirect: "/form" });
}

// REGISTRO CLIENTE
async function registerCliente(req, res) {
    const { userNameCliente, surnameCliente, emailCliente, passwordCliente, telCliente, serviciosCliente } = req.body;

    if (!userNameCliente || !surnameCliente || !emailCliente || !passwordCliente || !telCliente || !serviciosCliente) {
        return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
    }
    const usuarioRevisar = clientes.find(usuario => usuario.user === userNameCliente);
    if (usuarioRevisar) {
        return res.status(400).send({ status: "Error", message: "Este usuario ya existe" });
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
    clientes.push(nuevoCliente);
    console.log(clientes);
    return res.status(201).send({ status: "Success", message: `Nuevo cliente ${nuevoCliente.user} registrado exitosamente`, redirect: "/form" });
}

export const methods = {
    login,
    registerAliado,
    registerCliente
};
