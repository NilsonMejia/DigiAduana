module.exports = (...rolesPermitidos) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ mensaje: 'Autenticacion requerida' });
  }

  if (!rolesPermitidos.includes(req.user.rol)) {
    return res.status(403).json({ mensaje: 'No tiene permisos para esta operacion' });
  }

  return next();
};
