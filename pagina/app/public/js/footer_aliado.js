document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 footer_aliado.js cargado");

    fetch("/components/footer_aliado.html")
        .then(response => response.text())
        .then(data => {
            // Inserta el footer al final del body
            document.body.insertAdjacentHTML("beforeend", data);
        })
                .catch(error => console.error("Error al cargar el footer del cliente:", error));
        });