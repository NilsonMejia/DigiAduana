const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

exports.listar = asyncHandler(async (req, res) => {
  const params = [];
  let where = "WHERE estado = 'ACTIVO'";

  if (req.user.rol === 'CLIENTE') {
    where += ' AND id = ?';
    params.push(req.user.cliente_id);
  }

  const [rows] = await pool.query(
    `SELECT id, nombre, nit, nrc, giro, correo, contacto_principal, estado
     FROM clientes
     ${where}
     ORDER BY nombre ASC`,
    params
  );

  res.json({
    data: rows,
    total: rows.length
  });
});
