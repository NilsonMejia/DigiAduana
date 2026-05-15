const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');

const ESTADOS = ['BORRADOR', 'EN_REVISION', 'OBSERVADO', 'APROBADO', 'RECHAZADO', 'FINALIZADO'];

function clienteScope(req) {
  return req.user.rol === 'CLIENTE' ? [req.user.cliente_id] : null;
}

exports.listar = asyncHandler(async (req, res) => {
  const scope = clienteScope(req);
  const params = [];
  let where = 'WHERE 1=1';

  if (scope) {
    where += ' AND e.cliente_id = ?';
    params.push(scope[0]);
  }
  if (req.query.estado) {
    where += ' AND e.estado = ?';
    params.push(req.query.estado);
  }

  const [rows] = await pool.query(
    `SELECT e.*, c.nombre AS cliente, u.nombre AS responsable
     FROM expedientes_aduanales e
     JOIN clientes c ON c.id = e.cliente_id
     LEFT JOIN usuarios u ON u.id = e.responsable_id
     ${where}
     ORDER BY e.actualizado_en DESC`,
    params
  );
  res.json(rows);
});

exports.obtener = asyncHandler(async (req, res) => {
  const params = [req.params.id];
  let scopeSql = '';
  if (req.user.rol === 'CLIENTE') {
    scopeSql = ' AND e.cliente_id = ?';
    params.push(req.user.cliente_id);
  }

  const [[expediente]] = await pool.query(
    `SELECT e.*, c.nombre AS cliente
     FROM expedientes_aduanales e
     JOIN clientes c ON c.id = e.cliente_id
     WHERE e.id = ? ${scopeSql}`,
    params
  );
  if (!expediente) return res.status(404).json({ mensaje: 'Expediente no encontrado' });
  res.json(expediente);
});

exports.crear = asyncHandler(async (req, res) => {
  const {
    cliente_id,
    tipo_operacion,
    regimen,
    aduana_ingreso,
    aduana_salida,
    descripcion,
    responsable_id
  } = req.body;

  if (!cliente_id || !tipo_operacion || !regimen) {
    return res.status(400).json({ mensaje: 'Cliente, tipo de operacion y regimen son requeridos' });
  }

  const codigo = `EXP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const [result] = await pool.query(
    `INSERT INTO expedientes_aduanales
     (codigo, cliente_id, tipo_operacion, regimen, aduana_ingreso, aduana_salida, descripcion, responsable_id, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'BORRADOR')`,
    [codigo, cliente_id, tipo_operacion, regimen, aduana_ingreso, aduana_salida, descripcion, responsable_id || req.user.id]
  );

  await audit(req.user.id, 'CREAR', 'expedientes_aduanales', result.insertId, codigo, req);
  res.status(201).json({ id: result.insertId, codigo, estado: 'BORRADOR' });
});

exports.actualizar = asyncHandler(async (req, res) => {
  const campos = ['tipo_operacion', 'regimen', 'aduana_ingreso', 'aduana_salida', 'descripcion', 'responsable_id'];
  const sets = [];
  const values = [];

  campos.forEach((campo) => {
    if (req.body[campo] !== undefined) {
      sets.push(`${campo} = ?`);
      values.push(req.body[campo]);
    }
  });

  if (!sets.length) return res.status(400).json({ mensaje: 'No hay cambios para aplicar' });
  values.push(req.params.id);

  const [result] = await pool.query(
    `UPDATE expedientes_aduanales SET ${sets.join(', ')}, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );

  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Expediente no encontrado' });
  await audit(req.user.id, 'ACTUALIZAR', 'expedientes_aduanales', req.params.id, 'Datos generales actualizados', req);
  res.json({ mensaje: 'Expediente actualizado' });
});

exports.cambiarEstado = asyncHandler(async (req, res) => {
  const { estado, comentario } = req.body;
  if (!ESTADOS.includes(estado)) return res.status(400).json({ mensaje: 'Estado no valido' });

  const [[expediente]] = await pool.query('SELECT estado FROM expedientes_aduanales WHERE id = ?', [req.params.id]);
  if (!expediente) return res.status(404).json({ mensaje: 'Expediente no encontrado' });

  if (estado === 'APROBADO') {
    const [[pendientes]] = await pool.query(
      `SELECT COUNT(*) AS total FROM documentos
       WHERE expediente_id = ? AND estado_validacion IN ('PENDIENTE', 'RECHAZADO')`,
      [req.params.id]
    );
    if (pendientes.total > 0) {
      return res.status(409).json({ mensaje: 'No se puede aprobar con documentos pendientes o rechazados' });
    }
  }

  await pool.query('UPDATE expedientes_aduanales SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [estado, req.params.id]);
  await pool.query(
    `INSERT INTO historial_tracking (expediente_id, estado, comentario, usuario_id)
     VALUES (?, ?, ?, ?)`,
    [req.params.id, estado, comentario || `Cambio de estado: ${expediente.estado} -> ${estado}`, req.user.id]
  );
  await audit(req.user.id, 'CAMBIAR_ESTADO', 'expedientes_aduanales', req.params.id, estado, req);
  res.json({ mensaje: 'Estado actualizado', estado });
});

exports.eliminar = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM expedientes_aduanales WHERE id = ? AND estado IN ("BORRADOR", "RECHAZADO")', [req.params.id]);
  if (!result.affectedRows) {
    return res.status(409).json({ mensaje: 'Solo se pueden eliminar expedientes en borrador o rechazados' });
  }
  await audit(req.user.id, 'ELIMINAR', 'expedientes_aduanales', req.params.id, 'Eliminacion logica/operativa', req);
  res.json({ mensaje: 'Expediente eliminado' });
});
