const bcrypt = require('bcrypt');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');

exports.listar = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, u.estado, u.cliente_id, r.nombre AS rol, u.creado_en
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     ORDER BY u.creado_en DESC`
  );
  res.json(rows);
});

exports.crear = asyncHandler(async (req, res) => {
  const { nombre, correo, password, rol_id, cliente_id = null, estado = 'ACTIVO' } = req.body;
  if (!nombre || !correo || !password || !rol_id) {
    return res.status(400).json({ mensaje: 'Nombre, correo, password y rol son requeridos' });
  }
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol_id, cliente_id, estado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, correo, hash, rol_id, cliente_id, estado]
  );
  await audit(req.user.id, 'CREAR_USUARIO', 'usuarios', result.insertId, correo, req);
  res.status(201).json({ id: result.insertId });
});

exports.actualizar = asyncHandler(async (req, res) => {
  const campos = ['nombre', 'correo', 'rol_id', 'cliente_id', 'estado'];
  const sets = [];
  const values = [];

  campos.forEach((campo) => {
    if (req.body[campo] !== undefined) {
      sets.push(`${campo} = ?`);
      values.push(req.body[campo]);
    }
  });

  if (req.body.password) {
    sets.push('password_hash = ?');
    values.push(await bcrypt.hash(req.body.password, 10));
  }

  if (!sets.length) return res.status(400).json({ mensaje: 'No hay cambios para aplicar' });
  values.push(req.params.id);
  const [result] = await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, values);
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  await audit(req.user.id, 'ACTUALIZAR_USUARIO', 'usuarios', req.params.id, null, req);
  res.json({ mensaje: 'Usuario actualizado' });
});

exports.eliminar = asyncHandler(async (req, res) => {
  const [result] = await pool.query('UPDATE usuarios SET estado = "INACTIVO" WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  await audit(req.user.id, 'DESACTIVAR_USUARIO', 'usuarios', req.params.id, null, req);
  res.json({ mensaje: 'Usuario desactivado' });
});
