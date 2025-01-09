const mensajeError = document.getElementsByClassName("error")[0];

// Función para el registro del aliado
async function registerAliado(e) {
    e.preventDefault();
    console.log('Registrando aliado...'); // Depuración

    const userNameAliado = e.target.elements.userNameAliado.value;
    const surnameAliado = e.target.elements.surnameAliado.value;
    const userIDAliado = e.target.elements.userIDAliado.value;
    const emailAliado = e.target.elements.emailUserAliado.value;
    const passwordAliado = e.target.elements.passwordAliado.value;
    console.log('Datos del aliado:', { userNameAliado, secondNameAliado, userIDAliado, emailAliado, passwordAliado }); // Depuración

    const res = await fetch("http://localhost:4000/api/register/aliado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userNameAliado: userNameAliado,
            surnameAliado: surnameAliado,
            userIDAliado: userIDAliado,
            emailAliado: emailAliado,
            passwordAliado: passwordAliado
        })
    });
    // Manejar la respuesta del servidor
    const data = await res.json();
    console.log('Respuesta del servidor:', data);
    // Mostrar u ocultar el mensaje de error según la respuesta
    if (!res.ok) {
        mensajeError.classList.remove("d-none"); // Mostrar el mensaje de error
        return;
    } else {
        mensajeError.classList.add("d-none"); // Ocultar el mensaje de error
    }
    // Recarga la página si la respuesta es exitosa y hay una redirección
    if (data.redirect) {
        window.location.href = data.redirect;
    }
}

// Función para el registro del cliente
async function registerCliente(e) {
    e.preventDefault();
    console.log('Registrando cliente...'); // Depuración
    const userNameCliente = e.target.elements.userNameCliente.value;
    const surnameCliente = e.target.elements.surnameCliente.value;
    const emailCliente = e.target.elements.emailUserCliente.value;
    const passwordCliente = e.target.elements.passwordCliente.value;
    const telCliente = e.target.elements.telCliente.value;
    const serviciosCliente = e.target.elements.serviciosCliente.value;
    console.log('Datos del cliente:', { userNameCliente, surnameCliente, emailCliente, passwordCliente, telCliente, serviciosCliente }); // Depuración

    const res = await fetch("http://localhost:4000/api/register/cliente", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userNameCliente: userNameCliente,
            surnameCliente:surnameCliente,
            emailCliente: emailCliente,
            passwordCliente: passwordCliente,
            telCliente:telCliente,
            serviciosCliente:serviciosCliente
        })
    });
    // Manejar la respuesta del servidor
    const data = await res.json();
    console.log('Respuesta del servidor:', data);

    // Mostrar u ocultar el mensaje de error según la respuesta
    if (!res.ok) {
        mensajeError.classList.remove("d-none"); // Mostrar el mensaje de error
        return;
    } else {
        mensajeError.classList.add("d-none"); // Ocultar el mensaje de error
    }
    // Recarga la página si la respuesta es exitosa y hay una redirección
    if (data.redirect) {
        window.location.href = data.redirect;
    }
}
// Asignar eventos a los formularios
document.getElementById("register-form-aliado").addEventListener("submit", registerAliado);
document.getElementById("register-form-cliente").addEventListener("submit", registerCliente);

// Funcion que muestra el formulario dependiendo de lo que eliga el usuario
function showFields() {
    const userType = document.getElementById('userType').value;
    const independentFields = document.getElementById('independentFields');
    const clientFields = document.getElementById('client');

    if (userType === 'independent') {
        independentFields.classList.remove('hidden');
        clientFields.classList.add('hidden');
        document.getElementById('independentSkills').setAttribute('required', true);
    } else if (userType === 'client') {
        clientFields.classList.remove('hidden');
        independentFields.classList.add('hidden');
        document.getElementById('independentSkills').removeAttribute('required');
    }
}