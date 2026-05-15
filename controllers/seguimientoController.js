const axios = require('axios');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

exports.trackingPublico = asyncHandler(async (req, res) => {
  const [[expediente]] = await pool.query(
    `SELECT e.codigo, e.estado, e.tipo_operacion, e.regimen, c.nombre AS cliente
     FROM expedientes_aduanales e
     JOIN clientes c ON c.id = e.cliente_id
     WHERE e.codigo = ?`,
    [req.params.codigo]
  );
  if (!expediente) return res.status(404).json({ mensaje: 'Codigo de seguimiento no encontrado' });

  const [historial] = await pool.query(
    `SELECT estado, comentario, creado_en
     FROM historial_tracking
     WHERE expediente_id = (SELECT id FROM expedientes_aduanales WHERE codigo = ?)
     ORDER BY creado_en ASC`,
    [req.params.codigo]
  );
  res.json({ expediente, historial });
});

exports.historial = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT h.*, u.nombre AS usuario
     FROM historial_tracking h
     LEFT JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.expediente_id = ?
     ORDER BY h.creado_en ASC`,
    [req.params.expedienteId]
  );
  res.json(rows);
});

exports.consultarNaviera = asyncHandler(async (req, res) => {
  const baseUrl = process.env.NAVIERAS_API_URL || `http://localhost:${process.env.PORT || 3000}/api/mock-navieras`;
  const { data } = await axios.get(`${baseUrl}/tracking/${req.params.contenedor}`);
  res.json(data);
});
