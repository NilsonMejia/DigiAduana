const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/notificacionesController');

router.use(auth, roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER', 'SOPORTE_TECNICO', 'SOPORTE'));
router.get('/', controller.listar);

module.exports = router;
