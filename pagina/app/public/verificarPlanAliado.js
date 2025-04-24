import database from "../database.js";

export async function verificarPlanAliado(req, res, next) {
    if (req.user.role !== "aliado") return next();
  
    try {
      const connection = await database();
      const [result] = await connection.query(
        "SELECT tipo_suscripcion FROM aliado WHERE id_aliado = ?",
        [req.user.userId]
      );
  
      req.planAliado = result[0]?.tipo_suscripcion || null;
      next();
    } catch (err) {
      console.error("❌ Error al verificar plan:", err.message);
      return res.status(500).json({ message: "Error al validar el plan del aliado." });
    }
  }
  