const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const productsController = require('../controllers/products.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Configuración de Multer (ruta/middleware)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});2
const upload = multer({ storage });

// Definición de Rutas
router.get('/', productsController.getAllProducts);
router.get('/with-providers', authenticate, requireRole('admin'), productsController.getProductsWithProviders);
router.post('/', authenticate, requireRole('admin'), upload.single('Imagen'), productsController.addProduct); // Antes era createProduct
router.put('/:id', authenticate, requireRole('admin'), upload.single('Imagen'), productsController.updateProduct);
router.delete('/:id', authenticate, requireRole('admin'), productsController.deleteProduct);

module.exports = router;
