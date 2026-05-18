const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/clientesController');

router.use(auth);
router.get('/', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER', 'CLIENTE', 'SOPORTE_TECNICO'), controller.listar);

module.exports = router;
