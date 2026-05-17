const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/operacionesController');

router.use(auth);
router.get('/notificaciones', roles('ADMINISTRADOR', 'SUPERVISOR', 'SOPORTE_TECNICO'), controller.notificaciones);
router.get('/configuracion', roles('ADMINISTRADOR'), controller.configuracion);
router.get('/backups', roles('ADMINISTRADOR'), controller.backups);
router.get('/sesiones', roles('ADMINISTRADOR', 'SOPORTE_TECNICO'), controller.sesiones);
router.get('/logs', roles('ADMINISTRADOR', 'SOPORTE_TECNICO'), controller.logs);

module.exports = router;
