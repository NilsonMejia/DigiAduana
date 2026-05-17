const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

exports.dashboard = asyncHandler(async (req, res) => {
  const [[expedientes]] = await pool.query(
    `SELECT
      COUNT(*) AS total,
      SUM(estado = 'BORRADOR') AS borrador,
      SUM(estado = 'EN_REVISION') AS en_revision,
      SUM(estado = 'OBSERVADO') AS observado,
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
  const [[cargas]] = await pool.query(
    `SELECT
      COALESCE(SUM(peso_kg), 0) AS peso_total_kg,
      COALESCE(SUM(valor_cif), 0) AS valor_cif_total,
      COALESCE(SUM(bultos), 0) AS bultos_total
     FROM cargas`
  );
  const [porTipoOperacionRows] = await pool.query(
    `SELECT tipo_operacion, COUNT(*) AS total
     FROM expedientes_aduanales
     GROUP BY tipo_operacion
     ORDER BY tipo_operacion`
  );

  const totalExpedientes = Number(expedientes.total || 0);
  const finalizados = Number(expedientes.finalizados || 0);
  const por_tipo_operacion = porTipoOperacionRows.reduce((acc, row) => {
    acc[row.tipo_operacion] = Number(row.total || 0);
    return acc;
  }, {});

  res.json({
    expedientes,
    documentos,
    dte,
    cargas,
    kpis: {
      total_expedientes: totalExpedientes,
      abiertos: totalExpedientes - finalizados,
      observados: Number(expedientes.observado || 0),
      entregados: finalizados,
      tasa_entrega: totalExpedientes ? Number(((finalizados / totalExpedientes) * 100).toFixed(1)) : 0,
      peso_total_kg: Number(cargas.peso_total_kg || 0),
      valor_fob_total: Number(cargas.valor_cif_total || 0),
      documentos_pendientes: Number(documentos.pendientes || 0)
    },
    por_estado: {
      BORRADOR: Number(expedientes.borrador || 0),
      EN_REVISION: Number(expedientes.en_revision || 0),
      OBSERVADO: Number(expedientes.observado || 0),
      APROBADO: Number(expedientes.aprobados || 0),
      FINALIZADO: finalizados
    },
    por_tipo_operacion
  });
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
