const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

exports.dashboard = asyncHandler(async (req, res) => {
  const [[expedientes]] = await pool.query(
    `SELECT
      COUNT(*) AS total,
      SUM(estado = 'BORRADOR') AS borrador,
      SUM(estado = 'EN_REVISION') AS en_revision,
      SUM(estado = 'APROBADO') AS aprobados,
      SUM(estado = 'FINALIZADO') AS finalizados
     FROM expedientes_aduanales`
  );
  const [[documentos]] = await pool.query(
    `SELECT
      COUNT(*) AS total,
      SUM(estado_validacion = 'PENDIENTE') AS pendientes,
      SUM(estado_validacion = 'VALIDADO') AS validados,
      SUM(estado_validacion = 'RECHAZADO') AS rechazados
     FROM documentos`
  );
  const [[dte]] = await pool.query(
    `SELECT COUNT(*) AS total, SUM(estado = 'VALIDADO') AS validados, SUM(total) AS monto_total FROM dte`
  );

  res.json({ expedientes, documentos, dte });
});

exports.operacionesPorCliente = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.nombre AS cliente, COUNT(e.id) AS expedientes, MAX(e.actualizado_en) AS ultima_actualizacion
     FROM clientes c
     LEFT JOIN expedientes_aduanales e ON e.cliente_id = c.id
     GROUP BY c.id, c.nombre
     ORDER BY expedientes DESC`
  );
  res.json(rows);
});
