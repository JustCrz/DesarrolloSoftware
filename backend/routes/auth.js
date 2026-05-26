const express = require('express'); 
const router = express.Router();    

// Importamos el controlador
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route POST /api/auth/login
 * @desc  Ruta para iniciar sesión delegando la lógica al controlador
 */
router.post('/login', authController.authlogin);
router.get('/me', authenticate, authController.me);

module.exports = router;
