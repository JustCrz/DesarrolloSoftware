const express = require('express');
const router = express.Router();
const providersController = require('../controllers/providers.controller');
const multer = require('multer');
const path = require('path');

// 1. Configuración de almacenamiento para los Logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista en la raíz de tu backend
  },
  filename: (req, file, cb) => {
    // Generamos un nombre único: timestamp + extensión original
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// --- RUTAS ---

// Obtener todos
router.get('/', providersController.getProviders);

// Registrar nuevo (Aquí añadimos el middleware para procesar el 'Logo')
// El nombre 'Logo' debe coincidir con el formData.append('Logo', ...) del frontend
router.post('/', upload.single('Logo'), providersController.addProvider);

// Actualizar datos (También permitimos actualizar el logo si es necesario)
router.put('/:id', upload.single('Logo'), providersController.updateProvider);

// Eliminar
router.delete('/:id', providersController.deleteProvider);

module.exports = router;