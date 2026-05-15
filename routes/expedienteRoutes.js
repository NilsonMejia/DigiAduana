const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/expedienteController');

router.use(auth);
router.get('/', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER', 'CLIENTE', 'SOPORTE_TECNICO'), controller.listar);
router.get('/:id', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER', 'CLIENTE', 'SOPORTE_TECNICO'), controller.obtener);
router.post('/', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER'), controller.crear);
router.put('/:id', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER'), controller.actualizar);
router.patch('/:id/estado', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER'), controller.cambiarEstado);
router.delete('/:id', roles('ADMINISTRADOR', 'SUPERVISOR'), controller.eliminar);

module.exports = router;
