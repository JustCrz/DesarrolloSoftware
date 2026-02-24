const express = require('express');
const router = express.Router();
const pool = require('../bd');
const providersController = require('../controllers/providers.controller')

// Obtener la lista de proveedores
router.get('/', async (req, res) => {
  try {
    const provider = await providersController.getProviders();
    res.json({ ok: true, provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener proveedores' });
  }
});

// Agregar un proveedor nuevo
router.post('/', async (req, res) => {
  try {
    await providersController.addProvider(req.body);
    res.status(201).json({ok: true});
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al agregar proveedor' });
  }
});

// Eliminar un proveedor
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await providersController.deleteProvider(id);
    res.json({ ok: true, message: 'Proveedor eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al eliminar proveedor' });
  }
});

module.exports = router;
