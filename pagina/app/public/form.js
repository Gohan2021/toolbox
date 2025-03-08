const mensajeError = document.getElementById('error');
const mensajeErrorLogin = document.getElementById('mensajeErrorLogin');

// Function to add another skill input Aliado
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
// 🚀 Función para agregar un servicio en el formulario del cliente
function addServiceCliente() {
    const servicesContainer = document.getElementById("servicesContainer");

    const serviceDiv = document.createElement("div");
    serviceDiv.classList.add("mb-3", "service-entry");

    // 📌 Título
    const serviceTitle = document.createElement("h5");
    serviceTitle.textContent = "Servicio requerido";
    serviceTitle.classList.add("semi-bold", "mt-3");

    // 📌 Label del dropdown
    const serviceLabel = document.createElement("label");
    serviceLabel.textContent = "Seleccione un servicio";
    serviceLabel.classList.add("form-label");

    // 📌 Dropdown para seleccionar el servicio
    const serviceDropdown = document.createElement("div");
    serviceDropdown.classList.add("dropdown", "mb-2");

    const dropdownToggle = document.createElement("button");
    dropdownToggle.type = "button";
    dropdownToggle.classList.add("btn", "btn-secondary", "dropdown-toggle", "form-control", "text-start");
    dropdownToggle.setAttribute("data-bs-toggle", "dropdown");
    dropdownToggle.setAttribute("aria-expanded", "false");
    dropdownToggle.textContent = "Selecciona un servicio";

    const dropdownMenu = document.createElement("ul");
    dropdownMenu.classList.add("dropdown-menu");

    // 📌 Opciones de servicios disponibles
    const serviceOptions = [
        "Plomería",
        "Electricidad",
        "Carpintería",
        "Enchape y Acabados",
        "Estructuras Metálicas",
        "Pintura y Acabados",
        "Cerrajería",
        "Refrigeración y Aire Acondicionado",
        "Jardinería y Paisajismo",
        "Obras Civiles"
    ];

    // 📌 Crear opciones dentro del dropdown
    serviceOptions.forEach(option => {
        const listItem = document.createElement("li");
        const linkItem = document.createElement("a");
        linkItem.classList.add("dropdown-item");
        linkItem.href = "#";
        linkItem.textContent = option;
        linkItem.setAttribute("data-value", option);

        // 📌 Manejo de selección en el dropdown
        linkItem.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            dropdownToggle.textContent = option; // Mostrar el servicio seleccionado en el botón
            serviceInput.value = option; // Asignar el valor al input oculto
        });

        listItem.appendChild(linkItem);
        dropdownMenu.appendChild(listItem);
    });

    // 📌 Input oculto para almacenar el valor seleccionado
    const serviceInput = document.createElement("input");
    serviceInput.type = "hidden";
    serviceInput.classList.add("service-input");
    serviceInput.required = true;

    serviceDropdown.appendChild(dropdownToggle);
    serviceDropdown.appendChild(dropdownMenu);

    // 📌 Botón para eliminar servicio agregado
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("btn", "btn-danger", "mt-2");
    removeButton.textContent = "Eliminar";
    removeButton.onclick = function() {
        serviceDiv.remove();
    };

    // 📌 Agregar elementos al contenedor
    serviceDiv.appendChild(serviceTitle);
    serviceDiv.appendChild(serviceLabel);
    serviceDiv.appendChild(serviceDropdown);
    serviceDiv.appendChild(serviceInput);
    serviceDiv.appendChild(removeButton);

    servicesContainer.appendChild(serviceDiv);
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
    
    let skills = [];

    const firstSkillInput = document.getElementById("skillsAliado");
    const firstExpInput = document.getElementById("expAliado");

    if (firstSkillInput && firstExpInput && firstSkillInput.value && firstExpInput.value) {
        skills.push({
            skill: firstSkillInput.value,
            experience: firstExpInput.value
        });
    }

    document.querySelectorAll(".skill-entry").forEach(entry => {
        const skill = entry.querySelector(".skill-input").value;
        const experience = entry.querySelector(".exp-input").value;
        if (skill && experience) {
            skills.push({ skill, experience });
        }
    });

    if (skills.length === 0) {
        alert("Debe agregar al menos una habilidad.");
        return;
    }

    try {
        // 🔹 1️⃣ REGISTRAR AL USUARIO
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
                skills
            })
        });

        const data = await res.json();
        console.log('Respuesta del servidor:', data);
        
        if (!res.ok) {
            mensajeError.textContent = data.message || 'Error al realizar el registro';
            mensajeError.classList.remove("hidden");
            return;
        } else {
            mensajeError.classList.add("hidden");
        }

        // 🔹 2️⃣ INICIAR SESIÓN AUTOMÁTICAMENTE
        const loginRes = await fetch("http://localhost:4000/api/login/aliado", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: emailAliado,
                password: passwordAliado
            }),
            credentials: "include" // 🔹 Asegurar que la cookie `jwt` se almacena
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.error("Error al iniciar sesión automáticamente:", loginData.message);
            alert("Registro exitoso, pero hubo un problema iniciando sesión. Inicie sesión manualmente.");
            return;
        }

        console.log("✅ Inicio de sesión automático exitoso:", loginData);
        // **Guardar el ID del aliado en sessionStorage**
        if (loginData.aliadoId) {
            sessionStorage.setItem("aliadoId", loginData.aliadoId);
        }


        // 🔹 3️⃣ REDIRIGIR A `hazteConocer.html`
        window.location.href = "/hazteConocer";

    } catch (error) {
        console.error("Error al registrar el aliado:", error);
        alert("Error en la conexión con el servidor.");
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
            }),
            credentials: "include" // ✅ Permite que el navegador almacene la cookie JWT
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Credenciales incorrectas.");
            return;
        }

        console.log("Inicio de sesión exitoso:", data.message);

        // ✅ Guardar el ID del aliado en `sessionStorage` y `localStorage`
        if (data.aliado && data.aliado.id_aliado) {
            sessionStorage.setItem("aliadoId", data.aliado.id_aliado);
            localStorage.setItem("aliadoId", data.aliado.id_aliado);
            localStorage.setItem("aliadoNombre", data.aliado.nombre);
            localStorage.setItem("aliadoApellido", data.aliado.apellido);
            localStorage.setItem("aliadoTelefono", data.aliado.telefono);
            localStorage.setItem("aliadoEmail", data.aliado.email);

            // ✅ Redirigir a `hazteConocer.html`
            window.location.href = "/hazteConocer.html";
        } else {
            alert("No se pudo obtener la información del usuario.");
            return;
        }

    } catch (error) {
        console.error("Error en la solicitud de inicio de sesión:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

// 🚦 Registro de Cliente
async function registerCliente(e) {
    e.preventDefault();
    console.log("Registrando cliente...");

    const form = e.target;
    const userNameCliente = form.elements.userNameCliente?.value.trim();
    const surnameCliente = form.elements.surnameCliente?.value.trim();
    const emailCliente = form.elements.emailUserCliente?.value.trim();
    const passwordCliente = form.elements.passwordCliente?.value.trim();
    const telCliente = form.elements.telCliente?.value.trim();
    const dirCliente = form.elements.dirCliente?.value.trim();
    
    // Convertir la selección de servicios en un array
    const serviciosCliente = [...document.querySelectorAll(".servicio-input")]
        .map(input => input.value.trim())
        .filter(value => value !== "");

    if (!userNameCliente || !surnameCliente || !emailCliente || !passwordCliente || !telCliente || !dirCliente) {
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
                dirCliente,
                serviciosCliente
            })
        });

        const data = await res.json();
        console.log("Respuesta del servidor:", data);

        if (!res.ok) {
            alert(data.message || "Error al realizar el registro");
            return;
        }

        alert("Registro exitoso. Redirigiendo...");
        window.location.href = data.redirect || "/perfilCliente";

    } catch (error) {
        console.error("Error en el registro de cliente:", error);
        alert("Error al conectar con el servidor.");
    }
}

// 🚪 Inicio de Sesión Cliente
async function loginCliente(e) {
    e.preventDefault();
    console.log("📡 Enviando solicitud de login...");

    const form = e.target;
    const email = form.elements.userEmailCliente?.value.trim();
    const password = form.elements.userPasswordCliente?.value.trim();

    console.log("📨 Datos enviados:", { email, password });

    if (!email || !password) {
        alert("⚠️ Por favor, complete todos los campos.");
        return;
    }

    try {
        const res = await fetch("http://localhost:4000/api/login/cliente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log("🔍 Respuesta del servidor:", data);

        if (!res.ok) {
            alert(data.message || "❌ Credenciales incorrectas.");
            return;
        }

        console.log("✅ Inicio de sesión exitoso:", data);
        sessionStorage.setItem("clienteId", data.cliente.id_cliente);
        window.location.href = "/perfilCliente";

    } catch (error) {
        console.error("❌ Error en la solicitud de inicio de sesión:", error);
        alert("Error en la conexión con el servidor.");
    }
}


// ⏭️ **Prellenar email si "Recordarme" estaba activado**
document.addEventListener("DOMContentLoaded", () => {
    const savedEmail = localStorage.getItem("savedEmailCliente");
    if (savedEmail) {
        document.getElementById("userEmailCliente").value = savedEmail;
        document.getElementById("rememberMeCliente").checked = true;
    }
});

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
            window.location.href = "/aliado";
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
document.getElementById("login-form-cliente")?.addEventListener("submit", loginCliente);
document.getElementById("login-form-aliado")?.addEventListener("submit", loginAliado);
document.getElementById("logoutButton")?.addEventListener("click", logout);


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


