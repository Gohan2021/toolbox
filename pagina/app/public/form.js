const mensajeError = document.getElementById('error');
const mensajeErrorLogin = document.getElementById('mensajeErrorLogin');

// Function to add another skill input
function addSkill() {
    const skillsContainer = document.getElementById("skillsContainer");

    const skillDiv = document.createElement("div");
    skillDiv.classList.add("mb-3", "skill-entry");

    // Título
    const skillTitle = document.createElement("h5");
    skillTitle.textContent = "Otra habilidad";
    skillTitle.classList.add("semi-bold", "mt-3");

    // Input para habilidad
    const skillLabel = document.createElement("label");
    skillLabel.textContent = "Servicio que ofreces";
    skillLabel.classList.add("form-label");

    const skillInput = document.createElement("input");
    skillInput.type = "text";
    skillInput.classList.add("form-control", "mb-2", "skill-input");
    skillInput.placeholder = "Ingresar habilidad o servicio que ofreces";
    skillInput.required = true;

    // Input para experiencia
    const expLabel = document.createElement("label");
    expLabel.textContent = "Experiencia";
    expLabel.classList.add("form-label", "my-2");

    const expInput = document.createElement("input");
    expInput.type = "text";
    expInput.classList.add("form-control", "exp-input");
    expInput.placeholder = "Experiencia en meses o años en el oficio";
    expInput.required = true;

    // Botón para eliminar
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("btn", "btn-danger", "mt-2");
    removeButton.textContent = "Eliminar";
    removeButton.onclick = function() {
        skillDiv.remove();
    };

    // Agregar elementos
    skillDiv.appendChild(skillTitle);
    skillDiv.appendChild(skillLabel);
    skillDiv.appendChild(skillInput);
    skillDiv.appendChild(expLabel);
    skillDiv.appendChild(expInput);
    skillDiv.appendChild(removeButton);

    skillsContainer.appendChild(skillDiv);
}

// Function for registering aliado
async function registerAliado(e) {
    e.preventDefault();
    console.log('Registrando aliado...');

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
    
    // **Array para almacenar todas las habilidades**
    let skills = [];

    // **1️⃣ Capturar la primera habilidad que ya está en el HTML**
    const firstSkillInput = document.getElementById("skillsAliado");
    const firstExpInput = document.getElementById("expAliado");

    if (firstSkillInput && firstExpInput && firstSkillInput.value && firstExpInput.value) {
        skills.push({
            skill: firstSkillInput.value,
            experience: firstExpInput.value
        });
    }

    // **2️⃣ Capturar todas las habilidades dinámicas agregadas con la función `addSkill()`**
    document.querySelectorAll(".skill-entry").forEach(entry => {
        const skill = entry.querySelector(".skill-input").value;
        const experience = entry.querySelector(".exp-input").value;
        if (skill && experience) {
            skills.push({ skill, experience });
        }
    });

    // **3️⃣ Validar que haya al menos una habilidad ingresada**
    if (skills.length === 0) {
        mostrarError("Debe agregar al menos una habilidad.");
        return;
    }

    // **Obtener las imágenes de los inputs**
    const imageFileFront = document.getElementById("imageInputFront").files[0];
    const imageFileBack = document.getElementById("imageInputBack").files[0];

    let imagePathFront = "";
    let imagePathBack = "";

    // **Función para subir imágenes**
    async function uploadImage(imageFile, fieldName) {
        if (!imageFile) return "";

        const formData = new FormData();
        formData.append(fieldName, imageFile);

        try {
            const response = await fetch("http://localhost:4000/api/register/aliado/loadImages", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error al subir la imagen: ${response.statusText}`);
            }

            const imageData = await response.json();
            console.log(`Imagen ${fieldName} subida con éxito:`, imageData);
            return imageData.imagePath;

        } catch (error) {
            console.error(`Error al subir la imagen ${fieldName}:`, error);
            mostrarError(`Error al subir la imagen ${fieldName}. Inténtalo de nuevo.`);
            return "";
        }
    }

    // **Subir imágenes si están disponibles**
    imagePathFront = await uploadImage(imageFileFront, "idphotofront");
    imagePathBack = await uploadImage(imageFileBack, "idphotoback");

    // **4️⃣ Enviar los datos al backend**
    try {
        const res = await fetch("http://localhost:4000/api/register/aliado", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userNameAliado,
                surnameAliado,
                userIDAliado,
                dobAliado,
                emailAliado,
                passwordAliado,
                telAliado, 
                dirAliado,
                skills,  // 🔹 Se envía el array con TODAS las habilidades
                idPhotoFront: imagePathFront,
                idPhotoBack: imagePathBack
            })
        });

        const data = await res.json();
        console.log('Respuesta del servidor:', data);
        
        // **Mostrar error si la respuesta del servidor no es exitosa**
        if (!res.ok) {
            mensajeError.textContent = data.message || 'Error al realizar el registro';
            mensajeError.classList.remove("hidden");
            return;
        } else {
            mensajeError.classList.add("hidden");
        }

        // **Redirigir si la respuesta contiene una URL de redirección**
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
        // document.getElementById('independentSkills').setAttribute('required', true);
    } else if (userType === 'client') {
        clientFields.classList.remove('hidden');
        independentFields.classList.add('hidden');
        // document.getElementById('independentSkills').removeAttribute('required');
    }
}
