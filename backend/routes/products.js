const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productsController = require('../controllers/products.controller');

// Configuracion Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await productsController.getAllProducts();
    res.json({ ok: true, products });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener productos' });
  }
});

router.get('/with-providers', async (req, res) => {
  try {
    const products = await productsController.getProductsWithProviders();
    res.json({ ok: true, products });
  } catch (err) {
    console.error('Error al obtener productos con proveedores:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener productos con proveedores' });
  }
});

// Agregar nuevo producto
router.post('/', upload.single('Imagen'), async (req, res) => {
  try {
    const product = await productsController.addProduct(
      req.body,
      req.file ? req.file.filename : null
    );
    res.json({
      ok: true,
      message: 'Producto agregado correctamente',
      product
    });
  } catch (err) {
    if (err.message === 'Faltan campos obligatorios') {
      return res.status(400).json({ ok: false, message: err.message });
    }
    console.error('Error al agregar producto:', err);
    res.status(500).json({ ok: false, message: 'Error al agregar producto' });
  }
});

// Editar producto
router.put('/:id', upload.single('Imagen'), async (req, res) => {
  const { id } = req.params;
  try {
    await productsController.updateProduct(
      id,
      req.body,
      req.file ? req.file.filename : null
    );
    res.json({ ok: true, message: 'Producto actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ ok: false, message: 'Error al actualizar producto' });
  }
});

// Eliminar un producto por Id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const affectedRows = await productsController.deleteProduct(id);
    if (affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }
    res.json({ ok: true, message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ ok: false, message: 'Error al eliminar producto' });
  }
});

module.exports = router;
