const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const controller = require('../controllers/authController');

router.post('/login', controller.login);
router.post('/registro', (req, res) => {
  res.status(403).json({
    mensaje: 'El registro publico esta deshabilitado. Solo el Administrador del Sistema puede crear usuarios.'
  });
});
router.post('/verify', controller.verificarCodigo);
router.post('/verificar-correo', controller.verificarCodigo);
router.post('/reenviar-codigo', controller.reenviarCodigo);
router.get('/verify', controller.verificarCorreo);
router.get('/verificar-correo', controller.verificarCorreo);
router.get('/perfil', auth, controller.perfil);

module.exports = router;
