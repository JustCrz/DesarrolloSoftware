const express = require('express');
const router = express.Router();
const providersController = require('../controllers/providers.controller');

<<<<<<< HEAD
// Obtener todos
router.get('/', providersController.getProviders);

// Registrar nuevo
router.post('/', providersController.addProvider);

// Actualizar datos
router.put('/:id', providersController.updateProvider);

// Eliminar
router.delete('/:id', providersController.deleteProvider);

module.exports = router;
=======
router.get('/', providersController.getProviders);
router.post('/', providersController.addProvider);
router.delete('/:id', providersController.deleteProvider);

module.exports = router;
>>>>>>> origin/main
