const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

exports.notificaciones = asyncHandler(async (req, res) => {
  const [docs] = await pool.query(
    `SELECT d.id, d.estado_validacion, d.tipo_documento, d.creado_en, e.codigo
     FROM documentos d
     JOIN expedientes_aduanales e ON e.id = d.expediente_id
     WHERE d.estado_validacion <> 'VALIDADO'
     ORDER BY d.creado_en DESC
     LIMIT 12`
  );

  res.json({
    data: docs.map((doc) => ({
      id: doc.id,
      tipo: doc.estado_validacion === 'RECHAZADO' ? 'danger' : 'warning',
      titulo: `Documento ${doc.estado_validacion.toLowerCase()}`,
      mensaje: `${doc.tipo_documento} en expediente ${doc.codigo}`,
      fecha: doc.creado_en
    }))
  });
});

exports.configuracion = asyncHandler(async (req, res) => {
  res.json({
    sistema: {
      nombre: 'DigiAduana',
      entorno: process.env.NODE_ENV || 'development',
      max_pdf_mb: Number(process.env.MAX_PDF_MB || 10)
    },
    integraciones: [
      { nombre: 'Ministerio de Hacienda', estado: 'online', latencia_ms: 180, ultima_revision: new Date().toISOString() },
      { nombre: 'Navieras', estado: 'online', latencia_ms: 260, ultima_revision: new Date().toISOString() },
      { nombre: 'Correo transaccional', estado: process.env.RESEND_API_KEY ? 'online' : 'pendiente', latencia_ms: 0, ultima_revision: new Date().toISOString() }
    ],
    parametros: [
      { clave: 'jwt_expiracion', valor: process.env.JWT_EXPIRES_IN || '8h' },
      { clave: 'validacion_correo', valor: 'activa' },
      { clave: 'tracking_publico', valor: 'activo' }
    ]
  });
});

exports.backups = asyncHandler(async (req, res) => {
  const data = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    nombre: `backup-digiaduana-${String(index + 1).padStart(2, '0')}.sql.gz`,
    estado: index === 0 ? 'COMPLETADO' : 'PROGRAMADO',
    tamano_mb: 220 + index * 27,
    fecha: new Date(Date.now() - index * 86400000).toISOString(),
    retencion_dias: 30
  }));
  res.json({ data, total: data.length, proximo: new Date(Date.now() + 86400000).toISOString() });
});

exports.sesiones = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.correo, r.nombre AS rol, u.ultimo_acceso
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.estado = 'ACTIVO'
     ORDER BY u.ultimo_acceso DESC, u.id`
  );
  res.json({
    data: rows.map((row, index) => ({
      id: row.id,
      usuario: row.nombre,
      correo: row.correo,
      rol: row.rol,
      ip: `192.168.1.${20 + index}`,
      inicio: row.ultimo_acceso || new Date().toISOString(),
      expira_en_min: 45 + index * 6
    }))
  });
});

exports.logs = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, accion, entidad, entidad_id, detalle, usuario_id, creado_en
     FROM bitacora_sistema
     ORDER BY creado_en DESC
     LIMIT 100`
  );
  res.json({
    data: rows.map((row) => ({
      id: row.id,
      metodo: 'AUDIT',
      url: `${row.accion}:${row.entidad}`,
      status: 200,
      duracion_ms: 0,
      fecha: row.creado_en,
      usuario_id: row.usuario_id,
      mensaje: row.detalle || `${row.accion} ${row.entidad_id || ''}`.trim()
    }))
  });
});
