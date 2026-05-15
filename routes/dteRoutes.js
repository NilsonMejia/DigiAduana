const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/dteController');

router.use(auth);
router.get('/', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER'), controller.listar);
router.post('/', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER'), controller.emitir);
router.post('/:id/validar-hacienda', roles('ADMINISTRADOR', 'SUPERVISOR'), controller.validarHacienda);
router.patch('/:id/invalidar', roles('ADMINISTRADOR', 'SUPERVISOR'), controller.invalidar);

module.exports = router;
