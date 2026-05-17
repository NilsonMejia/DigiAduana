const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const jwtConfig = require('../config/jwt');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');
const { sendVerificationEmail } = require('../services/emailService');

function actorFromRole(role) {
  const aliases = {
    ADMINISTRADOR: 'admin',
    SUPERVISOR: 'supervisor',
    FREIGHT_FORWARDER: 'forwarder',
    CLIENTE: 'cliente',
    SOPORTE_TECNICO: 'soporte'
  };
  return aliases[role] || String(role || '').toLowerCase();
}

function publicBaseUrl(req) {
  return process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
}

async function getPermisos(rolId) {
  const [rows] = await pool.query(
    `SELECT p.codigo
     FROM permisos p
     JOIN roles_permisos rp ON rp.permiso_id = p.id
     WHERE rp.rol_id = ?
     ORDER BY p.codigo`,
    [rolId]
  );
  return rows.map((row) => row.codigo);
}

function signToken(usuario, permisos = []) {
  const actor = actorFromRole(usuario.rol);
  return jwt.sign(
    {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      actor,
      permisos,
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
    `SELECT u.id, u.nombre, u.correo, u.password_hash, u.estado, u.email_verificado,
            u.cliente_id, r.id AS rol_id, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.correo = ?`,
    [correo]
  );

  const usuario = rows[0];
  if (!usuario || usuario.estado !== 'ACTIVO') {
    return res.status(401).json({ mensaje: 'Credenciales invalidas' });
  }

  if (!usuario.email_verificado) {
    return res.status(403).json({ mensaje: 'Debes validar tu correo antes de iniciar sesion' });
  }

  const ok = await bcrypt.compare(password, usuario.password_hash);
  if (!ok) {
    return res.status(401).json({ mensaje: 'Credenciales invalidas' });
  }

  await audit(usuario.id, 'LOGIN', 'usuarios', usuario.id, 'Inicio de sesion exitoso', req);
  const permisos = await getPermisos(usuario.rol_id);
  const token = signToken(usuario, permisos);
  return res.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      actor: actorFromRole(usuario.rol),
      permisos,
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
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol_id, cliente_id, estado, verification_token_hash, verification_expires)
     VALUES (?, ?, ?, ?, ?, 'INACTIVO', ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
    [nombre, correo, passwordHash, rolDb.id, cliente_id, tokenHash]
  );

  const verificationUrl = `${publicBaseUrl(req)}/api/auth/verificar-correo?token=${verificationToken}`;
  const email = await sendVerificationEmail({ to: correo, name: nombre, verificationUrl });
  await audit(result.insertId, 'REGISTRO', 'usuarios', result.insertId, 'Usuario registrado', req);
  return res.status(201).json({ id: result.insertId, nombre, correo, rol: rolDb.nombre, email });
});

exports.verificarCorreo = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ mensaje: 'Token de verificacion requerido' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const [result] = await pool.query(
    `UPDATE usuarios
     SET email_verificado = 1, estado = 'ACTIVO', verification_token_hash = NULL, verification_expires = NULL
     WHERE verification_token_hash = ? AND verification_expires > NOW()`,
    [tokenHash]
  );

  if (!result.affectedRows) {
    return res.status(400).json({ mensaje: 'Token invalido o expirado' });
  }

  return res.json({ mensaje: 'Correo validado correctamente' });
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
