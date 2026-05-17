const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const jwtConfig = require('../config/jwt');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');

function signToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      cliente_id: usuario.cliente_id
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
}

exports.login = asyncHandler(async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ mensaje: 'Correo y password son requeridos' });
  }

  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, u.password_hash, u.estado, u.cliente_id, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.correo = ?`,
    [correo]
  );

  const usuario = rows[0];
  if (!usuario || usuario.estado !== 'ACTIVO') {
    return res.status(401).json({ mensaje: 'Credenciales invalidas' });
  }

  const ok = await bcrypt.compare(password, usuario.password_hash);
  if (!ok) {
    return res.status(401).json({ mensaje: 'Credenciales invalidas' });
  }

  await audit(usuario.id, 'LOGIN', 'usuarios', usuario.id, 'Inicio de sesion exitoso', req);
  const token = signToken(usuario);
  return res.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      cliente_id: usuario.cliente_id
    }
  });
});

exports.registro = asyncHandler(async (req, res) => {
  const { nombre, correo, password, cliente_id = null } = req.body;
  if (!nombre || !correo || !password) {
    return res.status(400).json({ mensaje: 'Nombre, correo y password son requeridos' });
  }

  const [[rolDb]] = await pool.query('SELECT id, nombre FROM roles WHERE nombre = ?', ['CLIENTE']);
  if (!rolDb) return res.status(400).json({ mensaje: 'Rol no valido' });

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol_id, cliente_id)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, correo, passwordHash, rolDb.id, cliente_id]
  );

  await audit(result.insertId, 'REGISTRO', 'usuarios', result.insertId, 'Usuario registrado', req);
  return res.status(201).json({ id: result.insertId, nombre, correo, rol: rolDb.nombre });
});

exports.perfil = asyncHandler(async (req, res) => {
  const [[usuario]] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, u.estado, u.cliente_id, r.nombre AS rol
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     WHERE u.id = ?`,
    [req.user.id]
  );

  if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  return res.json(usuario);
});
