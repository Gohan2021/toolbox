const mensajeError = document.getElementById('error');
const mensajeErrorLogin = document.getElementById('mensajeErrorLogin');

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
    const mensajeError = document.getElementById('error');
    // Obtener los datos del formulario
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

    // Obtener la imagen del input
    const imageFile = document.getElementById("imageInput").files[0];

    let imagePath = ""; // Para almacenar la ruta de la imagen

    // Subir la imagen si hay un archivo seleccionado
    if (imageFile) {
        const formData = new FormData();
        formData.append("idphotofront", imageFile);

        try {
            const imageResponse = await fetch("http://localhost:4000/api/register/aliado/loadImages", {
                method: "POST",
                body: formData,
            });

            if (!imageResponse.ok) {
                throw new Error(`Error al subir la imagen: ${imageResponse.statusText}`);
            }

            const imageData = await imageResponse.json();
            console.log("Imagen subida con éxito:", imageData);
            imagePath = imageData.imagePath; // Guardar la ruta de la imagen

        } catch (error) {
            console.error("Error al subir la imagen:", error);
            mostrarError("Error al subir la imagen. Inténtalo de nuevo.");
            return; // Detener el proceso si la imagen no se subió correctamente
        }
    }

    // Ahora registrar el aliado con la imagen subida
    try {
        const res = await fetch("http://localhost:4000/api/register/aliado", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userNameAliado: userNameAliado,
                surnameAliado: surnameAliado,
                userIDAliado: userIDAliado,
                dobAliado: dobAliado,
                emailAliado: emailAliado,
                passwordAliado: passwordAliado,
                telAliado: telAliado, 
                dirAliado: dirAliado,
                independentSkills: independentSkills,
                expAliado: expAliado,
                idPhotoFront: imagePath // Agregar la ruta de la imagen al registro del aliado
            })
        });
        const data = await res.json();
        console.log('Respuesta del servidor:', data);
        
        // Show or hide error message based on response
        if (!res.ok) {
            // mensajeError.textContent = data.message || 'Error al realizar el registro'; // Display specific error message
            mensajeError.classList.remove("hidden"); // Show error message
            return;
        } else {
            mensajeError.classList.add("hidden"); // Hide error message
        }
        
        // Reload the page if the response is successful and there is a redirect
        if (data.redirect) {
            window.location.href = data.redirect;
        }

    } catch (error) {
        console.error("Error al registrar el aliado:", error);
        mostrarError("Error en la conexión con el servidor.");
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

    const res = await fetch("http://localhost:4000/api/register/cliente", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userNameCliente: userNameCliente,
            surnameCliente: surnameCliente,
            emailCliente: emailCliente,
            passwordCliente: passwordCliente,
            telCliente: telCliente,
            serviciosCliente: serviciosCliente
        })
    });
    
    // Handle server response
    const data = await res.json();
    console.log('Respuesta del servidor:', data);
    
    // Show or hide error message based on response
    if (!res.ok) {
        // mensajeError.textContent = data.message || 'Error al realizar el registro'; // Display specific error message
        mensajeError.classList.remove("hidden"); // Show error message
        return;
    } else {
        mensajeError.classList.add("hidden"); // Hide error message
    }
    
    // Reload the page if the response is successful and there is a redirect
    if (data.redirect) {
        window.location.href = data.redirect;
    }
}
// Login ALiado
async function loginAliado(e) {
    e.preventDefault();
    console.log('Iniciando sesión...'); // Debugging
    const userEmailAliado = e.target.elements.userEmailAliado.value;
    const userPasswordAliado = e.target.elements.userPasswordAliado.value;

    const res = await fetch("http://localhost:4000/api/login/aliado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: userEmailAliado, // Change to 'email'
            password: userPasswordAliado // Change to 'password'
        })
    });
    const data = await res.json(); // Retrieve the response data

    // Show or hide error message based on response
    if (!res.ok) {
        mensajeErrorLogin.classList.remove("hidden"); // Show error message
        return;
    } else {
        mensajeErrorLogin.classList.add("hidden"); // Hide error message
    }
    
    // Reload the page if the response is successful and there is a redirect
    if (data.redirect) {
        window.location.href = data.redirect;
    }    
}


// Login cliente
async function loginCliente(e) {
    
}

// Assign events to forms
document.getElementById("register-form-aliado").addEventListener("submit", registerAliado);
document.getElementById("register-form-cliente").addEventListener("submit", registerCliente);
document.getElementById("login-form-aliado").addEventListener("submit", loginAliado);
// document.getElementById("login-form-cliente").addEventListener("submit", loginCliente);

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
