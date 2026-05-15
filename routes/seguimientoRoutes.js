const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/seguimientoController');

router.get('/publico/:codigo', controller.trackingPublico);
router.get('/naviera/:contenedor', controller.consultarNaviera);
router.get('/expediente/:expedienteId', auth, roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER', 'CLIENTE', 'SOPORTE_TECNICO'), controller.historial);

module.exports = router;
