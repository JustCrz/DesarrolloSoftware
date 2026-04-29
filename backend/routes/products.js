const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

router.get('/', productsController.getProducts);
router.get('/with-providers', productsController.getProductsWithProviders);
router.post('/', upload.single('Imagen'), productsController.addProduct);
router.put('/:id', upload.single('Imagen'), productsController.updateProductController);
router.delete('/:id', productsController.deleteProduct);

module.exports = router;
