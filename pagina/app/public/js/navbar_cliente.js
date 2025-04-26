document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 navbar_cliente.js cargado");

    fetch("/components/navbar_cliente.html")
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML("afterbegin", data);

            const loginContainer = document.getElementById("loginContainer");
            const logoutContainer = document.getElementById("logoutContainer");

            // ✅ Verificar si el cliente está autenticado
            fetch("http://localhost:4000/api/cliente/perfil", {
                method: "GET",
                credentials: "include"
            })
            .then(response => {
                if (response.status === 200) {
                    console.log("✅ Cliente autenticado");
                    loginContainer.classList.add("d-none");
                    logoutContainer.classList.remove("d-none");
                } else {
                    console.log("❌ Cliente no autenticado");
                    loginContainer.classList.remove("d-none");
                    logoutContainer.classList.add("d-none");
                }
            })
            .catch(error => console.error("Error al verificar la sesión del cliente:", error));

            // 💡 Lógica del formulario de inicio de sesión Cliente
            const loginForm = document.getElementById("login-form-cliente");
            if (loginForm) {
                loginForm.addEventListener("submit", async (event) => {
                    event.preventDefault();

                    const email = document.getElementById("userEmailCliente").value;
                    const password = document.getElementById("userPasswordCliente").value;
                    const rememberMe = document.getElementById("rememberMe")?.checked;

                    try {
                        const response = await fetch("http://localhost:4000/api/login/cliente", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ email, password })
                        });

                        if (response.ok) {
                            console.log("✅ Cliente inició sesión correctamente");

                            if (rememberMe) {
                                localStorage.setItem("savedEmailCliente", email);
                            } else {
                                localStorage.removeItem("savedEmailCliente");
                            }

                            window.location.href = "/perfilCliente";
                        } else {
                            document.getElementById("mensajeErrorLoginCliente").classList.remove("hidden");
                        }
                    } catch (error) {
                        console.error("Error durante el inicio de sesión del cliente:", error);
                    }
                });
            }

            // 🔐 Cerrar sesión Cliente
            const logoutButton = document.getElementById("logoutButton");
            if (logoutButton) {
                logoutButton.addEventListener("click", async () => {
                    try {
                        const response = await fetch("http://localhost:4000/api/cliente/logout/cliente", {
                            method: "POST",
                            credentials: "include"
                        });

                        if (response.ok) {
                            console.log("✅ Cliente cerró sesión correctamente");
                            sessionStorage.clear();
                            localStorage.clear();
                            window.location.href = "/cliente";
                        } else {
                            alert("Error al cerrar sesión.");
                        }
                    } catch (error) {
                        console.error("Error al cerrar sesión del cliente:", error);
                        alert("No se pudo cerrar la sesión correctamente.");
                    }
                });
            }
        })
        .catch(error => console.error("Error al cargar el navbar del cliente:", error));
});
