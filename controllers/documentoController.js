const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');

exports.listar = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT d.*, e.codigo AS expediente
     FROM documentos d
     JOIN expedientes_aduanales e ON e.id = d.expediente_id
     ORDER BY d.creado_en DESC`
  );
  res.json({
    data: rows.map((row) => ({
      id: row.id,
      expediente_id: row.expediente_id,
      expediente: row.expediente,
      tipo: row.tipo_documento,
      nombre: row.nombre_original,
      estado: row.estado_validacion,
      url: row.ruta_archivo,
      fecha_carga: row.creado_en
    }))
  });
});

exports.listarPorExpediente = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM documentos WHERE expediente_id = ? ORDER BY creado_en DESC',
    [req.params.expedienteId]
  );
  res.json(rows);
});

exports.subir = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ mensaje: 'PDF requerido' });

  const { expediente_id, tipo_documento } = req.body;
  if (!expediente_id || !tipo_documento) {
    return res.status(400).json({ mensaje: 'Expediente y tipo de documento son requeridos' });
  }

  const [result] = await pool.query(
    `INSERT INTO documentos
     (expediente_id, tipo_documento, nombre_original, ruta_archivo, mime_type, tamano_bytes, subido_por)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [expediente_id, tipo_documento, req.file.originalname, req.file.path, req.file.mimetype, req.file.size, req.user.id]
  );

  await audit(req.user.id, 'SUBIR_DOCUMENTO', 'documentos', result.insertId, req.file.originalname, req);
  res.status(201).json({ id: result.insertId, mensaje: 'Documento cargado' });
});

exports.validar = asyncHandler(async (req, res) => {
  const { estado_validacion, observaciones } = req.body;
  if (!['VALIDADO', 'RECHAZADO'].includes(estado_validacion)) {
    return res.status(400).json({ mensaje: 'Estado de validacion no valido' });
  }

  const [result] = await pool.query(
    `UPDATE documentos
     SET estado_validacion = ?, observaciones = ?, validado_por = ?, validado_en = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [estado_validacion, observaciones || null, req.user.id, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Documento no encontrado' });

  await audit(req.user.id, 'VALIDAR_DOCUMENTO', 'documentos', req.params.id, estado_validacion, req);
  res.json({ mensaje: 'Documento validado', estado_validacion });
});

exports.eliminar = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM documentos WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Documento no encontrado' });
  await audit(req.user.id, 'ELIMINAR_DOCUMENTO', 'documentos', req.params.id, null, req);
  res.json({ mensaje: 'Documento eliminado' });
});
