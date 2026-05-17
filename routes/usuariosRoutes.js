const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const roles = require('../middlewares/roleMiddleware');
const controller = require('../controllers/usuariosController');

router.use(auth, roles('ADMINISTRADOR'));
router.get('/roles', controller.roles);
router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.patch('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;
