const express = require('express');
const router = express.Router();
const providersController = require('../controllers/providers.controller');

// Obtener todos
router.get('/', providersController.getProviders);

// Registrar nuevo
router.post('/', providersController.addProvider);

// Actualizar datos
router.put('/:id', providersController.updateProvider);

// Eliminar
router.delete('/:id', providersController.deleteProvider);

module.exports = router;