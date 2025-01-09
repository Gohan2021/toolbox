import express from "express";
//fix para el dirname
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { methods as authentication } from "./controllers/authentication.controller.js";

//server
const app = express();
app.set("port", 4000);
app.listen(app.get("port"), () => {
    console.log("Servidor corriendo en puerto", app.get("port"));
});

//configuracion 
app.use(express.static(__dirname + "/public"));
app.use(express.json());

//rutas
app.get("/", (req, res) => res.sendFile(__dirname + "/pages/index.html"));
app.get("/form", (req, res) => res.sendFile(__dirname + "/pages/form.html"));
app.get("/cliente", (req, res) => res.sendFile(__dirname + "/pages/cliente.html"));
app.get("/hazteConocer", (req, res) => res.sendFile(__dirname + "/pages/hazteConocer.html"));
app.get("/myv", (req, res) => res.sendFile(__dirname + "/pages/myv.html"));
app.get("/politicas", (req, res) => res.sendFile(__dirname + "/pages/politicas.html"));
app.get("/uso", (req, res) => res.sendFile(__dirname + "/pages/uso.html"));

app.post("/api/login", authentication.login);
app.post("/api/register/aliado", authentication.registerAliado);
app.post("/api/register/cliente", authentication.registerCliente);