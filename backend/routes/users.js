const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');

// Rutas llamando a las funciones del controlador
router.get('/', usersController.getAllUsers);
router.post('/register', usersController.registerUser);
router.delete('/:id', usersController.deleteUser); 

module.exports = router;
