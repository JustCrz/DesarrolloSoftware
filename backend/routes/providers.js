const express = require('express');
const router = express.Router();

let proveedores = [];

// GET
router.get('/', (req, res) => {
  res.json(proveedores);
});

// POST
router.post('/', (req, res) => {
  const nuevo = { id: Date.now(), ...req.body };
  proveedores.push(nuevo);
  res.status(201).json(nuevo);
});

// DELETE
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  proveedores = proveedores.filter(p => p.id !== id);
  res.json({ ok: true });
});

module.exports = router;
