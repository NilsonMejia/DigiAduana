const pool = require('../config/db');

async function audit(usuarioId, accion, entidad, entidadId, detalle, req) {
  try {
    await pool.query(
      `INSERT INTO bitacora_sistema
       (usuario_id, accion, entidad, entidad_id, detalle, ip_origen, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId || null,
        accion,
        entidad,
        entidadId || null,
        detalle || null,
        req?.ip || null,
        req?.headers?.['user-agent'] || null
      ]
    );
  } catch (error) {
    console.error('No se pudo registrar bitacora:', error.message);
  }
}

module.exports = audit;
