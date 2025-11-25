const express = require('express');
const router = express.Router();
const pool = require('../bd');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Carpeta donde se guarda la imagen
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // ej: 1700869123123.png
  }
});
const upload = multer({ storage });

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
router.post('/', upload.single('Imagen'), async (req, res) => {
  const { Nombre, Categoria, Talla, Color, Precio, Stock } = req.body;
  const Imagen = req.file ? req.file.filename : null;

  if (!Nombre || !Categoria || !Precio || !Stock) {
    return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO producto (Nombre, Categoria, Talla, Color, Precio, Stock, Imagen) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Nombre, Categoria, Talla || null, Color || null, Precio, Stock, Imagen]
    );

    res.json({
      ok: true,
      message: 'Producto agregado correctamente',
      product: {
        IdProducto: result.insertId,
        Nombre,
        Categoria,
        Talla,
        Color,
        Precio,
        Stock,
        Imagen
      }
    });

  } catch (err) {
    console.error('Error al agregar producto:', err);
    res.status(500).json({ ok: false, message: 'Error al agregar producto' });
  }
});

// Editar producto
router.put('/:id', upload.single('Imagen'), async (req, res) => {
  const { id } = req.params;
  const { Nombre, Categoria, Talla, Color, Precio, Stock } = req.body;
  const Imagen = req.file ? req.file.filename : null;

  try {
    // Obtener la imagen actual para borrarla si suben nueva
    if (Imagen) {
      const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
      if (rows.length > 0 && rows[0].Imagen) {
        const oldPath = `uploads/${rows[0].Imagen}`;
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    // Construir SQL dinámico
    let sql = 'UPDATE producto SET Nombre=?, Categoria=?, Talla=?, Color=?, Precio=?, Stock=?';
    const params = [Nombre, Categoria, Talla || null, Color || null, Precio, Stock];

    if (Imagen) {
      sql += ', Imagen=?';
      params.push(Imagen);
    }

    sql += ' WHERE IdProducto=?';
    params.push(id);

    const [result] = await pool.query(sql, params);

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
    // Primero opcional: obtener el nombre de la imagen para borrarla del servidor
    const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
    if (rows.length > 0 && rows[0].Imagen) {
      const filePath = `uploads/${rows[0].Imagen}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // eliminar archivo
    }

    // Eliminar el producto de la base de datos
    const [result] = await pool.query('DELETE FROM producto WHERE IdProducto = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }

    res.json({ ok: true, message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ ok: false, message: 'Error al eliminar producto' });
  }
});

module.exports = router;
