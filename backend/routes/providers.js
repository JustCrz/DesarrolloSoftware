const express = require('express');
const router = express.Router();
const pool = require('../bd');

// GET
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM proveedores');
    res.json({ ok: true, providers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener proveedores' });
  }
});

// POST
router.post('/', async (req, res) => {
  const { Nombre, Telefono, Correo, Direccion } = req.body;
  if (!Nombre) {
    return res.status(400).json({ ok: false, message: 'El nombre es obligatorio' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO proveedores (Nombre, Telefono, Correo, Direccion) VALUES (?, ?, ?, ?)',
      [Nombre, Telefono || null, Correo || null, Direccion || null]
    );
    res.status(201).json({
      ok: true,
      provider: { IdProveedor: result.insertId, Nombre, Telefono, Correo, Direccion }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al agregar proveedor' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM Proveedores WHERE IdProveedor = ?', [id]);
    res.json({ ok: true, message: 'Proveedor eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al eliminar proveedor' });
  }
});

module.exports = router;
