import express from 'express';
import * as paisesController from '../controllers/paisesController.js';  // ← Cambiado

const router = express.Router();

// Rutas específicas PRIMERO
router.get('/buscar', paisesController.buscarPais);
router.get('/estadisticas', paisesController.getEstadisticas);
router.get('/continente/:continente', paisesController.getPaisesByContinente);

// Rutas CRUD estándar
router.get('/', paisesController.getPaises);
router.get('/:id', paisesController.getPais);
router.post('/', paisesController.createPais);
router.put('/:id', paisesController.updatePais);
router.delete('/:id', paisesController.deletePais);

export default router;