const express = require('express');
const router = express.Router();
const { getAllUsersController, registerUserController, deleteUserController } = require('../controllers/users.controller');

// Rutas llamando a las funciones del controlador
router.get('/', getAllUsersController);
router.post('/register', registerUserController);
router.delete('/:id', deleteUserController);

module.exports = router;
