const express = require('express');
const router = express.Router();
const pool = require('../bd');

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM producto');
    res.json({ ok: true, products: rows });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener productos' });
  }
});

router.get('/with-providers', async (req, res) => {
  try {
    const sql = `
      SELECT p.*, pr.NombreProveedor
      FROM producto p
      LEFT JOIN ProductoProveedor pp ON p.IdProducto = pp.IdProducto
      LEFT JOIN Proveedores pr ON pp.IdProveedor = pr.IdProveedor
    `;
    const [rows] = await pool.query(sql);
    res.json({ ok: true, products: rows });
  } catch (err) {
    console.error('Error al obtener productos con proveedores:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener productos con proveedores' });
  }
});

// Agregar nuevo producto
router.post('/', async (req, res) => {
  const { Nombre, Categoria, Talla, Color, Precio, Stock, Imagen } = req.body;
    if (!Nombre || !Categoria || !Precio || !Stock) {
    return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO producto (Nombre, Categoria, Talla, Color, Precio, Stock, Imagen) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Nombre, Categoria, Talla || null, Color || null, Precio, Stock, Imagen || null]
    );
      res.json({ 
      ok: true, 
      message: 'Producto agregado correctamente', 
      product: { 
        IdProducto: result.insertId, 
        Nombre, Categoria, Talla, Color, Precio, Stock, Imagen 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al agregar producto' });
  }
});

module.exports = router;

