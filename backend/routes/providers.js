const express = require('express');
const router = express.Router();
const { getProviders, addProvider, updateProviderController, deleteProviderController } = require('../controllers/providers.controller');

// Obtener todos
router.get('/', getProviders);

// Registrar nuevo
router.post('/', addProvider);

// Actualizar datos
router.put('/:id', updateProviderController);

// Eliminar
router.delete('/:id', deleteProviderController);

module.exports = router;
