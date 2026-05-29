const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const productsController = require('../controllers/products.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', productsController.getAllProducts);
router.get('/buscar', async (req, res) => {
  const { q } = req.query;
  try {
    const [rows] = await require('../bd').query(
      'SELECT IdProducto, Nombre, Precio, Stock, Imagen, EnPromocion, PrecioOferta FROM producto WHERE Nombre LIKE ?',
      [`%${q}%`]
    );
    res.json({ ok: true, products: rows });
  } catch(err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
router.get('/with-providers', productsController.getProductsWithProviders);
router.post('/', upload.single('Imagen'), productsController.addProduct);
router.put('/:id', upload.single('Imagen'), productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

module.exports = router;