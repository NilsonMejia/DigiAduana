const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/reportesController');

router.use(auth, roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER'));
router.get('/dashboard', controller.dashboard);
router.get('/clientes', controller.operacionesPorCliente);

module.exports = router;
