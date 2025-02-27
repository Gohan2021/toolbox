// auth.test.js
import request from "supertest";
import app from "../../index.js"; 
import getConnection, { closePool } from "../../database.js"; 
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

beforeAll(async () => {
    try {
        const connection = await getConnection();
        console.log("Conexión a la base de datos para pruebas establecida.");
        connection.release(); 
    } catch (error) {
        console.error("Error conectando a la base de datos:", error.message);
    }
});

afterAll(async () => {
    try {
        await closePool(); 
    } catch (error) {
        console.error("Error cerrando la conexión a la base de datos:", error.message);
    }
});

describe("Pruebas para rutas protegidas", () => {
    test("Debería devolver 401 si no se envía el token", async () => {
        const res = await request(app).get("/api/aliado/perfil");
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Acceso no autorizado, inicie sesión.");
    });

    test("Debería devolver 403 si el token es inválido", async () => {
        const res = await request(app)
            .get("/api/aliado/perfil")
            .set("Cookie", "jwt=tokenInvalido");
        
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Token inválido o expirado.");
    });

    test("Debería devolver 200 si el token es válido", async () => {
        // 🔑 Generar un token JWT válido para un usuario de prueba
        const payload = { userId: 1, email: "prueba@correo.com" };
        const token = jsonwebtoken.sign(payload, process.env.JWT_LOGIN, { expiresIn: "1h" });

        const res = await request(app)
            .get("/api/aliado/perfil")
            .set("Cookie", `jwt=${token}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.aliado).toBeDefined();
    });
});
