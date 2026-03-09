/**
 * @module ProductsController
 */
<<<<<<< HEAD
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
=======

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
>>>>>>> origin/main
  }
}

/**
<<<<<<< HEAD
 * Obtener productos detallados con el nombre de su proveedor (Para el Admin)
=======
 * Obtener productos con proveedor
 * @async
 * @function getProductsWithProviders
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con productos
>>>>>>> origin/main
 */
async function getProductsWithProviders(req, res) {
  try {
    const sql = `
<<<<<<< HEAD
      SELECT p.*, pr.Nombre as NombreProveedor
      FROM producto p
      LEFT JOIN ProductoProveedor pp ON p.IdProducto = pp.IdProducto
      LEFT JOIN proveedores pr ON pp.IdProveedor = pr.IdProveedor
    `;
    const [rows] = await pool.query(sql);
    res.json({ ok: true, products: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener productos con proveedores' });
=======
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
>>>>>>> origin/main
  }
}

/**
<<<<<<< HEAD
 * Registrar un nuevo producto (Maneja la imagen de Multer)
=======
 * Registrar un nuevo producto
 * @async
 * @function addProduct
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP del registro
>>>>>>> origin/main
 */
async function addProduct(req, res) {
  try {
    const { Nombre, Categoria, Talla, Color, Precio, Stock } = req.body;
    const Imagen = req.file ? req.file.filename : null;

<<<<<<< HEAD
    if (!Nombre || !Precio || !Stock) {
      return res.status(400).json({ ok: false, message: 'Nombre, Precio y Stock son obligatorios' });
=======
    if (!Nombre || !Categoria || !Precio || !Stock) {
      return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
>>>>>>> origin/main
    }

    const [result] = await pool.query(
      'INSERT INTO producto (Nombre, Categoria, Talla, Color, Precio, Stock, Imagen) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Nombre, Categoria, Talla || null, Color || null, Precio, Stock, Imagen]
    );

<<<<<<< HEAD
    res.status(201).json({
      ok: true,
      message: 'Producto creado exitosamente',
      product: { IdProducto: result.insertId, Nombre, Imagen }
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
=======
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
>>>>>>> origin/main
  }
}

/**
<<<<<<< HEAD
 * Actualizar producto y gestionar reemplazo de imagen física
 */
async function updateProduct(req, res) {
  const { id } = req.params;
  const { Nombre, Categoria, Talla, Color, Precio, Stock } = req.body;
  const nuevaImagen = req.file ? req.file.filename : null;

  try {
    // 1. Si hay imagen nueva, buscamos la vieja para borrarla
    if (nuevaImagen) {
      const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
      if (rows.length > 0 && rows[0].Imagen) {
        const oldPath = path.join(__dirname, '../uploads/', rows[0].Imagen);
=======
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
>>>>>>> origin/main
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

<<<<<<< HEAD
    // 2. Construir la consulta dinámicamente
    let sql = 'UPDATE producto SET Nombre=?, Categoria=?, Talla=?, Color=?, Precio=?, Stock=?';
    const params = [Nombre, Categoria, Talla, Color, Precio, Stock];

    if (nuevaImagen) {
      sql += ', Imagen=?';
      params.push(nuevaImagen);
=======
    let sql = 'UPDATE producto SET Nombre=?, Categoria=?, Talla=?, Color=?, Precio=?, Stock=?';
    const params = [Nombre, Categoria, Talla || null, Color || null, Precio, Stock];

    if (Imagen) {
      sql += ', Imagen=?';
      params.push(Imagen);
>>>>>>> origin/main
    }

    sql += ' WHERE IdProducto=?';
    params.push(id);

    await pool.query(sql, params);
<<<<<<< HEAD
    res.json({ ok: true, message: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
=======
    
    return res.json({ ok: true, message: 'Producto actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    return res.status(500).json({ ok: false, message: 'Error al actualizar producto' });
>>>>>>> origin/main
  }
}

/**
<<<<<<< HEAD
 * Eliminar producto y su archivo de imagen asociado
 */
async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    // 1. Obtener nombre de la imagen antes de borrar el registro
    const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
    
    if (rows.length > 0 && rows[0].Imagen) {
      const filePath = path.join(__dirname, '../uploads/', rows[0].Imagen);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Borra la foto de la carpeta uploads
      }
    }

    // 2. Borrar de la base de datos
    const [result] = await pool.query('DELETE FROM producto WHERE IdProducto = ?', [id]);
    
=======
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
>>>>>>> origin/main
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }

<<<<<<< HEAD
    res.json({ ok: true, message: 'Producto e imagen eliminados correctamente' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al eliminar producto' });
=======
    return res.json({ ok: true, message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    return res.status(500).json({ ok: false, message: 'Error al eliminar producto' });
>>>>>>> origin/main
  }
}

exports.getAllProducts = getAllProducts;
exports.getProductsWithProviders = getProductsWithProviders;
exports.addProduct = addProduct;
exports.updateProduct = updateProduct;
<<<<<<< HEAD
exports.deleteProduct = deleteProduct;
=======
exports.deleteProduct = deleteProduct;
>>>>>>> origin/main
