/**
 * @module ProductsController
 */
const pool = require('../bd');
const fs = require('fs');
const path = require('path');

/**
 * Obtener todos los productos para el catálogo público
 */
async function getAllProducts(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM producto');
    res.json({ ok: true, products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener productos' });
  }
}

/**
 * Obtener productos detallados con el nombre de su proveedor (Para el Admin)
 */
async function getProductsWithProviders(req, res) {
  try {
    const sql = `
      SELECT p.*, pr.Nombre as NombreProveedor
      FROM producto p
      LEFT JOIN ProductoProveedor pp ON p.IdProducto = pp.IdProducto
      LEFT JOIN proveedores pr ON pp.IdProveedor = pr.IdProveedor
    `;
    const [rows] = await pool.query(sql);
    res.json({ ok: true, products: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener productos con proveedores' });
  }
}

/**
 * Registrar un nuevo producto (Maneja la imagen de Multer)
 */
async function addProduct(req, res) {
  try {
    const { Nombre, Categoria, Talla, Color, Precio, Stock } = req.body;
    const Imagen = req.file ? req.file.filename : null;

    if (!Nombre || !Precio || !Stock) {
      return res.status(400).json({ ok: false, message: 'Nombre, Precio y Stock son obligatorios' });
    }

    const [result] = await pool.query(
      'INSERT INTO producto (Nombre, Categoria, Talla, Color, Precio, Stock, Imagen) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Nombre, Categoria, Talla || null, Color || null, Precio, Stock, Imagen]
    );

    res.status(201).json({
      ok: true,
      message: 'Producto creado exitosamente',
      product: { IdProducto: result.insertId, Nombre, Imagen }
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

/**
 * Actualizar producto y gestionar reemplazo de imagen física
 */
async function updateProduct(req, res) {
  const { id } = req.params;
  const { Nombre, Categoria, Talla, Color, Precio, Stock } = req.body;
  const nuevaImagen = req.file ? req.file.filename : null;

  try {
    // Imagen nueva, se busca la vieja para borrarla
    if (nuevaImagen) {
      const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
      if (rows.length > 0 && rows[0].Imagen) {
        const oldPath = path.join(__dirname, '../uploads/', rows[0].Imagen);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    // Construir la consulta dinámicamente
    let sql = 'UPDATE producto SET Nombre=?, Categoria=?, Talla=?, Color=?, Precio=?, Stock=?';
    const params = [Nombre, Categoria, Talla, Color, Precio, Stock];

    if (nuevaImagen) {
      sql += ', Imagen=?';
      params.push(nuevaImagen);
    }

    sql += ' WHERE IdProducto=?';
    params.push(id);

    await pool.query(sql, params);
    res.json({ ok: true, message: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

/**
 * Eliminar producto y su archivo de imagen asociado
 */
async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    //  Obtener nombre de la imagen antes de borrar el registro
    const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
    
    if (rows.length > 0 && rows[0].Imagen) {
      const filePath = path.join(__dirname, '../uploads/', rows[0].Imagen);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Borra la foto de la carpeta uploads
      }
    }

    // Borrar de la base de datos
    const [result] = await pool.query('DELETE FROM producto WHERE IdProducto = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }

    res.json({ ok: true, message: 'Producto e imagen eliminados correctamente' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al eliminar producto' });
  }
}

exports.getAllProducts = getAllProducts;
exports.getProductsWithProviders = getProductsWithProviders;
exports.addProduct = addProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
