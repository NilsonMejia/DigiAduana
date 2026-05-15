const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const controller = require('../controllers/authController');

router.post('/login', controller.login);
router.post('/registro', controller.registro);
router.get('/perfil', auth, controller.perfil);

module.exports = router;
