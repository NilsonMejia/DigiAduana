const bcrypt = require('bcrypt');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');
const { sendVerificationEmail } = require('../services/emailService');
const { buildVerificationUrl, createVerificationCode } = require('../utils/emailVerification');

const ROLE_CODES = {
  admin: 'ADMINISTRADOR',
  administrador: 'ADMINISTRADOR',
  supervisor: 'SUPERVISOR',
  forwarder: 'FREIGHT_FORWARDER',
  freight_forwarder: 'FREIGHT_FORWARDER',
  cliente: 'CLIENTE',
  soporte: 'SOPORTE_TECNICO',
  soporte_tecnico: 'SOPORTE_TECNICO'
};

function normalizeRoleKey(role) {
  return String(role || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function actorFromRole(role) {
  return {
    ADMINISTRADOR: 'admin',
    SUPERVISOR: 'supervisor',
    FREIGHT_FORWARDER: 'forwarder',
    CLIENTE: 'cliente',
    SOPORTE_TECNICO: 'soporte'
  }[role] || normalizeRoleKey(role);
}

async function resolveRoleId({ rol_id, rol }) {
  if (rol_id) return rol_id;
  const roleName = ROLE_CODES[normalizeRoleKey(rol)] || rol;
  const [[row]] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [roleName]);
  return row?.id;
}

exports.listar = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, u.estado, u.email_verificado, u.email_verified_at,
            u.cliente_id, r.id AS rol_id, r.nombre AS rol, u.creado_en
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     ORDER BY u.creado_en DESC`
  );
  res.json(rows.map((row) => ({ ...row, actor: actorFromRole(row.rol) })));
});

exports.roles = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, nombre, descripcion FROM roles ORDER BY id');
  res.json(rows.map((row) => ({ ...row, actor: actorFromRole(row.nombre) })));
});

exports.crear = asyncHandler(async (req, res) => {
  const { nombre, correo, password, rol_id, rol, cliente_id = null } = req.body;
  if (!nombre || !correo || !password || (!rol_id && !rol)) {
    return res.status(400).json({ mensaje: 'Nombre, correo, password y rol son requeridos' });
  }

  const resolvedRoleId = await resolveRoleId({ rol_id, rol });
  if (!resolvedRoleId) return res.status(400).json({ mensaje: 'Rol no valido' });

  const hash = await bcrypt.hash(password, 10);
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
      hash,
      resolvedRoleId,
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
    return res.status(502).json({
      mensaje: 'El usuario fue creado, pero no se pudo enviar el codigo al correo. Revisa la configuracion SMTP e intenta reenviar el codigo.'
    });
  }
  await audit(req.user.id, 'CREAR_USUARIO', 'usuarios', result.insertId, correo, req);
  res.status(201).json({
    id: result.insertId,
    nombre: nombre.trim(),
    correo: normalizedEmail,
    rol_id: resolvedRoleId,
    estado: 'INACTIVO',
    email_verificado: 0,
    email
  });
});

exports.actualizar = asyncHandler(async (req, res) => {
  if (req.body.rol && !req.body.rol_id) {
    req.body.rol_id = await resolveRoleId({ rol: req.body.rol });
    if (!req.body.rol_id) return res.status(400).json({ mensaje: 'Rol no valido' });
  }

  if (req.body.estado) {
    req.body.estado = String(req.body.estado).toUpperCase();
  }

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
