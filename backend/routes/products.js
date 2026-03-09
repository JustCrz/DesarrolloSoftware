const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
<<<<<<< HEAD
const fs = require('fs');
const productsController = require('../controllers/products.controller');


// Configuración de Multer (se queda aquí por ser configuración de ruta/middleware)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Definición de Rutas
router.get('/', productsController.getAllProducts);
router.get('/with-providers', productsController.getProductsWithProviders);
router.post('/', upload.single('Imagen'), productsController.addProduct); // Antes era createProduct
router.put('/:id', upload.single('Imagen'), productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

module.exports = router;
=======
const productsController = require('../controllers/products.controller');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads'); // Sube un nivel y entra a uploads
    // Verificar si la carpeta existe, si no, crearla
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); 
  }
});
const upload = multer({ storage });

router.get('/', productsController.getAllProducts);
router.get('/with-providers', productsController.getProductsWithProviders);
router.post('/', upload.single('Imagen'), productsController.addProduct);
router.put('/:id', upload.single('Imagen'), productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

module.exports = router;
>>>>>>> origin/main
