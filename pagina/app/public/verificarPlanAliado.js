import database from "../database.js";

export async function verificarPlanAliado(req, res, next) {
  if (req.user.role !== "aliado") return next();

  try {
    const connection = await database();
    const [result] = await connection.query(`
      SELECT s.id_suscripcion, s.nombre, s.descripcion, s.precio, 
             s.puede_destacar_publicaciones, s.limite_publicaciones_destacadas,
             s.acceso_chat, s.cotizaciones_ilimitadas, s.visibilidad_prioritaria,
             s.acceso_alertas_materiales, s.publicidad_redes, s.prioridad_clientes,
             s.acceso_licitaciones, s.acceso_exclusivo, s.acceso_anticipado
      FROM aliado a
      LEFT JOIN suscripcion s ON a.id_suscripcion = s.id_suscripcion
      WHERE a.id_aliado = ?
    `, [req.user.userId]);

    // Guardar plan completo en req.planAliado
    req.planAliado = result[0] || null;

    next();

  } catch (err) {
    console.error("❌ Error al verificar plan:", err.message);
    return res.status(500).json({ message: "Error al validar el plan del aliado." });
  }
}
