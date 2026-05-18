/**
 * DigiAduana - servidor mock profesional
 *
 * Ejecutar:
 *   node server-mock.js
 *
 * Variables opcionales:
 *   MOCK_PORT=3000
 *   MOCK_JWT_SECRET=digiaduana-secret-key
 *   MOCK_ERROR_RATE=0.05
 *   MOCK_MIN_DELAY=200
 *   MOCK_MAX_DELAY=800
 *
 * Credenciales demo:
 *   admin@digiaduana.local / Admin123
 *   forwarder@digiaduana.local / Forwarder123
 *   supervisor@digiaduana.local / Supervisor123
 *   cliente@digiaduana.local / Cliente123
 *   soporte@digiaduana.local / Soporte123
 *
 * El mock expone rutas en raiz (/auth/login) y tambien bajo /api (/api/auth/login)
 * para facilitar integracion con distintas configuraciones del frontend.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const PORT = Number(process.env.MOCK_PORT || 3000);
const JWT_SECRET = process.env.MOCK_JWT_SECRET || 'digiaduana-secret-key';
const MIN_DELAY = Number(process.env.MOCK_MIN_DELAY || 200);
const MAX_DELAY = Number(process.env.MOCK_MAX_DELAY || 800);
const ERROR_RATE = Number(process.env.MOCK_ERROR_RATE ?? 0);
const CACHE_TTL_MS = 10_000;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const FRONTEND_URL = process.env.MOCK_FRONTEND_URL || `http://localhost:${PORT}`;

const ROLES = Object.freeze({
  ADMIN: 'admin',
  FORWARDER: 'forwarder',
  SUPERVISOR: 'supervisor',
  CLIENTE: 'cliente',
  SOPORTE: 'soporte'
});

const ESTADOS = [
  'Registrado',
  'En Auditoria',
  'Observado',
  'Documentacion Aprobada',
  'Liberado',
  'Entregado'
];

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: ['usuarios.gestionar', 'reportes.ver', 'tracking.ver', 'configuracion.gestionar', 'logs.ver'],
  [ROLES.FORWARDER]: ['expedientes.crear', 'documentos.subir', 'dte.emitir', 'tracking.ver'],
  [ROLES.SUPERVISOR]: ['expedientes.aprobar', 'documentos.validar', 'dte.validar', 'reportes.ver', 'tracking.ver'],
  [ROLES.CLIENTE]: ['tracking.ver', 'facturas.ver'],
  [ROLES.SOPORTE]: ['logs.ver', 'infraestructura.ver', 'sesiones.ver']
});

const TIPOS_OPERACION = ['IMPORTACION', 'EXPORTACION', 'TRANSITO', 'REEXPORTACION'];
const UBICACIONES = [
  'Puerto de Acajutla',
  'Aduana San Bartolo',
  'Aeropuerto Internacional de El Salvador',
  'Frontera El Amatillo',
  'Zona Franca San Marcos',
  'Bodega fiscal Nejapa',
  'Aduana La Hachadura',
  'Centro de Distribucion Apopa'
];
const DOCUMENT_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

let db = buildSeed();
const cache = new Map();
const requestLogs = [];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(logRequests);

router.use(simulateNetwork);

router.get('/health', (req, res) => {
  res.json({
    sistema: 'DigiAduana Mock API',
    estado: 'OK',
    fecha: new Date().toISOString()
  });
});

router.get('/verificar', (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) return res.status(400).json({ mensaje: 'Token de verificacion requerido.' });

  const user = db.usuarios.find((item) => item.verification_token === token);
  if (!user) return res.status(404).json({ mensaje: 'Token de verificacion invalido o ya utilizado.' });

  if (user.verification_expires_at && Date.now() > new Date(user.verification_expires_at).getTime()) {
    return res.status(410).json({ mensaje: 'El token de verificacion expiro. Solicita reenvio al administrador.' });
  }

  user.estado = 'activo';
  user.activo = true;
  user.email_verificado = true;
  user.verificado_en = new Date().toISOString();
  delete user.verification_token;
  delete user.verification_expires_at;

  addAuditLog('usuarios.verify', user.id_usuario, `Cuenta verificada: ${user.correo}`);
  res.json({ mensaje: 'Cuenta verificada correctamente. Ya puedes iniciar sesion.', usuario: publicUser(user) });
});

router.post('/validar-cuenta', (req, res) => {
  const correo = String(req.body.email || req.body.correo || '').trim().toLowerCase();
  const codigo = String(req.body.codigo || '').trim();
  const nuevaPassword = String(req.body.nueva_password || req.body.password || req.body.nuevaPassword || '');

  if (!correo || !codigo || !nuevaPassword) {
    return res.status(400).json({ mensaje: 'email, codigo y nueva_password son obligatorios.' });
  }

  if (!/^\d{6}$/.test(codigo)) {
    return res.status(400).json({ mensaje: 'El codigo debe tener 6 digitos.' });
  }

  if (nuevaPassword.length < 8) {
    return res.status(400).json({ mensaje: 'La nueva contrasena debe tener al menos 8 caracteres.' });
  }

  const user = db.usuarios.find((item) => item.correo.toLowerCase() === correo);
  if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

  if (user.estado === 'suspendido') {
    return res.status(403).json({ mensaje: 'Cuenta suspendida. Contacte al administrador.' });
  }

  if (user.email_verificado && user.estado === 'activo') {
    return res.status(409).json({ mensaje: 'La cuenta ya esta activa.' });
  }

  if (!user.verification_code || user.verification_code !== codigo) {
    return res.status(400).json({ mensaje: 'Codigo de verificacion invalido.' });
  }

  if (user.verification_expires_at && Date.now() > new Date(user.verification_expires_at).getTime()) {
    return res.status(410).json({ mensaje: 'El codigo expiro. Solicita un nuevo codigo.' });
  }

  user.password_hash = bcrypt.hashSync(nuevaPassword, 8);
  user.estado = 'activo';
  user.activo = true;
  user.email_verificado = true;
  user.verificado_en = new Date().toISOString();
  delete user.verification_token;
  delete user.verification_code;
  delete user.verification_expires_at;

  addAuditLog('usuarios.validate', user.id_usuario, `Cuenta validada con codigo: ${user.correo}`);
  res.json({ mensaje: 'Cuenta validada correctamente. Ya puedes iniciar sesion.', usuario: publicUser(user) });
});

router.post('/reenviar-codigo', (req, res) => {
  const correo = String(req.body.email || req.body.correo || '').trim().toLowerCase();
  if (!correo) return res.status(400).json({ mensaje: 'email es obligatorio.' });

  const user = db.usuarios.find((item) => item.correo.toLowerCase() === correo);
  if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

  if (user.estado === 'suspendido') {
    return res.status(403).json({ mensaje: 'Cuenta suspendida. Contacte al administrador.' });
  }

  if (user.estado === 'activo' && user.email_verificado) {
    return res.status(409).json({ mensaje: 'La cuenta ya esta activa.' });
  }

  issueVerificationChallenge(user);
  logVerificationEmail(user);
  addAuditLog('usuarios.resend_code', user.id_usuario, `Codigo reenviado: ${user.correo}`);
  res.json({ mensaje: 'Codigo reenviado. Revisa la consola del servidor.' });
});

router.post('/_reset', (req, res) => {
  db = buildSeed();
  cache.clear();
  requestLogs.length = 0;
  res.json({ mensaje: 'Base de datos simulada reiniciada', fecha: new Date().toISOString() });
});

router.post('/auth/login', (req, res) => {
  const correo = String(req.body.correo || req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = db.usuarios.find((item) => item.correo.toLowerCase() === correo);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ mensaje: 'Credenciales invalidas.' });
  }

  if (user.estado === 'pendiente_verificacion') {
    return res.status(403).json({
      mensaje: 'Verifica tu cuenta primero',
      code: 'PENDING_VERIFICATION',
      estado: user.estado
    });
  }

  if (user.estado === 'suspendido') {
    return res.status(403).json({
      mensaje: 'Cuenta suspendida',
      code: 'ACCOUNT_SUSPENDED',
      estado: user.estado
    });
  }

  if (user.estado && user.estado !== 'activo') {
    return res.status(403).json({ mensaje: `Usuario ${user.estado}.`, estado: user.estado });
  }

  if (!user.activo) {
    return res.status(403).json({ mensaje: 'Usuario inactivo.' });
  }

  const token = jwt.sign(
    {
      id: user.id_usuario,
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      actor: user.rol,
      permisos: ROLE_PERMISSIONS[user.rol] || [],
      cliente_id: user.cliente_id || null,
      estado: user.estado || 'activo'
    },
    JWT_SECRET,
    { expiresIn: '8h', issuer: 'digiaduana-mock', audience: 'digiaduana-frontend' }
  );

  addAuditLog('auth.login', user.id_usuario, `Inicio de sesion: ${user.correo}`);
  res.json({ token, user: publicUser(user), usuario: publicUser(user) });
});

router.get('/expedientes', authenticate, (req, res) => {
  const cacheKey = buildExpedientesCacheKey(req);
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const filtered = visibleExpedientes(req.user)
    .filter((item) => filterEquals(item.estado, req.query.estado))
    .filter((item) => filterEquals(item.tipo_operacion, req.query.tipo_operacion))
    .filter((item) => filterCliente(item, req.query.cliente))
    .sort(sortBy(req.query.sort || '-fecha_actualizacion'));

  const limit = clamp(req.query.limit, 1, 100, 10);
  const offset = clamp(req.query.offset, 0, filtered.length, 0);
  const data = filtered.slice(offset, offset + limit).map(expedienteListDTO);

  const payload = {
    data,
    pagination: {
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length
    },
    filtros: {
      estado: req.query.estado || null,
      cliente: req.query.cliente || null,
      tipo_operacion: req.query.tipo_operacion || null,
      sort: req.query.sort || '-fecha_actualizacion'
    }
  };

  if (req.user.rol === ROLES.SUPERVISOR) {
    payload.metricas = {
      total_expedientes: filtered.length,
      por_estado: countBy(filtered, 'estado'),
      por_tipo_operacion: countBy(filtered, 'tipo_operacion'),
      valor_fob_total: sum(filtered, 'valor_fob'),
      peso_total_kg: sum(filtered, 'peso_kg')
    };
  }

  setCache(cacheKey, payload, CACHE_TTL_MS);
  res.json(payload);
});

router.get('/clientes', authenticate, (req, res) => {
  const data = db.clientes
    .filter((item) => req.user.rol !== ROLES.CLIENTE || item.id_cliente === req.user.cliente_id)
    .map((item) => ({
      id: item.id_cliente,
      id_cliente: item.id_cliente,
      nombre: item.nombre,
      nit: item.nit,
      contacto_principal: item.contacto,
      correo: item.correo,
      estado: 'ACTIVO'
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  res.json({ data, total: data.length });
});

router.get('/expedientes/:id', authenticate, (req, res) => {
  const expediente = findVisibleExpediente(req.params.id, req.user);
  if (!expediente) return res.status(404).json({ mensaje: 'Expediente no encontrado o sin acceso.' });

  res.json(expedienteDetailDTO(expediente));
});

router.get('/expedientes/:id/documentos', authenticate, (req, res) => {
  const expediente = findVisibleExpediente(req.params.id, req.user);
  if (!expediente) return res.status(404).json({ mensaje: 'Expediente no encontrado o sin acceso.' });

  const documentos = db.documentos
    .filter((item) => item.expediente_id === expediente.id)
    .map(documentoDTO);

  res.json({ expediente_id: expediente.id, documentos });
});

router.post('/expedientes/:id/documentos', authenticate, authorize(ROLES.ADMIN, ROLES.FORWARDER), upload.single('archivo'), (req, res) => {
  const expediente = findVisibleExpediente(req.params.id, req.user);
  if (!expediente) return res.status(404).json({ mensaje: 'Expediente no encontrado o sin acceso.' });

  const tipo = String(req.body.tipo || req.body.tipo_documento || '').trim();
  const nombre = String(req.body.nombre || req.file?.originalname || '').trim();
  const descripcion = String(req.body.descripcion || '').trim();

  if (!tipo || !nombre) {
    return res.status(400).json({ mensaje: 'Tipo de documento y nombre del archivo son obligatorios.' });
  }

  if (!req.file) {
    return res.status(400).json({ mensaje: 'Debes adjuntar un archivo PDF, JPG o PNG.' });
  }

  if (!DOCUMENT_MIME_TYPES.has(req.file.mimetype)) {
    return res.status(400).json({ mensaje: 'Formato no permitido. Solo se aceptan PDF, JPG o PNG.' });
  }

  const now = new Date().toISOString();
  const nuevoDocumento = {
    id: nextId(db.documentos),
    expediente_id: expediente.id,
    tipo,
    nombre,
    descripcion,
    estado: 'PENDIENTE',
    url: `/uploads/mock/${expediente.codigo}/${String(nombre).replace(/[^a-zA-Z0-9._-]/g, '_')}`,
    fecha_carga: now,
    fecha_subida: now,
    subido_por: req.user.id_usuario,
    validado_por: null,
    fecha_validacion: null,
    observacion: '',
    observaciones: '',
    mime_type: req.file.mimetype,
    tamano_bytes: req.file.size,
    contenido_base64: req.file.buffer.toString('base64')
  };

  db.documentos.push(nuevoDocumento);
  cache.clear();
  addAuditLog('expedientes.documentos.create', req.user.id_usuario, `Documento ${nuevoDocumento.nombre} para ${expediente.codigo}`);

  res.status(201).json({ mensaje: 'Documento cargado correctamente.', documento: documentoDTO(nuevoDocumento) });
});

router.post('/expedientes', authenticate, authorize(ROLES.ADMIN, ROLES.FORWARDER), (req, res) => {
  const error = validateExpediente(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  const cliente = db.clientes.find((item) => item.id_cliente === Number(req.body.cliente_id));
  if (!cliente) return res.status(400).json({ mensaje: 'El cliente indicado no existe.' });

  const codigo = req.body.codigo || nextExpedienteCode();
  if (db.expedientes.some((item) => item.codigo === codigo)) {
    return res.status(400).json({ mensaje: 'El codigo de expediente ya existe.' });
  }

  const now = new Date().toISOString();
  const expediente = {
    id: nextId(db.expedientes),
    codigo,
    cliente_id: cliente.id_cliente,
    forwarder_id: req.user.rol === ROLES.FORWARDER ? req.user.id_usuario : 2,
    tipo_operacion: req.body.tipo_operacion,
    regimen: req.body.regimen,
    aduana_ingreso: req.body.aduana_ingreso || 'Aduana San Bartolo',
    aduana_salida: req.body.aduana_salida || 'No aplica',
    descripcion: req.body.descripcion || 'Expediente creado desde mock API.',
    estado: 'Registrado',
    ubicacion_actual: 'Recepcion documental',
    fecha_creacion: now,
    fecha_actualizacion: now,
    valor_fob: Number(req.body.valor_fob || 0),
    peso_kg: Number(req.body.peso_kg || 0)
  };

  db.expedientes.push(expediente);
  db.tracking_events.push({
    id: nextId(db.tracking_events),
    expediente_id: expediente.id,
    codigo: expediente.codigo,
    estado: 'Registrado',
    evento: 'Expediente registrado',
    ubicacion: expediente.ubicacion_actual,
    fecha_evento: now,
    publico: true
  });

  cache.clear();
  addAuditLog('expedientes.create', req.user.id_usuario, `Creado ${expediente.codigo}`);
  res.status(201).json(expedienteDetailDTO(expediente));
});

router.get('/tracking/:codigo', (req, res) => {
  const expediente = db.expedientes.find((item) => item.codigo.toLowerCase() === req.params.codigo.toLowerCase());
  if (!expediente) {
    return res.status(404).json({ mensaje: 'No encontramos un expediente con ese numero de seguimiento.' });
  }

  const eventos = db.tracking_events
    .filter((item) => item.expediente_id === expediente.id && item.publico)
    .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento))
    .map(({ evento, estado, ubicacion, fecha_evento }) => ({ evento, estado, ubicacion, fecha_evento }));

  res.json({
    codigo: expediente.codigo,
    estado: expediente.estado,
    estado_actual: expediente.estado,
    ubicacion: expediente.ubicacion_actual,
    fecha_creacion: expediente.fecha_creacion,
    ultima_actualizacion: expediente.fecha_actualizacion,
    eventos
  });
});

router.get('/reportes/dashboard', authenticate, (req, res) => {
  const expedientes = visibleExpedientes(req.user);
  const entregados = expedientes.filter((item) => item.estado === 'Entregado').length;
  const observados = expedientes.filter((item) => item.estado === 'Observado').length;
  const abiertos = expedientes.length - entregados;

  res.json({
    rol: req.user.rol,
    generado_en: new Date().toISOString(),
    kpis: {
      total_expedientes: expedientes.length,
      abiertos,
      observados,
      entregados,
      tasa_entrega: expedientes.length ? Number(((entregados / expedientes.length) * 100).toFixed(1)) : 0,
      valor_fob_total: sum(expedientes, 'valor_fob'),
      peso_total_kg: sum(expedientes, 'peso_kg'),
      documentos_pendientes: visibleDocumentos(req.user).filter((item) => item.estado !== 'APROBADO').length
    },
    por_estado: countBy(expedientes, 'estado'),
    por_tipo_operacion: countBy(expedientes, 'tipo_operacion'),
    recientes: expedientes
      .slice()
      .sort((a, b) => new Date(b.fecha_actualizacion) - new Date(a.fecha_actualizacion))
      .slice(0, 8)
      .map(expedienteListDTO)
  });
});

router.get(['/integraciones/estado', '/integracioes/estado'], authenticate, authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SOPORTE), (req, res) => {
  res.json({
    generado_en: new Date().toISOString(),
    servicios: [
      integration('Hacienda', 'online', 140, 420),
      integration('Navieras', Math.random() > 0.2 ? 'online' : 'degradado', 280, 900),
      integration('Aerolineas', Math.random() > 0.1 ? 'online' : 'offline', 180, 700)
    ]
  });
});

router.get('/usuarios', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  const data = db.usuarios
    .filter((item) => filterEquals(item.rol, req.query.rol))
    .map(publicUser);

  res.json({ data, total: data.length });
});

router.get('/usuarios/roles', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  res.json(
    Object.values(ROLES).map((rol, index) => ({
      id: index + 1,
      nombre: rol.toUpperCase(),
      actor: rol,
      descripcion: roleLabel(rol)
    }))
  );
});

router.post('/usuarios', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  const { nombre, correo, password, rol, cliente_id, telefono } = req.body;

  if (!nombre || !correo || !password || !rol) {
    return res.status(400).json({ mensaje: 'nombre, correo, password y rol son obligatorios.' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ mensaje: 'La contrasena temporal debe tener al menos 8 caracteres.' });
  }

  if (!Object.values(ROLES).includes(rol)) {
    return res.status(400).json({ mensaje: 'Rol no permitido.' });
  }

  if (db.usuarios.some((item) => item.correo.toLowerCase() === String(correo).toLowerCase())) {
    return res.status(400).json({ mensaje: 'Ya existe un usuario con ese correo.' });
  }

  const user = {
    id_usuario: nextId(db.usuarios, 'id_usuario'),
    nombre: String(nombre).trim(),
    correo: String(correo).trim().toLowerCase(),
    rol,
    telefono: telefono ? String(telefono).trim() : '',
    cliente_id: rol === ROLES.CLIENTE ? Number(cliente_id) || null : null,
    estado: 'pendiente_verificacion',
    activo: false,
    email_verificado: false,
    password_hash: bcrypt.hashSync(String(password), 8),
    creado_en: new Date().toISOString()
  };
  issueVerificationChallenge(user);

  db.usuarios.push(user);
  logVerificationEmail(user);
  addAuditLog('usuarios.create', req.user.id_usuario, `Creado usuario pendiente ${user.correo}`);
  res.status(201).json({
    mensaje: 'Usuario creado en estado pendiente_verificacion. Se envio enlace de verificacion simulado.',
    usuario: publicUser(user)
  });
});

router.patch('/usuarios/:id/suspender', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  const user = db.usuarios.find((item) => String(item.id_usuario) === String(req.params.id) || String(item.id) === String(req.params.id));
  if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  if (user.id_usuario === req.user.id_usuario) {
    return res.status(400).json({ mensaje: 'No puedes suspender tu propia cuenta.' });
  }

  user.estado = 'suspendido';
  user.activo = false;
  user.jwt_revoked_at = new Date().toISOString();
  addAuditLog('usuarios.suspend', req.user.id_usuario, `Suspendido usuario ${user.correo}`);
  res.json({ mensaje: 'Usuario suspendido. Sus tokens quedan invalidados en el mock.', usuario: publicUser(user) });
});

router.patch('/usuarios/:id/activar', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  const user = db.usuarios.find((item) => String(item.id_usuario) === String(req.params.id) || String(item.id) === String(req.params.id));
  if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

  user.estado = 'activo';
  user.activo = true;
  user.email_verificado = true;
  user.verificado_en = user.verificado_en || new Date().toISOString();
  delete user.verification_token;
  delete user.verification_code;
  delete user.verification_expires_at;
  addAuditLog('usuarios.activate', req.user.id_usuario, `Activado usuario ${user.correo}`);
  res.json({ mensaje: 'Usuario activado correctamente.', usuario: publicUser(user) });
});

router.patch('/usuarios/:id', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  const user = db.usuarios.find((item) => String(item.id_usuario) === String(req.params.id) || String(item.id) === String(req.params.id));
  if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

  const { nombre, correo, password, rol, estado, activo } = req.body;
  if (nombre !== undefined) user.nombre = String(nombre);
  if (correo !== undefined) user.correo = String(correo);
  if (password) user.password_hash = bcrypt.hashSync(String(password), 8);
  if (rol !== undefined) {
    if (!Object.values(ROLES).includes(rol)) return res.status(400).json({ mensaje: 'Rol no permitido.' });
    user.rol = rol;
  }
  if (estado !== undefined) {
    const normalizedEstado = String(estado).trim().toLowerCase();
    if (!['activo', 'pendiente_verificacion', 'bloqueado', 'suspendido'].includes(normalizedEstado)) {
      return res.status(400).json({ mensaje: 'Estado no permitido.' });
    }
    user.estado = normalizedEstado;
    user.activo = normalizedEstado === 'activo';
  }
  if (activo !== undefined) {
    user.activo = Boolean(activo);
    user.estado = user.activo ? 'activo' : 'suspendido';
  }

  addAuditLog('usuarios.update', req.user.id_usuario, `Actualizado usuario ${user.correo}`);
  res.json(publicUser(user));
});

router.put('/usuarios/:id', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  const user = db.usuarios.find((item) => String(item.id_usuario) === String(req.params.id) || String(item.id) === String(req.params.id));
  if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

  const { nombre, correo, password, rol, estado, activo } = req.body;
  if (nombre !== undefined) user.nombre = String(nombre);
  if (correo !== undefined) user.correo = String(correo);
  if (password) user.password_hash = bcrypt.hashSync(String(password), 8);
  if (rol !== undefined) {
    if (!Object.values(ROLES).includes(rol)) return res.status(400).json({ mensaje: 'Rol no permitido.' });
    user.rol = rol;
  }
  if (estado !== undefined) {
    const normalizedEstado = String(estado).trim().toLowerCase();
    if (!['activo', 'pendiente_verificacion', 'bloqueado', 'suspendido'].includes(normalizedEstado)) {
      return res.status(400).json({ mensaje: 'Estado no permitido.' });
    }
    user.estado = normalizedEstado;
    user.activo = normalizedEstado === 'activo';
  }
  if (activo !== undefined) {
    user.activo = Boolean(activo);
    user.estado = user.activo ? 'activo' : 'suspendido';
  }

  addAuditLog('usuarios.update', req.user.id_usuario, `Actualizado usuario ${user.correo}`);
  res.json(publicUser(user));
});

router.delete('/usuarios/:id', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  const user = db.usuarios.find((item) => String(item.id_usuario) === String(req.params.id) || String(item.id) === String(req.params.id));
  if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  user.activo = false;
  user.estado = 'suspendido';
  addAuditLog('usuarios.disable', req.user.id_usuario, `Desactivado usuario ${user.correo}`);
  res.json({ mensaje: 'Usuario desactivado.', usuario: publicUser(user) });
});

router.get('/logs', authenticate, authorize(ROLES.ADMIN, ROLES.SOPORTE), (req, res) => {
  const limit = clamp(req.query.limit, 1, 200, 50);
  const offset = clamp(req.query.offset, 0, requestLogs.length, 0);
  const data = requestLogs.slice().reverse().slice(offset, offset + limit);

  res.json({
    data,
    pagination: {
      total: requestLogs.length,
      limit,
      offset,
      hasMore: offset + limit < requestLogs.length
    }
  });
});

router.get('/notificaciones', authenticate, authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FORWARDER, ROLES.SOPORTE), (req, res) => {
  const expedientes = visibleExpedientes(req.user);
  const observados = expedientes.filter((item) => item.estado === 'Observado').slice(0, 5);
  const documentosPendientes = visibleDocumentos(req.user).filter((item) => item.estado !== 'APROBADO').slice(0, 6);
  const data = [
    ...observados.map((item) => ({
      id: `obs-${item.id}`,
      tipo: 'warning',
      titulo: `Expediente observado ${item.codigo}`,
      mensaje: `${findCliente(item.cliente_id)?.nombre || 'Cliente'} requiere seguimiento documental.`,
      fecha: item.fecha_actualizacion
    })),
    ...documentosPendientes.map((item) => ({
      id: `doc-${item.id}`,
      tipo: item.estado === 'OBSERVADO' ? 'danger' : 'info',
      titulo: `Documento ${item.estado.toLowerCase()}`,
      mensaje: `${item.tipo} en ${findExpediente(item.expediente_id)?.codigo || 'expediente'}`,
      fecha: item.fecha_carga
    }))
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  res.json({ data, total: data.length });
});

router.get('/configuracion', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  res.json({
    sistema: {
      nombre: 'DigiAduana',
      entorno: 'simulacion',
      version: '1.0.0',
      retencion_logs_dias: 90,
      max_pdf_mb: 10
    },
    integraciones: [
      integration('Ministerio de Hacienda', 'online', 120, 360),
      integration('Navieras', 'online', 220, 760),
      integration('Correo transaccional', 'degradado', 180, 620)
    ],
    parametros: [
      { clave: 'jwt_expiracion', valor: '8h' },
      { clave: 'tracking_publico', valor: 'activo' },
      { clave: 'validacion_correo', valor: 'activa' }
    ]
  });
});

router.get('/backups', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  const data = Array.from({ length: 8 }, (_, index) => ({
    id: index + 1,
    nombre: `backup-digiaduana-${String(index + 1).padStart(2, '0')}.sql.gz`,
    estado: index === 0 ? 'COMPLETADO' : index === 3 ? 'ADVERTENCIA' : 'COMPLETADO',
    tamano_mb: 280 + index * 34,
    fecha: relativeDate(index * 2 + 1).toISOString(),
    retencion_dias: 30
  }));
  res.json({ data, total: data.length, proximo: addDays(new Date(), 1).toISOString() });
});

router.get('/sesiones', authenticate, authorize(ROLES.ADMIN, ROLES.SOPORTE), (req, res) => {
  const data = db.usuarios
    .filter((item) => item.activo)
    .map((item, index) => ({
      id: index + 1,
      usuario: item.nombre,
      correo: item.correo,
      rol: item.rol,
      ip: `192.168.1.${20 + index}`,
      inicio: relativeDate(index).toISOString(),
      expira_en_min: 35 + index * 8
    }));
  res.json({ data, total: data.length });
});

router.get('/documentos', authenticate, (req, res) => {
  const estado = String(req.query.estado || '').toUpperCase();
  const data = visibleDocumentos(req.user)
    .filter((doc) => !estado || normalizeDocumentStatus(doc.estado) === estado)
    .sort((a, b) => new Date(b.fecha_subida || b.fecha_carga) - new Date(a.fecha_subida || a.fecha_carga))
    .map(documentoDTO);
  res.json({ data, total: data.length });
});

router.patch('/documentos/:id/validar', authenticate, authorize(ROLES.ADMIN, ROLES.SUPERVISOR), (req, res) => {
  const documento = visibleDocumentos(req.user).find((item) => String(item.id) === String(req.params.id));
  if (!documento) return res.status(404).json({ mensaje: 'Documento no encontrado o sin acceso.' });

  const estado = normalizeDocumentStatus(req.body.estado || req.body.estado_validacion);
  const observacion = String(req.body.observacion || req.body.observaciones || '').trim();

  if (!['VALIDADO', 'RECHAZADO'].includes(estado)) {
    return res.status(400).json({ mensaje: 'El estado debe ser VALIDADO o RECHAZADO.' });
  }

  if (estado === 'RECHAZADO' && observacion.length < 6) {
    return res.status(400).json({ mensaje: 'La observacion es obligatoria para rechazar el documento.' });
  }

  documento.estado = estado;
  documento.validado_por = req.user.id_usuario;
  documento.fecha_validacion = new Date().toISOString();
  documento.observacion = estado === 'RECHAZADO' ? observacion : '';
  documento.observaciones = documento.observacion;
  cache.clear();
  addAuditLog('documentos.validar', req.user.id_usuario, `${estado} documento ${documento.nombre}`);

  res.json({ mensaje: `Documento ${estado.toLowerCase()} correctamente.`, documento: documentoDTO(documento) });
});

router.get('/documentos/:id/download', authenticate, (req, res) => {
  const documento = visibleDocumentos(req.user).find((item) => String(item.id) === String(req.params.id));
  if (!documento) return res.status(404).json({ mensaje: 'Documento no encontrado o sin acceso.' });

  const content = documento.contenido_base64
    ? Buffer.from(documento.contenido_base64, 'base64')
    : Buffer.from(mockFileContent(documento), 'utf8');

  res.setHeader('Content-Type', documento.mime_type || 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(documento.nombre)}"`);
  res.send(content);
});

router.get('/dte', authenticate, (req, res) => {
  const estado = String(req.query.estado || '').toUpperCase();
  const data = visibleDtes(req.user)
    .filter((item) => !estado || normalizeDteStatus(item.estado) === estado)
    .sort((a, b) => new Date(b.fecha_emision || b.fecha) - new Date(a.fecha_emision || a.fecha))
    .map(dteDTO);
  res.json({ data, total: data.length });
});

router.post('/dte/:id/enviar', authenticate, authorize(ROLES.ADMIN, ROLES.FORWARDER, ROLES.SUPERVISOR), (req, res) => {
  const dte = visibleDtes(req.user).find((item) => String(item.id) === String(req.params.id));
  if (!dte) return res.status(404).json({ mensaje: 'DTE no encontrado o sin acceso.' });

  if (normalizeDteStatus(dte.estado) === 'VALIDADO') {
    return res.json({ mensaje: 'El DTE ya estaba validado por Hacienda.', dte: dteDTO(dte) });
  }

  dte.intentos = Number(dte.intentos || 0) + 1;
  dte.ultimo_envio = new Date().toISOString();
  const descripcion = String(dte.descripcion || '').toLowerCase();
  const total = Number(dte.total || 0);
  const debeRechazar = total <= 0 || descripcion.includes('error') || descripcion.includes('incompleto') || dte.forzar_rechazo;

  if (debeRechazar) {
    dte.estado = 'RECHAZADO';
    dte.motivo_rechazo = total <= 0
      ? 'Hacienda rechazo el DTE: el monto total debe ser mayor a cero.'
      : 'Hacienda rechazo el DTE: firma o descripcion fiscal inconsistente.';
    dte.error_hacienda = dte.motivo_rechazo;
    dte.sello_recepcion = null;
    dte.sello_hacienda = null;
    dte.forzar_rechazo = false;
    addAuditLog('dte.rechazado', req.user.id_usuario, `${dte.numero_control}: ${dte.motivo_rechazo}`);
    return res.status(422).json({ mensaje: dte.motivo_rechazo, dte: dteDTO(dte) });
  }

  dte.estado = 'VALIDADO';
  dte.motivo_rechazo = '';
  dte.error_hacienda = '';
  dte.sello_recepcion = `MH-${Date.now()}-${String(dte.id).padStart(4, '0')}`;
  dte.sello_hacienda = dte.sello_recepcion;
  dte.fecha_validacion = new Date().toISOString();
  cache.clear();
  addAuditLog('dte.validado', req.user.id_usuario, `${dte.numero_control} validado por Hacienda`);

  res.json({ mensaje: 'DTE validado por Hacienda correctamente.', dte: dteDTO(dte) });
});

router.put('/dte/:id', authenticate, authorize(ROLES.ADMIN, ROLES.FORWARDER, ROLES.SUPERVISOR), (req, res) => {
  const dte = visibleDtes(req.user).find((item) => String(item.id) === String(req.params.id));
  if (!dte) return res.status(404).json({ mensaje: 'DTE no encontrado o sin acceso.' });

  const total = Number(req.body.total ?? req.body.monto ?? dte.total);
  const descripcion = String(req.body.descripcion ?? dte.descripcion ?? '').trim();

  if (!Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ mensaje: 'El monto debe ser un numero mayor a cero.' });
  }

  if (descripcion.length < 5) {
    return res.status(400).json({ mensaje: 'La descripcion debe tener al menos 5 caracteres.' });
  }

  dte.total = Number(total.toFixed(2));
  dte.total_gravado = Number((dte.total / 1.13).toFixed(2));
  dte.total_iva = Number((dte.total - dte.total_gravado).toFixed(2));
  dte.descripcion = descripcion;
  dte.estado = 'PENDIENTE';
  dte.motivo_rechazo = '';
  dte.error_hacienda = '';
  dte.sello_recepcion = null;
  dte.sello_hacienda = null;
  dte.fecha_actualizacion = new Date().toISOString();
  cache.clear();
  addAuditLog('dte.update', req.user.id_usuario, `${dte.numero_control} corregido`);

  res.json({ mensaje: 'DTE corregido. Ya puedes reenviarlo a Hacienda.', dte: dteDTO(dte) });
});

router.get('/dte/:id/pdf', authenticate, (req, res) => {
  const dte = visibleDtes(req.user).find((item) => String(item.id) === String(req.params.id));
  if (!dte) return res.status(404).json({ mensaje: 'DTE no encontrado o sin acceso.' });
  if (normalizeDteStatus(dte.estado) !== 'VALIDADO') return res.status(409).json({ mensaje: 'Solo se pueden descargar DTE validados.' });

  const body = [
    'DIGIADUANA - COMPROBANTE DTE',
    `Numero: ${dte.numero_control}`,
    `Cliente: ${dteDTO(dte).cliente}`,
    `Expediente: ${dteDTO(dte).expediente}`,
    `Total: $${Number(dte.total).toFixed(2)}`,
    `Sello Hacienda: ${dte.sello_hacienda || dte.sello_recepcion}`
  ].join('\n');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(dte.numero_control)}.pdf"`);
  res.send(Buffer.from(body, 'utf8'));
});

router.get('/dte/:id/xml', authenticate, (req, res) => {
  const dte = visibleDtes(req.user).find((item) => String(item.id) === String(req.params.id));
  if (!dte) return res.status(404).json({ mensaje: 'DTE no encontrado o sin acceso.' });
  if (normalizeDteStatus(dte.estado) !== 'VALIDADO') return res.status(409).json({ mensaje: 'Solo se pueden descargar DTE validados.' });

  const payload = dteDTO(dte);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dte>
  <numero>${escapeXml(payload.numero_control)}</numero>
  <codigoGeneracion>${escapeXml(payload.codigo_generacion)}</codigoGeneracion>
  <selloHacienda>${escapeXml(payload.sello_hacienda)}</selloHacienda>
  <cliente>${escapeXml(payload.cliente)}</cliente>
  <expediente>${escapeXml(payload.expediente)}</expediente>
  <total>${payload.total}</total>
</dte>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(dte.numero_control)}.xml"`);
  res.send(xml);
});

router.get('/exportar/csv', authenticate, authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FORWARDER), (req, res) => {
  const rows = visibleExpedientes(req.user).map((item) => {
    const cliente = findCliente(item.cliente_id);
    return [
      item.codigo,
      cliente?.nombre || '',
      item.tipo_operacion,
      item.estado,
      item.ubicacion_actual,
      item.fecha_creacion,
      item.valor_fob,
      item.peso_kg
    ];
  });

  const csv = [
    ['codigo', 'cliente', 'tipo_operacion', 'estado', 'ubicacion', 'fecha_creacion', 'valor_fob', 'peso_kg'],
    ...rows
  ]
    .map((row) => row.map(csvCell).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="digiaduana-expedientes.csv"');
  res.send(csv);
});

app.use(router);
app.use('/api', router);

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Recurso no encontrado en mock API.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ mensaje: err.message || 'Error interno del mock API.' });
});

function buildSeed() {
  const clientes = [
    'Importadora Cuscatlan S.A. de C.V.',
    'Exportadora Pacifico Azul',
    'Textiles Santa Ana',
    'Agroindustrias Lempa',
    'Tecnologia Centroamericana',
    'Farmaceutica El Salvador',
    'Repuestos La Union',
    'Cafe Volcan de Izalco',
    'Plasticos Mesoamerica',
    'Logistica San Miguel'
  ].map((nombre, index) => ({
    id_cliente: index + 1,
    nombre,
    nit: `0614-${String(100000 + index * 173).padStart(6, '0')}-${String(100 + index)}-${index % 9}`,
    contacto: [
      'Ana Morales',
      'Carlos Rivas',
      'Marcela Pineda',
      'Roberto Aguilar',
      'Sofia Calderon',
      'Daniel Herrera',
      'Lucia Campos',
      'Mauricio Arias',
      'Karla Mejia',
      'Elena Portillo'
    ][index],
    correo: `cliente${index + 1}@empresa.local`
  }));

  const usuarios = [
    user(1, 'Admin Sistema', 'admin@digiaduana.local', 'Admin123', ROLES.ADMIN),
    user(2, 'Valeria Menendez', 'forwarder@digiaduana.local', 'Forwarder123', ROLES.FORWARDER),
    user(3, 'Mario Escobar', 'supervisor@digiaduana.local', 'Supervisor123', ROLES.SUPERVISOR),
    user(4, 'Ana Morales', 'cliente@digiaduana.local', 'Cliente123', ROLES.CLIENTE, 1),
    user(5, 'Diego Guardado', 'soporte@digiaduana.local', 'Soporte123', ROLES.SOPORTE),
    pendingUser(6, 'Usuario Prueba', 'usuario_prueba@digiaduana.local', ROLES.CLIENTE, 1)
  ];

  const expedientes = Array.from({ length: 30 }, (_, index) => expediente(index + 1, clientes));
  const documentos = expedientes.flatMap((item) => documentosFor(item));
  const dtes = dtesFor(expedientes);
  const tracking_events = expedientes.flatMap((item) => trackingFor(item));

  return { clientes, usuarios, expedientes, documentos, dtes, tracking_events };
}

function user(id_usuario, nombre, correo, password, rol, cliente_id = null) {
  return {
    id_usuario,
    nombre,
    correo,
    rol,
    cliente_id,
    telefono: '',
    estado: 'activo',
    activo: true,
    email_verificado: true,
    verificado_en: relativeDate(80 - id_usuario).toISOString(),
    password_hash: bcrypt.hashSync(password, 8),
    creado_en: relativeDate(80 - id_usuario).toISOString()
  };
}

function pendingUser(id_usuario, nombre, correo, rol, cliente_id = null) {
  const record = {
    id_usuario,
    nombre,
    correo,
    rol,
    cliente_id,
    telefono: '',
    estado: 'pendiente_verificacion',
    activo: false,
    email_verificado: false,
    password_hash: bcrypt.hashSync('Temporal123', 8),
    creado_en: relativeDate(1).toISOString()
  };
  issueVerificationChallenge(record);
  logVerificationEmail(record);
  return record;
}

function expediente(id, clientes) {
  const cliente = clientes[(id - 1) % clientes.length];
  const estado = ESTADOS[(id - 1) % ESTADOS.length];
  const created = relativeDate(90 - id * 2);
  const updated = addDays(created, Math.min(30, 2 + (id % 18)));

  return {
    id,
    codigo: `EXP-2026-${String(id).padStart(4, '0')}`,
    cliente_id: cliente.id_cliente,
    forwarder_id: 2,
    tipo_operacion: TIPOS_OPERACION[(id - 1) % TIPOS_OPERACION.length],
    regimen: id % 2 === 0 ? 'Exportacion definitiva' : 'Importacion definitiva',
    aduana_ingreso: id % 3 === 0 ? 'Aeropuerto Internacional de El Salvador' : 'Puerto de Acajutla',
    aduana_salida: id % 4 === 0 ? 'Frontera El Amatillo' : 'No aplica',
    descripcion: `Expediente simulado ${id} con carga comercial y trazabilidad aduanera.`,
    estado,
    ubicacion_actual: UBICACIONES[(id - 1) % UBICACIONES.length],
    fecha_creacion: created.toISOString(),
    fecha_actualizacion: updated.toISOString(),
    valor_fob: 3500 + id * 1275,
    peso_kg: 420 + id * 85
  };
}

function documentosFor(exp) {
  const base = new Date(exp.fecha_creacion);
  const facturaValidada = !['Registrado', 'Observado'].includes(exp.estado);
  const transporteRechazado = exp.estado === 'Observado' || exp.id % 8 === 0;
  const ducaPendiente = !['Liberado', 'Entregado'].includes(exp.estado);
  return [
    {
      id: exp.id * 10 + 1,
      expediente_id: exp.id,
      tipo: 'Factura comercial',
      nombre: `${exp.codigo}-factura.pdf`,
      descripcion: 'Factura comercial del embarque.',
      estado: facturaValidada ? 'VALIDADO' : 'PENDIENTE',
      url: `/uploads/mock/${exp.codigo}/factura.pdf`,
      fecha_carga: addDays(base, 1).toISOString(),
      fecha_subida: addDays(base, 1).toISOString(),
      subido_por: 2,
      validado_por: facturaValidada ? 3 : null,
      fecha_validacion: facturaValidada ? addDays(base, 3).toISOString() : null,
      observacion: '',
      observaciones: '',
      mime_type: 'application/pdf',
      tamano_bytes: 824000 + exp.id * 1024,
      origen_integracion: 'Cliente',
      canal_integracion: 'Carga manual',
      codigo_externo: `CLI-${exp.codigo}-FAC`
    },
    {
      id: exp.id * 10 + 2,
      expediente_id: exp.id,
      tipo: 'BL / Guia aerea',
      nombre: `${exp.codigo}-transporte.pdf`,
      descripcion: 'Documento de transporte asociado.',
      estado: transporteRechazado ? 'RECHAZADO' : 'VALIDADO',
      url: `/uploads/mock/${exp.codigo}/transporte.pdf`,
      fecha_carga: addDays(base, 2).toISOString(),
      fecha_subida: addDays(base, 2).toISOString(),
      subido_por: 2,
      validado_por: 3,
      fecha_validacion: addDays(base, 4).toISOString(),
      observacion: transporteRechazado ? 'El numero de BL no coincide con el manifiesto recibido.' : '',
      observaciones: transporteRechazado ? 'El numero de BL no coincide con el manifiesto recibido.' : '',
      mime_type: 'application/pdf',
      tamano_bytes: 612000 + exp.id * 700,
      origen_integracion: 'Navieras',
      canal_integracion: 'mock-navieras',
      codigo_externo: `MFT-${String(exp.id).padStart(6, '0')}`
    },
    {
      id: exp.id * 10 + 3,
      expediente_id: exp.id,
      tipo: 'DUCA',
      nombre: `${exp.codigo}-duca.pdf`,
      descripcion: 'Declaracion unica centroamericana.',
      estado: ducaPendiente ? 'PENDIENTE' : 'VALIDADO',
      url: `/uploads/mock/${exp.codigo}/duca.pdf`,
      fecha_carga: addDays(base, 4).toISOString(),
      fecha_subida: addDays(base, 4).toISOString(),
      subido_por: 2,
      validado_por: ducaPendiente ? null : 3,
      fecha_validacion: ducaPendiente ? null : addDays(base, 5).toISOString(),
      observacion: '',
      observaciones: '',
      mime_type: 'application/pdf',
      tamano_bytes: 932000 + exp.id * 850,
      origen_integracion: 'Hacienda',
      canal_integracion: 'mock-hacienda',
      codigo_externo: `HAC-${new Date(base).getFullYear()}-${String(exp.id).padStart(6, '0')}`
    }
  ];
}

function dtesFor(expedientes) {
  return expedientes.slice(0, 12).map((exp, index) => {
    const estado = ['VALIDADO', 'RECHAZADO', 'PENDIENTE', 'VALIDADO', 'PENDIENTE'][index % 5];
    const total = Number((exp.valor_fob * (0.0105 + (index % 4) * 0.001)).toFixed(2));
    const sello = estado === 'VALIDADO' ? `MH-${exp.codigo}-${String(index + 1).padStart(4, '0')}` : null;
    return {
      id: index + 1,
      expediente_id: exp.id,
      tipo: index % 2 === 0 ? 'FACTURA' : 'COMPROBANTE_CREDITO_FISCAL',
      tipo_dte: index % 2 === 0 ? 'FACTURA' : 'COMPROBANTE_CREDITO_FISCAL',
      numero_control: `DTE-01-S001P001-${String(index + 1).padStart(15, '0')}`,
      codigo_generacion: `MOCK-${exp.codigo}-${String(index + 1).padStart(4, '0')}`,
      sello_recepcion: sello,
      sello_hacienda: sello,
      estado,
      total_gravado: Number((total / 1.13).toFixed(2)),
      total_iva: Number((total - total / 1.13).toFixed(2)),
      total,
      descripcion: index % 5 === 1 ? 'Servicio de agencia aduanal con dato incompleto' : 'Servicios logisticos y tramite aduanal',
      motivo_rechazo: estado === 'RECHAZADO' ? 'Hacienda rechazo el DTE: NIT receptor no coincide con el expediente.' : '',
      error_hacienda: estado === 'RECHAZADO' ? 'NIT receptor no coincide con el expediente.' : '',
      fecha: exp.fecha_actualizacion,
      fecha_emision: exp.fecha_actualizacion,
      fecha_validacion: estado === 'VALIDADO' ? addDays(new Date(exp.fecha_actualizacion), 1).toISOString() : null,
      creado_en: exp.fecha_actualizacion,
      intentos: estado === 'RECHAZADO' ? 1 : 0,
      forzar_rechazo: false
    };
  });
}

function trackingFor(exp) {
  const base = new Date(exp.fecha_creacion);
  const template = [
    ['Expediente registrado', 'Registrado', 'Recepcion documental', 0],
    ['Contenedor zarpe', 'En Auditoria', 'Puerto de origen', 3],
    ['Llegada a puerto', 'En Auditoria', 'Puerto de Acajutla', 7],
    ['En aduana', 'Documentacion Aprobada', exp.aduana_ingreso, 10],
    ['Liberado por aduana', 'Liberado', exp.ubicacion_actual, 14],
    ['Entregado al cliente', 'Entregado', 'Destino final', 18]
  ];

  const currentIndex = exp.estado === 'Observado' ? 3 : Math.max(0, template.findIndex((item) => item[1] === exp.estado));
  const events = template.slice(0, currentIndex + 1);
  if (exp.estado === 'Observado') {
    events.push(['Documento observado', 'Observado', exp.aduana_ingreso, 12]);
  }

  return events.map(([evento, estado, ubicacion, day], index) => ({
    id: exp.id * 100 + index + 1,
    expediente_id: exp.id,
    codigo: exp.codigo,
    evento,
    estado,
    ubicacion,
    fecha_evento: addDays(base, day).toISOString(),
    publico: true
  }));
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ mensaje: 'Token requerido.' });

  try {
    req.user = jwt.verify(token, JWT_SECRET, {
      issuer: 'digiaduana-mock',
      audience: 'digiaduana-frontend'
    });
    const currentUser = db.usuarios.find((item) => item.id_usuario === Number(req.user.id_usuario || req.user.id));
    if (!currentUser) return res.status(401).json({ mensaje: 'Usuario de token no existe.' });
    if (currentUser.estado === 'pendiente_verificacion') return res.status(403).json({ mensaje: 'Verifica tu cuenta primero', estado: currentUser.estado });
    if (currentUser.estado === 'suspendido') return res.status(403).json({ mensaje: 'Cuenta suspendida. Contacte al administrador.', estado: currentUser.estado });
    if (currentUser.estado !== 'activo' || !currentUser.activo) return res.status(403).json({ mensaje: 'Usuario sin acceso activo.', estado: currentUser.estado });
    return next();
  } catch {
    return res.status(401).json({ mensaje: 'Token invalido o expirado.' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.rol)) {
      return res.status(403).json({ mensaje: 'No autorizado para este recurso.' });
    }
    return next();
  };
}

function simulateNetwork(req, res, next) {
  const delay = random(MIN_DELAY, MAX_DELAY);
  setTimeout(() => {
    const stableEndpoint = req.path === '/health' || req.path === '/_reset' || req.path === '/verificar' || req.path === '/validar-cuenta' || req.path === '/reenviar-codigo' || req.path.startsWith('/auth') || req.path.startsWith('/tracking');
    if (!stableEndpoint && Math.random() < ERROR_RATE) {
      return res.status(503).json({ mensaje: 'Error temporal simulado. Intenta nuevamente.' });
    }
    return next();
  }, delay);
}

function logRequests(req, res, next) {
  const started = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - started;
    const entry = {
      id: requestLogs.length + 1,
      metodo: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duracion_ms: duration,
      fecha: new Date().toISOString(),
      usuario_id: req.user?.id_usuario || null
    };
    requestLogs.push(entry);
    console.info(`[mock] ${entry.metodo} ${entry.url} ${entry.status} ${entry.duracion_ms}ms`);
  });
  next();
}

function visibleExpedientes(userPayload) {
  if (userPayload.rol === ROLES.CLIENTE) {
    return db.expedientes.filter((item) => item.cliente_id === userPayload.cliente_id);
  }
  return db.expedientes;
}

function visibleDocumentos(userPayload) {
  const expedienteIds = new Set(visibleExpedientes(userPayload).map((item) => item.id));
  return db.documentos.filter((item) => expedienteIds.has(item.expediente_id));
}

function visibleDtes(userPayload) {
  const expedienteIds = new Set(visibleExpedientes(userPayload).map((item) => item.id));
  return db.dtes.filter((item) => expedienteIds.has(item.expediente_id));
}

function findVisibleExpediente(idOrCode, userPayload) {
  const expediente = visibleExpedientes(userPayload).find(
    (item) => String(item.id) === String(idOrCode) || item.codigo.toLowerCase() === String(idOrCode).toLowerCase()
  );
  return expediente || null;
}

function expedienteListDTO(exp) {
  const cliente = findCliente(exp.cliente_id);
  return {
    id: exp.id,
    codigo: exp.codigo,
    cliente_id: exp.cliente_id,
    cliente: cliente?.nombre || 'Cliente no disponible',
    tipo_operacion: exp.tipo_operacion,
    regimen: exp.regimen,
    estado: exp.estado,
    ubicacion_actual: exp.ubicacion_actual,
    fecha_creacion: exp.fecha_creacion,
    fecha_actualizacion: exp.fecha_actualizacion,
    valor_fob: exp.valor_fob,
    peso_kg: exp.peso_kg
  };
}

function expedienteDetailDTO(exp) {
  return {
    ...expedienteListDTO(exp),
    aduana_ingreso: exp.aduana_ingreso,
    aduana_salida: exp.aduana_salida,
    descripcion: exp.descripcion,
    documentos: db.documentos.filter((item) => item.expediente_id === exp.id).map(documentoDTO),
    tracking: db.tracking_events
      .filter((item) => item.expediente_id === exp.id)
      .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento))
  };
}

function documentoDTO(doc) {
  const expediente = findExpediente(doc.expediente_id);
  const subidoPor = findUser(doc.subido_por);
  const validadoPor = findUser(doc.validado_por);
  const estado = normalizeDocumentStatus(doc.estado);
  return {
    id: doc.id,
    expediente_id: doc.expediente_id,
    expediente: expediente?.codigo || '',
    cliente: findCliente(expediente?.cliente_id)?.nombre || '',
    tipo: doc.tipo,
    tipo_documento: doc.tipo,
    nombre: doc.nombre,
    descripcion: doc.descripcion || '',
    estado,
    url: doc.url,
    fecha_carga: doc.fecha_carga || doc.fecha_subida,
    fecha_subida: doc.fecha_subida || doc.fecha_carga,
    subido_por: doc.subido_por,
    subido_por_nombre: subidoPor?.nombre || 'Usuario DigiAduana',
    validado_por: doc.validado_por,
    validado_por_nombre: validadoPor?.nombre || '',
    fecha_validacion: doc.fecha_validacion || null,
    observacion: doc.observacion || doc.observaciones || '',
    observaciones: doc.observacion || doc.observaciones || '',
    mime_type: doc.mime_type || 'application/pdf',
    tamano_bytes: doc.tamano_bytes || 0,
    origen_integracion: doc.origen_integracion || 'Carga manual',
    canal_integracion: doc.canal_integracion || 'web',
    codigo_externo: doc.codigo_externo || `DOC-${doc.id}`
  };
}

function dteDTO(dte) {
  const expediente = findExpediente(dte.expediente_id);
  const estado = normalizeDteStatus(dte.estado);
  return {
    id: dte.id,
    expediente_id: dte.expediente_id,
    expediente: expediente?.codigo || '',
    cliente: findCliente(expediente?.cliente_id)?.nombre || 'Cliente',
    tipo: dte.tipo,
    tipo_dte: dte.tipo_dte || dte.tipo,
    numero_control: dte.numero_control,
    numero_dte: dte.numero_control,
    codigo_generacion: dte.codigo_generacion,
    sello_recepcion: dte.sello_recepcion,
    sello_hacienda: dte.sello_hacienda || dte.sello_recepcion,
    estado,
    total_gravado: dte.total_gravado,
    total_iva: dte.total_iva,
    total: dte.total,
    monto: dte.total,
    descripcion: dte.descripcion || '',
    motivo_rechazo: dte.motivo_rechazo || dte.error_hacienda || '',
    error_hacienda: dte.error_hacienda || dte.motivo_rechazo || '',
    fecha: dte.fecha || dte.fecha_emision,
    fecha_emision: dte.fecha_emision || dte.fecha,
    fecha_validacion: dte.fecha_validacion || null,
    creado_en: dte.creado_en || dte.fecha_emision,
    intentos: dte.intentos || 0,
    ultimo_envio: dte.ultimo_envio || null
  };
}

function publicUser(userRecord) {
  const { password_hash, verification_token, verification_code, verification_expires_at, ...safeUser } = userRecord;
  return safeUser;
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function issueVerificationChallenge(userRecord) {
  userRecord.verification_token = generateVerificationToken();
  userRecord.verification_code = generateVerificationCode();
  userRecord.verification_expires_at = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
}

function logVerificationEmail(userRecord) {
  const tokenLink = `${FRONTEND_URL}/verificar-cuenta?token=${userRecord.verification_token}`;
  const validateLink = `${FRONTEND_URL}/validate?email=${encodeURIComponent(userRecord.correo)}`;

  console.info('\n[DigiAduana correo simulado]');
  console.info(`Para: ${userRecord.correo}`);
  console.info(`Asunto: Activa tu cuenta DigiAduana`);
  console.info(`Codigo de verificacion: ${userRecord.verification_code}`);
  console.info(`Enlace de validacion: ${validateLink}`);
  console.info(`Enlace alternativo por token: ${tokenLink}`);
  console.info(`Expira: ${userRecord.verification_expires_at}\n`);
}

function validateExpediente(body) {
  if (!body.cliente_id) return 'cliente_id es obligatorio.';
  if (!body.tipo_operacion || !TIPOS_OPERACION.includes(body.tipo_operacion)) return 'tipo_operacion no es valido.';
  if (!body.regimen || String(body.regimen).trim().length < 4) return 'regimen es obligatorio.';
  if (body.aduana_ingreso && String(body.aduana_ingreso).trim().length < 4) return 'aduana_ingreso debe ser clara.';
  if (body.descripcion && String(body.descripcion).trim().length > 500) return 'descripcion no puede exceder 500 caracteres.';
  return '';
}

function buildExpedientesCacheKey(req) {
  return JSON.stringify({
    user: req.user.id_usuario,
    rol: req.user.rol,
    cliente_id: req.user.cliente_id || null,
    query: req.query
  });
}

function getCache(key) {
  const record = cache.get(key);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    cache.delete(key);
    return null;
  }
  return record.value;
}

function setCache(key, value, ttlMs) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function addAuditLog(tipo, usuario_id, mensaje) {
  requestLogs.push({
    id: requestLogs.length + 1,
    metodo: 'AUDIT',
    url: tipo,
    status: 200,
    duracion_ms: 0,
    fecha: new Date().toISOString(),
    usuario_id,
    mensaje
  });
}

function findCliente(id) {
  return db.clientes.find((item) => item.id_cliente === Number(id));
}

function findUser(id) {
  return db.usuarios.find((item) => item.id_usuario === Number(id));
}

function findExpediente(id) {
  return db.expedientes.find((item) => item.id === Number(id));
}

function normalizeDocumentStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  if (['APROBADO', 'FINALIZADO', 'VALIDADA'].includes(value)) return 'VALIDADO';
  if (['OBSERVADO', 'RECHAZADA'].includes(value)) return 'RECHAZADO';
  if (['RECIBIDO', 'EMITIDO', 'EN_REVISION', 'EN REVISION'].includes(value)) return 'PENDIENTE';
  return ['VALIDADO', 'RECHAZADO', 'PENDIENTE'].includes(value) ? value : 'PENDIENTE';
}

function normalizeDteStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  if (['VALIDADO', 'VALIDADA', 'PROCESADO'].includes(value)) return 'VALIDADO';
  if (['RECHAZADO', 'RECHAZADA', 'ERROR'].includes(value)) return 'RECHAZADO';
  return 'PENDIENTE';
}

function roleLabel(rol) {
  return {
    [ROLES.ADMIN]: 'Administrador del Sistema',
    [ROLES.FORWARDER]: 'Freight Forwarder',
    [ROLES.SUPERVISOR]: 'Supervisor de Operaciones',
    [ROLES.CLIENTE]: 'Cliente',
    [ROLES.SOPORTE]: 'Soporte Tecnico'
  }[rol] || rol;
}

function filterEquals(value, expected) {
  if (!expected) return true;
  return String(value).toLowerCase() === String(expected).toLowerCase();
}

function filterCliente(exp, expected) {
  if (!expected) return true;
  const cliente = findCliente(exp.cliente_id);
  return String(exp.cliente_id) === String(expected) || String(cliente?.nombre || '').toLowerCase().includes(String(expected).toLowerCase());
}

function sortBy(sortExpression) {
  const desc = String(sortExpression).startsWith('-');
  const field = desc ? String(sortExpression).slice(1) : String(sortExpression);
  return (a, b) => {
    if (a[field] === b[field]) return 0;
    const result = a[field] > b[field] ? 1 : -1;
    return desc ? -result : result;
  };
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    acc[item[field]] = (acc[item[field]] || 0) + 1;
    return acc;
  }, {});
}

function sum(items, field) {
  return items.reduce((total, item) => total + Number(item[field] || 0), 0);
}

function integration(nombre, estado, minLatency, maxLatency) {
  return {
    nombre,
    estado,
    latencia_ms: random(minLatency, maxLatency),
    ultima_revision: new Date(Date.now() - random(1, 20) * 60_000).toISOString()
  };
}

function nextId(items, field = 'id') {
  return Math.max(0, ...items.map((item) => Number(item[field] || 0))) + 1;
}

function nextExpedienteCode() {
  return `EXP-2026-${String(nextId(db.expedientes)).padStart(4, '0')}`;
}

function relativeDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(random(8, 17), random(0, 59), 0, 0);
  return date;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  copy.setHours(copy.getHours() + random(0, 3));
  return copy;
}

function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function sanitizeFilename(name) {
  return String(name || 'archivo').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mockFileContent(documento) {
  const dto = documentoDTO(documento);
  return [
    'DIGIADUANA - DOCUMENTO SIMULADO',
    `Documento: ${dto.nombre}`,
    `Tipo: ${dto.tipo}`,
    `Expediente: ${dto.expediente}`,
    `Estado: ${dto.estado}`,
    `Subido por: ${dto.subido_por_nombre}`,
    `Fecha: ${dto.fecha_subida}`
  ].join('\n');
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.info(`DigiAduana Mock API listo en http://localhost:${PORT}`);
  });
}

module.exports = { app, router, buildSeed };
