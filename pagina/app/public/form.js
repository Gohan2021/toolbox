const mensajeError = document.getElementsByClassName("error")[0];

// Function to add another skill input
function addSkill() {
    const skillsContainer = document.getElementById('skillsContainer');
    
    // Create a new div for skill and experience inputs
    const newDiv = document.createElement('div');
    newDiv.className = 'my-3';
    // Create title
    const newTitle = document.createElement('h5');
    newTitle.textContent = 'Otra habilidad';
    newDiv.appendChild(newTitle);
    // Create skill input
    const newSkillInput = document.createElement('input');
    newSkillInput.type = 'text';
    newSkillInput.className = 'form-control mb-2';
    newSkillInput.placeholder = 'Ingresa tu otra habilidad';
    newSkillInput.required = true; // Make it required if needed

    // Create experience input
    const newExpInput = document.createElement('input');
    newExpInput.type = 'text';
    newExpInput.className = 'form-control mb-2';
    newExpInput.placeholder = 'Ingresa la experiencia en meses o años';
    newExpInput.required = true; // Make it required if needed

    // Append inputs to the new div
    newDiv.appendChild(newSkillInput);
    newDiv.appendChild(newExpInput);

    // Append the new div to the skills container
    skillsContainer.appendChild(newDiv);
}

// Function for registering aliado
async function registerAliado(e) {
    e.preventDefault();
    console.log('Registrando aliado...'); // Debugging

    const userNameAliado = e.target.elements.userNameAliado.value;
    const surnameAliado = e.target.elements.surnameAliado.value;
    const userIDAliado = e.target.elements.userIDAliado.value;
    const emailAliado = e.target.elements.emailUserAliado.value;
    const passwordAliado = e.target.elements.passwordAliado.value;
    const dobAliado = e.target.elements.dobAliado.value;
    const telAliado = e.target.elements.telAliado.value;
    const dirAliado = e.target.elements.dirAliado.value;
    const independentSkills = e.target.elements.independentSkills.value;
    const expAliado = e.target.elements.expAliado.value;
    // Collect all skills
    // const skills = Array.from(document.querySelectorAll('#skillsContainer input[type="text"]')).map(input => input.value);
    
    console.log('Datos del aliado:', { userNameAliado, surnameAliado, userIDAliado, dobAliado ,emailAliado, passwordAliado, telAliado, dirAliado, expAliado ,independentSkills }); // Debugging

    const res = await fetch("http://localhost:4000/api/register/aliado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userNameAliado: userNameAliado,
            surnameAliado: surnameAliado,
            userIDAliado: userIDAliado,
            dobAliado : dobAliado,
            emailAliado: emailAliado,
            passwordAliado: passwordAliado,
            telAliado: telAliado, 
            dirAliado: dirAliado,
            independentSkills: independentSkills, // Include skills in the request
            expAliado : expAliado
        })
    });
    
    // Handle server response
    const data = await res.json();
    console.log('Respuesta del servidor:', data);
    
    // Show or hide error message based on response
    if (!res.ok) {
        mensajeError.classList.remove("d-none"); // Show error message
        return;
    } else {
        mensajeError.classList.add("d-none"); // Hide error message
    }
    
    // Reload the page if the response is successful and there is a redirect
    if (data.redirect) {
        window.location.href = data.redirect;
    }
}

// Function for registering cliente
async function registerCliente(e) {
    e.preventDefault();
    console.log('Registrando cliente...'); // Debugging
    const userNameCliente = e.target.elements.userNameCliente.value;
    const surnameCliente = e.target.elements.surnameCliente.value;
    const emailCliente = e.target.elements.emailUserCliente.value;
    const passwordCliente = e.target.elements.passwordCliente.value;
    const telCliente = e.target.elements.telCliente.value;
    const serviciosCliente = e.target.elements.serviciosCliente.value;
    
    console.log('Datos del cliente:', { userNameCliente, surnameCliente, emailCliente, passwordCliente, telCliente, serviciosCliente }); // Debugging

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
    
    // Handle server response
    const data = await res.json();
    console.log('Respuesta del servidor:', data);

    // Show or hide error message based on response
    if (!res.ok) {
        mensajeError.classList.remove("d-none"); // Show error message
        return;
    } else {
        mensajeError.classList.add("d-none"); // Hide error message
    }
    
    // Reload the page if the response is successful and there is a redirect
    if (data.redirect) {
        window.location.href = data.redirect;
    }
}

// Assign events to forms
document.getElementById("register-form-aliado").addEventListener("submit", registerAliado);
document.getElementById("register-form-cliente").addEventListener("submit", registerCliente);

// Function that shows the form depending on the user's choice
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
