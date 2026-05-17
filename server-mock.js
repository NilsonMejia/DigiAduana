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
 *   admin@digiaduana.local / admin123
 *   forwarder@digiaduana.local / forwarder123
 *   supervisor@digiaduana.local / supervisor123
 *   cliente@digiaduana.local / cliente123
 *   soporte@digiaduana.local / soporte123
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

const app = express();
const router = express.Router();

const PORT = Number(process.env.MOCK_PORT || 3000);
const JWT_SECRET = process.env.MOCK_JWT_SECRET || 'digiaduana-secret-key';
const MIN_DELAY = Number(process.env.MOCK_MIN_DELAY || 200);
const MAX_DELAY = Number(process.env.MOCK_MAX_DELAY || 800);
const ERROR_RATE = Number(process.env.MOCK_ERROR_RATE ?? 0.05);
const CACHE_TTL_MS = 10_000;

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
      cliente_id: user.cliente_id || null
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
    .map((documento) => ({
      id: documento.id,
      tipo: documento.tipo,
      nombre: documento.nombre,
      estado: documento.estado,
      url: documento.url,
      fecha_carga: documento.fecha_carga
    }));

  res.json({ expediente_id: expediente.id, documentos });
});

router.post('/expedientes/:id/documentos', authenticate, (req, res) => {
  const expediente = findVisibleExpediente(req.params.id, req.user);
  if (!expediente) return res.status(404).json({ mensaje: 'Expediente no encontrado o sin acceso.' });

  const { tipo, nombre, descripcion } = req.body;
  if (!tipo || !nombre) {
    return res.status(400).json({ mensaje: 'tipo y nombre son obligatorios para el documento.' });
  }

  const nuevoDocumento = {
    id: nextId(db.documentos),
    expediente_id: expediente.id,
    tipo: String(tipo).trim(),
    nombre: String(nombre).trim(),
    descripcion: String(descripcion || '').trim(),
    estado: 'RECIBIDO',
    url: `/uploads/mock/${expediente.codigo}/${String(nombre).replace(/[^a-zA-Z0-9._-]/g, '_')}`,
    fecha_carga: new Date().toISOString()
  };

  db.documentos.push(nuevoDocumento);
  cache.clear();
  addAuditLog('expedientes.documentos.create', req.user.id_usuario, `Documento ${nuevoDocumento.nombre} para ${expediente.codigo}`);

  res.status(201).json({ mensaje: 'Documento simulado cargado correctamente.', documento: nuevoDocumento });
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

router.post('/usuarios', authenticate, authorize(ROLES.ADMIN), (req, res) => {
  const { nombre, correo, password, rol, cliente_id } = req.body;

  if (!nombre || !correo || !password || !rol) {
    return res.status(400).json({ mensaje: 'nombre, correo, password y rol son obligatorios.' });
  }

  if (!Object.values(ROLES).includes(rol)) {
    return res.status(400).json({ mensaje: 'Rol no permitido.' });
  }

  if (db.usuarios.some((item) => item.correo.toLowerCase() === String(correo).toLowerCase())) {
    return res.status(400).json({ mensaje: 'Ya existe un usuario con ese correo.' });
  }

  const user = {
    id_usuario: nextId(db.usuarios, 'id_usuario'),
    nombre,
    correo,
    rol,
    cliente_id: rol === ROLES.CLIENTE ? Number(cliente_id) || null : null,
    activo: true,
    password_hash: bcrypt.hashSync(String(password), 8),
    creado_en: new Date().toISOString()
  };

  db.usuarios.push(user);
  addAuditLog('usuarios.create', req.user.id_usuario, `Creado usuario ${correo}`);
  res.status(201).json(publicUser(user));
});

router.get('/logs', authenticate, authorize(ROLES.SOPORTE), (req, res) => {
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
    user(1, 'Admin Sistema', 'admin@digiaduana.local', 'admin123', ROLES.ADMIN),
    user(2, 'Valeria Menendez', 'forwarder@digiaduana.local', 'forwarder123', ROLES.FORWARDER),
    user(3, 'Mario Escobar', 'supervisor@digiaduana.local', 'supervisor123', ROLES.SUPERVISOR),
    user(4, 'Ana Morales', 'cliente@digiaduana.local', 'cliente123', ROLES.CLIENTE, 1),
    user(5, 'Diego Guardado', 'soporte@digiaduana.local', 'soporte123', ROLES.SOPORTE)
  ];

  const expedientes = Array.from({ length: 30 }, (_, index) => expediente(index + 1, clientes));
  const documentos = expedientes.flatMap((item) => documentosFor(item));
  const tracking_events = expedientes.flatMap((item) => trackingFor(item));

  return { clientes, usuarios, expedientes, documentos, tracking_events };
}

function user(id_usuario, nombre, correo, password, rol, cliente_id = null) {
  return {
    id_usuario,
    nombre,
    correo,
    rol,
    cliente_id,
    activo: true,
    password_hash: bcrypt.hashSync(password, 8),
    creado_en: relativeDate(80 - id_usuario).toISOString()
  };
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
  return [
    {
      id: exp.id * 10 + 1,
      expediente_id: exp.id,
      tipo: 'Factura comercial',
      nombre: `${exp.codigo}-factura.pdf`,
      estado: exp.estado === 'Registrado' ? 'RECIBIDO' : 'APROBADO',
      url: `/uploads/mock/${exp.codigo}/factura.pdf`,
      fecha_carga: addDays(base, 1).toISOString()
    },
    {
      id: exp.id * 10 + 2,
      expediente_id: exp.id,
      tipo: 'BL / Guia aerea',
      nombre: `${exp.codigo}-transporte.pdf`,
      estado: exp.estado === 'Observado' ? 'OBSERVADO' : 'APROBADO',
      url: `/uploads/mock/${exp.codigo}/transporte.pdf`,
      fecha_carga: addDays(base, 2).toISOString()
    },
    {
      id: exp.id * 10 + 3,
      expediente_id: exp.id,
      tipo: 'DUCA',
      nombre: `${exp.codigo}-duca.pdf`,
      estado: ['Liberado', 'Entregado'].includes(exp.estado) ? 'APROBADO' : 'PENDIENTE',
      url: `/uploads/mock/${exp.codigo}/duca.pdf`,
      fecha_carga: addDays(base, 4).toISOString()
    }
  ];
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
    const stableEndpoint = req.path === '/health' || req.path === '/_reset' || req.path.startsWith('/auth') || req.path.startsWith('/tracking');
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
    documentos: db.documentos.filter((item) => item.expediente_id === exp.id),
    tracking: db.tracking_events
      .filter((item) => item.expediente_id === exp.id)
      .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento))
  };
}

function publicUser(userRecord) {
  const { password_hash, ...safeUser } = userRecord;
  return safeUser;
}

function validateExpediente(body) {
  if (!body.cliente_id) return 'cliente_id es obligatorio.';
  if (!body.tipo_operacion || !TIPOS_OPERACION.includes(body.tipo_operacion)) return 'tipo_operacion no es valido.';
  if (!body.regimen || String(body.regimen).trim().length < 4) return 'regimen es obligatorio.';
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.info(`DigiAduana Mock API listo en http://localhost:${PORT}`);
  });
}

module.exports = { app, router, buildSeed };
