// app/public/routes/cart.js
import express from "express";
import database from "../../database.js";
import { verifyToken } from "../../controllers/authentication.controller.js";

const router = express.Router();

// GET /api/planes (listar suscripciones disponibles)
router.get("/planes", async (_req, res) => {
  try {
    const conn = await database();
    const [planes] = await conn.query(`
      SELECT id_suscripcion, nombre, descripcion, precio_mensual
      FROM suscripcion
      ORDER BY id_suscripcion
    `);
    res.json(planes);
  } catch (e) {
    console.error("❌ Error listando planes:", e);
    res.status(500).json({ message: "Error al listar planes" });
  }
});

// POST /api/cart/add { id_suscripcion }
router.post("/cart/add", verifyToken, async (req, res) => {
  const id_aliado = req.user?.userId;
  const { id_suscripcion } = req.body;
  if (!id_aliado || !id_suscripcion) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    const conn = await database();

    // Verifica que el plan exista y toma su precio desde BD (NUNCA desde el front)
    const [planRows] = await conn.query(
      "SELECT id_suscripcion, precio FROM suscripcion WHERE id_suscripcion = ?",
      [id_suscripcion]
    );
    if (planRows.length === 0) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }

    // Asegura carrito del aliado
    const [carts] = await conn.query(
      "SELECT id_carrito FROM carrito WHERE id_aliado = ?",
      [id_aliado]
    );
    let id_carrito;
    if (carts.length === 0) {
      const [ins] = await conn.query(
        "INSERT INTO carrito (id_aliado) VALUES (?)",
        [id_aliado]
      );
      id_carrito = ins.insertId;
    } else {
      id_carrito = carts[0].id_carrito;
    }

    // Regla: solo 1 item. Reemplazamos el existente.
    await conn.query("DELETE FROM carrito_item WHERE id_carrito = ?", [id_carrito]);
    await conn.query(
      "INSERT INTO carrito_item (id_carrito, id_suscripcion, quantity) VALUES (?, ?, 1)",
      [id_carrito, id_suscripcion]
    );

    res.json({ message: "Plan agregado al carrito" });
  } catch (e) {
    console.error("❌ Error agregando al carrito:", e);
    res.status(500).json({ message: "Error al agregar al carrito" });
  }
});

// GET /api/cart (ver carrito)
router.get("/cart", verifyToken, async (req, res) => {
  const id_aliado = req.user?.userId;
  try {
    const conn = await database();
    const [rows] = await conn.query(`
      SELECT ci.id_item, s.id_suscripcion, s.nombre, s.descripcion, s.precio, ci.quantity
      FROM carrito_item ci
      JOIN carrito c ON ci.id_carrito = c.id_carrito
      JOIN suscripcion s ON ci.id_suscripcion = s.id_suscripcion
      WHERE c.id_aliado = ?
    `, [id_aliado]);

    if (rows.length === 0) return res.json({ items: [], subtotal: 0 });

    const subtotal = rows.reduce((acc, r) => acc + Number(r.precio) * r.quantity, 0);
    res.json({ items: rows, subtotal });
  } catch (e) {
    console.error("❌ Error obteniendo carrito:", e);
    res.status(500).json({ message: "Error al obtener carrito" });
  }
});

// DELETE /api/cart (vaciar)
router.delete("/cart", verifyToken, async (req, res) => {
  const id_aliado = req.user?.userId;
  try {
    const conn = await database();
    const [carts] = await conn.query("SELECT id_carrito FROM carrito WHERE id_aliado = ?", [id_aliado]);
    if (carts.length) {
      await conn.query("DELETE FROM carrito_item WHERE id_carrito = ?", [carts[0].id_carrito]);
    }
    res.json({ message: "Carrito vaciado" });
  } catch (e) {
    console.error("❌ Error limpiando carrito:", e);
    res.status(500).json({ message: "Error al vaciar carrito" });
  }
});

// POST /api/checkout (crea orden y prepara pago)
// En este ejemplo “marca como pagado” directo, pero aquí debes integrar tu PSP (Stripe/Wompi/MercadoPago/PayU).
router.post("/checkout", verifyToken, async (req, res) => {
  const id_aliado = req.user?.userId;

  try {
    const conn = await database();
    // Lee carrito
    const [rows] = await conn.query(`
      SELECT s.id_suscripcion, s.precio, s.nombre
      FROM carrito_item ci
      JOIN carrito c ON ci.id_carrito = c.id_carrito
      JOIN suscripcion s ON ci.id_suscripcion = s.id_suscripcion
      WHERE c.id_aliado = ?
    `, [id_aliado]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    // Como es un solo item:
    const item = rows[0];
    const total = Number(item.precio);

    // 1) Crear orden (pendiente)
    const [ordenIns] = await conn.query(
      "INSERT INTO orden_suscripcion (id_aliado, total, estado, metodo_pago) VALUES (?, ?, 'pendiente', 'manual')",
      [id_aliado, total]
    );
    const id_orden = ordenIns.insertId;

    await conn.query(
      "INSERT INTO orden_suscripcion_item (id_orden, id_suscripcion, precio_unitario, quantity) VALUES (?, ?, ?, 1)",
      [id_orden, item.id_suscripcion, item.precio]
    );

    // 2) (AQUÍ) Crear pago con tu PSP y redirigir al usuario (o devolver URL)
    // Por ahora simulamos pago correcto:
    await conn.query("UPDATE orden_suscripcion SET estado='pagado', external_id=? WHERE id_orden=?",
      [`SIMULADO-${Date.now()}`, id_orden]
    );

    // 3) Activar plan en el aliado
    await conn.query("UPDATE aliado SET id_suscripcion = ? WHERE id_aliado = ?",
      [item.id_suscripcion, id_aliado]
    );

    // 4) Vaciar carrito
    const [carts] = await conn.query("SELECT id_carrito FROM carrito WHERE id_aliado = ?", [id_aliado]);
    if (carts.length) await conn.query("DELETE FROM carrito_item WHERE id_carrito = ?", [carts[0].id_carrito]);

    res.json({
      message: "Pago confirmado y plan activado",
      orden: { id_orden, total, plan: item.nombre }
    });
  } catch (e) {
    console.error("❌ Error en checkout:", e);
    res.status(500).json({ message: "Error en checkout" });
  }
});

export default router;
