const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataPath = path.join(__dirname, '../data/productos.json');

// Leer productos desde el archivo
function getProductos() {
  const data = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(data);
}

// Guardar productos
function saveProductos(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// GET - obtener todos los productos
router.get('/', (req, res) => {
  const productos = getProductos();
  res.json(productos);
});

// POST - agregar producto
router.post('/', (req, res) => {
  const productos = getProductos();
  const nuevo = { id: Date.now(), ...req.body };
  productos.push(nuevo);
  saveProductos(productos);
  res.status(201).json(nuevo);
});

// DELETE - eliminar producto
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let productos = getProductos();
  productos = productos.filter(p => p.id !== id);
  saveProductos(productos);
  res.json({ ok: true });
});

module.exports = router;
