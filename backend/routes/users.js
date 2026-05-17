const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');

// Rutas existentes
router.get('/', usersController.getAllUsers);
router.post('/register', usersController.registerUser);

// --- NUEVA RUTA PARA ACTUALIZAR PERFIL ---
// Esta ruta coincide con el fetch(`${API_BASE}/api/users/update`...) de tu frontend
router.put('/update', usersController.updateUser); 

// Ruta para eliminar
router.delete('/:id', usersController.deleteUser); 

module.exports = router;