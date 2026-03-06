/**
 * @module ProductsController
 */

const pool = require('../bd');
const fs = require('fs');

/**
 * Obtener todos los productos
 * @async
 * @function getAllProducts
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con productos
 */
async function getAllProducts(req, res) {
  try {
    const [products] = await pool.query('SELECT * FROM producto');
    return res.json({ ok: true, products });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener productos' });
  }
}

/**
 * Obtener productos con proveedor
 * @async
 * @function getProductsWithProviders
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con productos
 */
async function getProductsWithProviders(req, res) {
  try {
    const sql = `
      SELECT p.*, pr.NombreProveedor
      FROM producto p
      LEFT JOIN ProductoProveedor pp ON p.IdProducto = pp.IdProducto
      LEFT JOIN Proveedores pr ON pp.IdProveedor = pr.IdProveedor
    `;
    const [products] = await pool.query(sql);
    return res.json({ ok: true, products });
  } catch (err) {
    console.error('Error al obtener productos con proveedores:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener productos con proveedores' });
  }
}

/**
 * Registrar un nuevo producto
 * @async
 * @function addProduct
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP del registro
 */
async function addProduct(req, res) {
  try {
    const { Nombre, Categoria, Talla, Color, Precio, Stock } = req.body;
    const Imagen = req.file ? req.file.filename : null;

    if (!Nombre || !Categoria || !Precio || !Stock) {
      return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
    }

    const [result] = await pool.query(
      'INSERT INTO producto (Nombre, Categoria, Talla, Color, Precio, Stock, Imagen) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Nombre, Categoria, Talla || null, Color || null, Precio, Stock, Imagen]
    );

    return res.json({
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
    return res.status(500).json({ ok: false, message: 'Error al agregar producto' });
  }
}

/**
 * Actualizar un producto existente
 * @async
 * @function updateProduct
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de actualizacion
 */
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { Nombre, Categoria, Talla, Color, Precio, Stock } = req.body;
    const Imagen = req.file ? req.file.filename : null;

    if (Imagen) {
      const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
      if (rows.length > 0 && rows[0].Imagen) {
        const oldPath = `uploads/${rows[0].Imagen}`;
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    let sql = 'UPDATE producto SET Nombre=?, Categoria=?, Talla=?, Color=?, Precio=?, Stock=?';
    const params = [Nombre, Categoria, Talla || null, Color || null, Precio, Stock];

    if (Imagen) {
      sql += ', Imagen=?';
      params.push(Imagen);
    }

    sql += ' WHERE IdProducto=?';
    params.push(id);

    await pool.query(sql, params);
    
    return res.json({ ok: true, message: 'Producto actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    return res.status(500).json({ ok: false, message: 'Error al actualizar producto' });
  }
}

/**
 * Eliminar un producto
 * @async
 * @function deleteProduct
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de eliminacion
 */
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
    if (rows.length > 0 && rows[0].Imagen) {
      const filePath = `uploads/${rows[0].Imagen}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const [result] = await pool.query('DELETE FROM producto WHERE IdProducto = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }

    return res.json({ ok: true, message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    return res.status(500).json({ ok: false, message: 'Error al eliminar producto' });
  }
}

exports.getAllProducts = getAllProducts;
exports.getProductsWithProviders = getProductsWithProviders;
exports.addProduct = addProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
