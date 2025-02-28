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

    // Dropdown para seleccionar la habilidad
    const skillLabel = document.createElement("label");
    skillLabel.textContent = "Servicio que ofreces";
    skillLabel.classList.add("form-label");

    const skillsDropdown = document.createElement("div");
    skillsDropdown.classList.add("dropdown", "mb-2");

    const dropdownToggle = document.createElement("button");
    dropdownToggle.type = "button";
    dropdownToggle.classList.add("btn", "btn-secondary", "dropdown-toggle", "form-control", "text-start");
    dropdownToggle.setAttribute("data-bs-toggle", "dropdown");
    dropdownToggle.setAttribute("aria-expanded", "false");
    dropdownToggle.textContent = "Selecciona un servicio";

    const dropdownMenu = document.createElement("ul");
    dropdownMenu.classList.add("dropdown-menu");

    const skillOptions = [
        "plomeria",
        "Electricidad",
        "carpinteria",
        "enchape",
        "metalicas",
        "pintura",
        "cerrajeria",
        "refrigeracion",
        "jardineria",
        "obras"
    ];

    // Crear opciones del dropdown
    skillOptions.forEach(option => {
        const listItem = document.createElement("li");
        const linkItem = document.createElement("a");
        linkItem.classList.add("dropdown-item");
        linkItem.href = "#";
        linkItem.textContent = option;
        linkItem.setAttribute("data-value", option);

        // Evitar el comportamiento predeterminado y actualizar el botón
        linkItem.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            dropdownToggle.textContent = option; // Mostrar el valor seleccionado en el botón
            skillInput.value = option; // Asignar el valor al input oculto
        });

        listItem.appendChild(linkItem);
        dropdownMenu.appendChild(listItem);
    });

    // Input oculto para almacenar el valor seleccionado
    const skillInput = document.createElement("input");
    skillInput.type = "hidden";
    skillInput.classList.add("skill-input");
    skillInput.required = true;

    skillsDropdown.appendChild(dropdownToggle);
    skillsDropdown.appendChild(dropdownMenu);

    // Input para experiencia
    const expLabel = document.createElement("label");
    expLabel.textContent = "Experiencia";
    expLabel.classList.add("form-label", "my-2");

    const expInput = document.createElement("input");
    expInput.type = "text";
    expInput.classList.add("form-control", "exp-input");
    expInput.placeholder = "Experiencia en meses o años en el oficio";
    expInput.required = true;

    // Input para agergar certificados
    const certLabel = document.createElement("label");
    certLabel.textContent = "Agregar certificaciones (opcional)";
    certLabel.classList.add("form-label", "my-2");
    certLabel.setAttribute("for", "imageFileCert"); // Asociar label con input

    // Crear un ID único para cada input de certificación
    const certInputId = `imageFileCert_${document.querySelectorAll('.cert-input').length}`;
    
    // Crear el input para cargar la certificación
    const certInput = document.createElement("input");
    certInput.type = "file";
    certInput.classList.add("form-control", "cert-input");
    certInput.name = "imageFilecertName";
    certInput.id = certInputId;
    certInput.accept = "image/*"; 
    certInput.required = false; 

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
    skillDiv.appendChild(skillsDropdown);
    skillDiv.appendChild(skillInput);
    skillDiv.appendChild(expLabel);
    skillDiv.appendChild(expInput);
    skillDiv.appendChild(certLabel);
    skillDiv.appendChild(certInput);
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
    // const certFiles = document.getElementById("imageFilecert").files; // Certificaciones (Múltiples)

    let imagePathFront = "";
    let imagePathBack = "";
    let certificationsPaths = []; // Para almacenar las rutas de las certificaciones

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
            // mostrarError(`Error al subir la imagen ${fieldName}. Inténtalo de nuevo.`);
            return "";
        }
    }

    // **Subir imágenes si están disponibles**
    imagePathFront = await uploadImage(imageFileFront, "idphotofront");
    imagePathBack = await uploadImage(imageFileBack, "idphotoback");

    // **Subir todas las certificaciones, incluyendo las dinámicas**
    document.querySelectorAll(".cert-input").forEach(async (input) => {
        if (input.files.length > 0) {
            for (let certFile of input.files) {
                let certPath = await uploadImage(certFile, "imageFilecertName");
                if (certPath) {
                    certificationsPaths.push(certPath);
                }
            }
        }
    });

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
                idPhotoBack: imagePathBack,
                certifications: certificationsPaths // 🔹 Se envía el array con todas las certificaciones subidas
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
// Login Aliado
async function loginAliado(e) {
    e.preventDefault();
    console.log('Iniciando sesión...');

    const userEmailAliado = e.target.elements.userEmailAliado.value.trim();
    const userPasswordAliado = e.target.elements.userPasswordAliado.value.trim();

    if (!userEmailAliado || !userPasswordAliado) {
        alert("Por favor, complete todos los campos.");
        return;
    }

    try {
        const res = await fetch("http://localhost:4000/api/login/aliado", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: userEmailAliado,
                password: userPasswordAliado
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Credenciales incorrectas.");
            return;
        }

        console.log("Inicio de sesión exitoso:", data.message);

        // Guardar el ID y la información del aliado en el almacenamiento local
        if (data.aliado) {
            localStorage.setItem("aliadoId", data.aliado.id_aliado);
            localStorage.setItem("aliadoNombre", data.aliado.nombre);
            localStorage.setItem("aliadoApellido", data.aliado.apellido);
            localStorage.setItem("aliadoTelefono", data.aliado.telefono);
            localStorage.setItem("aliadoEmail", data.aliado.email);
            // localStorage.setItem("fotoPerfil", data.aliado.foto || "/imagenes/acceso.png");

            window.location.href = data.redirect;
        } else {
            alert("No se pudo obtener la información del usuario.");
        }
        if (res.ok && data.user && data.user.id) {
            console.log("ID del aliado guardado:", data.user.id_aliado);
            localStorage.setItem("aliadoId", data.user.id_aliado);
        } else {
            console.warn("No se pudo guardar el ID del aliado en localStorage.");
        }
        // Autenticación
        if (data.status === "Success" && data.aliadoId) {
            sessionStorage.setItem("aliadoId", data.aliadoId);
            window.location.href = data.redirect;
        } else {
            alert("Error al iniciar sesión.");
}


    } catch (error) {
        console.error("Error en la solicitud de inicio de sesión:", error);
        alert("No se pudo conectar con el servidor.");
    }
}
// 🚦 Registro de Cliente
async function registerCliente(e) {
    e.preventDefault();
    console.log('Registrando cliente...');

    const form = e.target;
    const userNameCliente = form.elements.userNameCliente?.value.trim();
    const surnameCliente = form.elements.surnameCliente?.value.trim();
    const emailCliente = form.elements.emailUserCliente?.value.trim();
    const passwordCliente = form.elements.passwordCliente?.value.trim();
    const telCliente = form.elements.telCliente?.value.trim();
    const serviciosCliente = form.elements.serviciosCliente?.value.trim();

    if (!userNameCliente || !surnameCliente || !emailCliente || !passwordCliente || !telCliente) {
        alert("Por favor, complete todos los campos del formulario.");
        return;
    }

    try {
        const res = await fetch("http://localhost:4000/api/register/cliente", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userNameCliente,
                surnameCliente,
                emailCliente,
                passwordCliente,
                telCliente,
                serviciosCliente
            })
        });

        const data = await res.json();
        console.log('Respuesta del servidor:', data);

        if (!res.ok) {
            alert(data.message || 'Error al realizar el registro');
            return;
        }

        alert("Registro exitoso. Redirigiendo...");
        window.location.href = data.redirect || "/";

    } catch (error) {
        console.error("Error en el registro de cliente:", error);
        alert("Error al conectar con el servidor.");
    }
}
// 🚪 Inicio de Sesión Aliado
async function loginAliado(e) {
    e.preventDefault();
    console.log('Iniciando sesión...');

    const form = e.target;
    const email = form.elements.userEmailAliado?.value.trim();
    const password = form.elements.userPasswordAliado?.value.trim();

    if (!email || !password) {
        alert("Por favor, complete todos los campos.");
        return;
    }

    try {
        const res = await fetch("http://localhost:4000/api/login/aliado", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Credenciales incorrectas.");
            return;
        }

        console.log("Inicio de sesión exitoso:", data.message);

        // ✅ Guardar la información del aliado en sessionStorage
        if (data.aliado) {
            sessionStorage.setItem("aliadoId", data.aliado.id_aliado);
            sessionStorage.setItem("aliadoNombre", data.aliado.nombre);
            sessionStorage.setItem("aliadoApellido", data.aliado.apellido);
            sessionStorage.setItem("aliadoTelefono", data.aliado.telefono);
            sessionStorage.setItem("aliadoEmail", data.aliado.email);
        } else {
            alert("No se pudo obtener la información del usuario.");
            return;
        }

        window.location.href = data.redirect || "/hazteConocer";

    } catch (error) {
        console.error("Error en la solicitud de inicio de sesión:", error);
        alert("No se pudo conectar con el servidor.");
    }
}
// 🚪 Cerrar Sesión
async function logout() {
    try {
        const res = await fetch("http://localhost:4000/api/logout", {
            method: "POST",
            credentials: "include"
        });

        const data = await res.json();

        if (res.ok) {
            sessionStorage.clear(); // ❌ Limpiar todos los datos de la sesión
            alert("Sesión cerrada correctamente.");
            window.location.href = "/";
        } else {
            alert(data.message || "Error al cerrar la sesión.");
        }

    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar la sesión correctamente.");
    }
}

// ⏭️ Asignar eventos a los formularios (Validar si existen)
document.getElementById("register-form-aliado")?.addEventListener("submit", registerAliado);
document.getElementById("register-form-cliente")?.addEventListener("submit", registerCliente);
document.getElementById("login-form-aliado")?.addEventListener("submit", loginAliado);
document.getElementById("logoutButton")?.addEventListener("click", logout);


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
document.addEventListener("DOMContentLoaded", () => {
    // Seleccionar solo los dropdowns con la clase "skillsDropdown"
    document.querySelectorAll(".skillsDropdown").forEach(dropdown => {
        const dropdownToggle = dropdown.querySelector(".dropdown-toggle");
        const hiddenInput = dropdown.querySelector("input[type='hidden']");

        dropdown.querySelectorAll(".dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault(); // Evitar recarga de la página
                e.stopPropagation(); // Detener la propagación del evento

                const selectedValue = e.target.getAttribute("data-value");
                
                // Actualizar solo el dropdown específico
                dropdownToggle.textContent = selectedValue;
                hiddenInput.value = selectedValue;
            });
        });
    });
});


