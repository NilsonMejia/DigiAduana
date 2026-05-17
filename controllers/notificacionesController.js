const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

exports.listar = asyncHandler(async (req, res) => {
  const [expedientes] = await pool.query(
    `SELECT e.id, e.codigo, e.estado, e.actualizado_en, c.nombre AS cliente
     FROM expedientes_aduanales e
     JOIN clientes c ON c.id = e.cliente_id
     WHERE e.estado IN ('OBSERVADO', 'RECHAZADO', 'EN_REVISION')
     ORDER BY e.actualizado_en DESC
     LIMIT 8`
  );

  const [documentos] = await pool.query(
    `SELECT d.id, d.tipo_documento, d.estado_validacion, d.creado_en, e.codigo
     FROM documentos d
     JOIN expedientes_aduanales e ON e.id = d.expediente_id
     WHERE d.estado_validacion IN ('PENDIENTE', 'RECHAZADO')
     ORDER BY d.creado_en DESC
     LIMIT 8`
  );

  const data = [
    ...expedientes.map((item) => ({
      id: `exp-${item.id}`,
      tipo: item.estado === 'RECHAZADO' ? 'danger' : 'warning',
      titulo: `Expediente ${item.codigo} ${item.estado.toLowerCase()}`,
      mensaje: `${item.cliente} requiere seguimiento operativo.`,
      fecha: item.actualizado_en
    })),
    ...documentos.map((item) => ({
      id: `doc-${item.id}`,
      tipo: item.estado_validacion === 'RECHAZADO' ? 'danger' : 'info',
      titulo: `Documento ${item.estado_validacion.toLowerCase()}`,
      mensaje: `${item.tipo_documento} en expediente ${item.codigo}.`,
      fecha: item.creado_en
    }))
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  res.json({ data, total: data.length });
});
