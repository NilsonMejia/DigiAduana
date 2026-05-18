const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const jwtConfig = require('../config/jwt');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');
const { sendVerificationEmail } = require('../services/emailService');
const { buildVerificationUrl, createVerificationCode, hashVerificationToken } = require('../utils/emailVerification');

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

function emailFailureResponse(res, message, verificationCode) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`Codigo de verificacion de desarrollo: ${verificationCode}`);
    return res.status(201).json({
      mensaje: `${message} Gmail rechazo el envio; usa este codigo de desarrollo para verificar la cuenta.`,
      email: { sent: false, provider: 'development-console' },
      devVerificationCode: verificationCode
    });
  }

  return res.status(502).json({
    mensaje: `${message} Revisa la configuracion SMTP e intenta reenviar el codigo.`
  });
}

exports.login = asyncHandler(async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ mensaje: 'Correo y password son requeridos' });
  }

  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, u.password_hash, u.estado, u.email_verificado, u.email_verified_at,
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

  if (!usuario.email_verificado && !usuario.email_verified_at) {
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
  const verification = createVerificationCode();
  const normalizedEmail = correo.trim().toLowerCase();
  const [result] = await pool.query(
    `INSERT INTO usuarios
     (nombre, correo, password_hash, rol_id, cliente_id, estado, email_verificado, email_verified_at,
      verification_token, token_expires_at, verification_token_hash, verification_expires)
     VALUES (?, ?, ?, ?, ?, 'INACTIVO', 0, NULL, ?, ?, ?, ?)`,
    [
      nombre.trim(),
      normalizedEmail,
      passwordHash,
      rolDb.id,
      cliente_id,
      verification.codeHash,
      verification.expiresAt,
      verification.codeHash,
      verification.expiresAt
    ]
  );

  const verificationUrl = buildVerificationUrl(req, normalizedEmail);
  let email;
  try {
    email = await sendVerificationEmail({
      to: normalizedEmail,
      name: nombre.trim(),
      verificationUrl,
      verificationCode: verification.code
    });
  } catch (error) {
    console.error(`No se pudo enviar el codigo de verificacion a ${normalizedEmail}: ${error.message}`);
    return emailFailureResponse(res, 'La cuenta fue creada, pero no se pudo enviar el codigo al correo.', verification.code);
  }
  await audit(result.insertId, 'REGISTRO', 'usuarios', result.insertId, 'Usuario registrado', req);
  return res.status(201).json({
    id: result.insertId,
    nombre: nombre.trim(),
    correo: normalizedEmail,
    rol: rolDb.nombre,
    mensaje: 'Usuario registrado. Revisa tu correo para verificar la cuenta.',
    email
  });
});

async function markEmailVerified({ tokenHash, correo }) {
  const params = correo ? [correo.trim().toLowerCase(), tokenHash, tokenHash] : [tokenHash, tokenHash];
  const emailCondition = correo ? 'correo = ? AND' : '';
  const [result] = await pool.query(
    `UPDATE usuarios
     SET email_verificado = 1,
         email_verified_at = NOW(),
         estado = 'ACTIVO',
         verification_token = NULL,
         token_expires_at = NULL,
         verification_token_hash = NULL,
         verification_expires = NULL
     WHERE ${emailCondition} (verification_token = ? OR verification_token_hash = ?)
       AND COALESCE(token_expires_at, verification_expires) > NOW()
       AND email_verified_at IS NULL`,
    params
  );
  return result;
}

exports.verificarCorreo = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ mensaje: 'Token de verificacion requerido' });

  const tokenHash = hashVerificationToken(token);
  const result = await markEmailVerified({ tokenHash });

  if (!result.affectedRows) {
    return res.status(400).json({ mensaje: 'Token invalido o expirado' });
  }

  return res.json({ mensaje: 'Correo validado correctamente' });
});

exports.verificarCodigo = asyncHandler(async (req, res) => {
  const { correo, codigo } = req.body;
  const cleanCode = String(codigo || '').replace(/\D/g, '');

  if (!correo || cleanCode.length !== 6) {
    return res.status(400).json({ mensaje: 'Correo y codigo de 6 digitos son requeridos' });
  }

  const result = await markEmailVerified({
    correo,
    tokenHash: hashVerificationToken(cleanCode)
  });

  if (!result.affectedRows) {
    return res.status(400).json({ mensaje: 'Codigo invalido, usado o expirado' });
  }

  return res.json({ mensaje: 'Correo validado correctamente. Ya puedes iniciar sesion.' });
});

exports.reenviarCodigo = asyncHandler(async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ mensaje: 'Correo requerido' });

  const normalizedEmail = correo.trim().toLowerCase();
  const [[usuario]] = await pool.query(
    `SELECT id, nombre, email_verificado, email_verified_at
     FROM usuarios
     WHERE correo = ?`,
    [normalizedEmail]
  );

  if (!usuario) return res.status(404).json({ mensaje: 'No existe una cuenta con ese correo' });
  if (usuario.email_verificado || usuario.email_verified_at) {
    return res.status(409).json({ mensaje: 'Esta cuenta ya fue verificada' });
  }

  const verification = createVerificationCode();
  await pool.query(
    `UPDATE usuarios
     SET verification_token = ?,
         token_expires_at = ?,
         verification_token_hash = ?,
         verification_expires = ?
     WHERE id = ?`,
    [verification.codeHash, verification.expiresAt, verification.codeHash, verification.expiresAt, usuario.id]
  );

  const verificationUrl = buildVerificationUrl(req, normalizedEmail);
  let email;
  try {
    email = await sendVerificationEmail({
      to: normalizedEmail,
      name: usuario.nombre,
      verificationUrl,
      verificationCode: verification.code
    });
  } catch (error) {
    console.error(`No se pudo reenviar el codigo de verificacion a ${normalizedEmail}: ${error.message}`);
    return emailFailureResponse(res, 'Se genero un nuevo codigo, pero no se pudo enviar al correo.', verification.code);
  }

  return res.json({
    mensaje: 'Codigo reenviado correctamente. Revisa tu correo.',
    email
  });
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
