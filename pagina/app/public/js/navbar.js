document.addEventListener("DOMContentLoaded", () => {

    fetch("/components/navbar.html").then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML("afterbegin", data);

        const loginContainer = document.getElementById("loginContainer");
        const logoutContainer = document.getElementById("logoutContainer");

        // ✅ Comprobar si hay un email guardado en Local Storage
        const savedEmail = localStorage.getItem("savedEmail");
        if (savedEmail) {
            document.getElementById("userEmailAliado").value = savedEmail;
            document.getElementById("rememberMe").checked = true;
        }

        // ✅ Verificar si el usuario está autenticado
        fetch("http://localhost:4000/api/aliado/perfil", {
            method: "GET",
            credentials: "include"
        })
        .then(response => {
            if (response.status === 200) {
                loginContainer.classList.add("d-none");
                logoutContainer.classList.remove("d-none");
            } else {
                loginContainer.classList.remove("d-none");
                logoutContainer.classList.add("d-none");
            }
        })
        .catch(error => console.error("Error al verificar la sesión:", error));

        // 💡 Lógica del formulario de inicio de sesión
        const loginForm = document.getElementById("login-form-aliado");
        if (loginForm) {
            loginForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const email = document.getElementById("userEmailAliado").value;
                const password = document.getElementById("userPasswordAliado").value;
                const rememberMe = document.getElementById("rememberMe").checked;

                try {
                    const response = await fetch("http://localhost:4000/api/login/aliado", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "include",
                        body: JSON.stringify({ email, password })
                    });

                    if (response.ok) {
                        // 🔑 Guardar el email si se seleccionó "Recordarme"
                        if (rememberMe) {
                            localStorage.setItem("savedEmail", email);
                        } else {
                            localStorage.removeItem("savedEmail");
                        }

                        window.location.href = "/hazteConocer";
                    } else {
                        document.getElementById("mensajeErrorLogin").classList.remove("hidden");
                    }
                } catch (error) {
                    console.error("Error durante el inicio de sesión:", error);
                }
            });
        }

        // 🔐 Lógica para el botón de Cerrar Sesión
        const logoutButton = document.getElementById("logoutButton");
        if (logoutButton) {
            logoutButton.addEventListener("click", () => {
                fetch("http://localhost:4000/api/logout", {
                    method: "POST",
                    credentials: "include"
                })
                .then(response => response.json())
                .then(data => {
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error("Error al cerrar sesión:", error);
                    alert("No se pudo cerrar la sesión correctamente.");
                });
            });
        }

        // 💡 Lógica para "Olvidé mi contraseña"
        const forgotPasswordButton = document.getElementById("forgotPasswordButton");
        if (forgotPasswordButton) {
            forgotPasswordButton.addEventListener("click", async () => {
                const email = prompt("Por favor ingresa tu correo electrónico para recuperar tu contraseña:");
                if (email) {
                    try {
                        const response = await fetch("http://localhost:4000/api/request-password-reset", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ email })
                        });
                    
                        const data = await response.json();
                    
                        if (response.ok) {
                            alert(data.message);
                        } else {
                            alert(data.message || "Error al solicitar la recuperación de contraseña.");
                        }
                    } catch (error) {
                        console.error("Error al solicitar la recuperación de contraseña:", error);
                        alert("No se pudo enviar el correo de recuperación. Intenta de nuevo.");
                    }
                }
            });
        }
    })
    .catch(error => console.error("Error al cargar el navbar:", error));
});