const express = require('express');
const router = express.Router();

let ventas = [];

// Obtener ventas
router.get('/', (req, res) => {
  res.json(ventas);
});

// Registrar venta
router.post('/', (req, res) => {
  const venta = { id: Date.now(), ...req.body };
  ventas.push(venta);
  res.status(201).json({ ok: true, savedSales: [venta] });
});

module.exports = router;
