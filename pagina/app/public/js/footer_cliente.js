document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 footer_cliente.js cargado");

    fetch("/components/footer_cliente.html")
        .then(response => response.text())
        .then(data => {
            // Inserta el footer al final del body
            document.body.insertAdjacentHTML("beforeend", data);
        })
                .catch(error => console.error("Error al cargar el footer del cliente:", error));
        });