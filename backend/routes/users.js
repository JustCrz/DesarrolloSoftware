const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Rutas existentes
router.get('/', authenticate, requireRole('admin'), usersController.getAllUsers);
router.post('/register', usersController.registerUser);

// --- NUEVA RUTA PARA ACTUALIZAR PERFIL ---
// Esta ruta coincide con el fetch(`${API_BASE}/api/users/update`...) de tu frontend
router.put('/update', authenticate, usersController.updateUser); 
router.put('/update-profile', authenticate, usersController.updateUser); 

// Ruta para eliminar
router.delete('/:id', authenticate, requireRole('admin'), usersController.deleteUser); 

module.exports = router;
