const axios = require('axios');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');

exports.listar = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT d.*, e.codigo AS expediente_codigo, c.nombre AS cliente
     FROM dte d
     JOIN expedientes_aduanales e ON e.id = d.expediente_id
     JOIN clientes c ON c.id = d.cliente_id
     ORDER BY d.creado_en DESC`
  );
  res.json(rows);
});

exports.emitir = asyncHandler(async (req, res) => {
  const { expediente_id, cliente_id, tipo_dte, numero_control, total_gravado = 0, total_iva = 0, detalles = [] } = req.body;
  if (!expediente_id || !cliente_id || !tipo_dte || !numero_control || detalles.length === 0) {
    return res.status(400).json({ mensaje: 'Datos de DTE incompletos' });
  }

  const total = Number(total_gravado) + Number(total_iva);
  const [result] = await pool.query(
    `INSERT INTO dte
     (expediente_id, cliente_id, tipo_dte, numero_control, codigo_generacion, total_gravado, total_iva, total, estado)
     VALUES (?, ?, ?, ?, UUID(), ?, ?, ?, 'EMITIDO')`,
    [expediente_id, cliente_id, tipo_dte, numero_control, total_gravado, total_iva, total]
  );

  for (const item of detalles) {
    await pool.query(
      `INSERT INTO detalle_dte (dte_id, descripcion, cantidad, precio_unitario, iva, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        result.insertId,
        item.descripcion,
        item.cantidad,
        item.precio_unitario,
        item.iva || 0,
        Number(item.cantidad) * Number(item.precio_unitario) + Number(item.iva || 0)
      ]
    );
  }

  await audit(req.user.id, 'EMITIR_DTE', 'dte', result.insertId, numero_control, req);
  res.status(201).json({ id: result.insertId, estado: 'EMITIDO' });
});

exports.validarHacienda = asyncHandler(async (req, res) => {
  const [[dte]] = await pool.query('SELECT * FROM dte WHERE id = ?', [req.params.id]);
  if (!dte) return res.status(404).json({ mensaje: 'DTE no encontrado' });

  const baseUrl = process.env.HACIENDA_API_URL || `http://localhost:${process.env.PORT || 3000}/api/mock-hacienda`;
  const { data } = await axios.post(`${baseUrl}/registro-dte`, dte);

  await pool.query(
    `UPDATE dte SET estado = 'VALIDADO', sello_recepcion = ?, respuesta_hacienda = ?, validado_en = CURRENT_TIMESTAMP WHERE id = ?`,
    [data.sello_recepcion, JSON.stringify(data), req.params.id]
  );
  await audit(req.user.id, 'VALIDAR_DTE', 'dte', req.params.id, data.sello_recepcion, req);
  res.json(data);
});

exports.invalidar = asyncHandler(async (req, res) => {
  const { motivo } = req.body;
  const [result] = await pool.query(
    `UPDATE dte SET estado = 'INVALIDADO', observaciones = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
    [motivo || 'Invalidado por usuario autorizado', req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'DTE no encontrado' });
  await audit(req.user.id, 'INVALIDAR_DTE', 'dte', req.params.id, motivo, req);
  res.json({ mensaje: 'DTE invalidado' });
});
