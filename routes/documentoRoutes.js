const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const controller = require('../controllers/documentoController');

router.use(auth);
router.get('/', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER', 'CLIENTE', 'SOPORTE_TECNICO'), controller.listar);
router.get('/expediente/:expedienteId', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER', 'CLIENTE', 'SOPORTE_TECNICO'), controller.listarPorExpediente);
router.post('/', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER'), upload.single('pdf'), controller.subir);
router.patch('/:id/validar', roles('ADMINISTRADOR', 'SUPERVISOR'), controller.validar);
router.delete('/:id', roles('ADMINISTRADOR', 'SUPERVISOR', 'FREIGHT_FORWARDER'), controller.eliminar);

module.exports = router;
