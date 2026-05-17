/**
 * @module ProductsController
 * Manejo de catálogo, promociones y stock para Marjorie Store
 */
const pool = require('../bd');
const fs = require('fs');
const path = require('path');

/**
 * Obtener todos los productos (Catálogo público)
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
 * Obtener productos con proveedores (Vista Admin)
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
 * Registrar nuevo producto
 */
async function addProduct(req, res) {
  try {
    const { Nombre, Categoria, Talla, Color, Precio, Stock, EnPromocion, PrecioOferta, FechaFinPromo } = req.body;
    const Imagen = req.file ? req.file.filename : null;

    if (!Nombre || !Precio || !Stock) {
      return res.status(400).json({ ok: false, message: 'Nombre, Precio y Stock son obligatorios' });
    }

    // Convertir a booleano/entero para MySQL
    const promoActive = (EnPromocion === 'true' || EnPromocion === '1' || EnPromocion === 1) ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO producto (Nombre, Categoria, Talla, Color, Precio, Stock, Imagen, EnPromocion, PrecioOferta, FechaFinPromo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Nombre, Categoria, Talla || null, Color || null, Precio, Stock, Imagen, promoActive, PrecioOferta || 0, FechaFinPromo || null]
    );

    res.status(201).json({
      ok: true,
      message: 'Producto creado exitosamente',
      product: { IdProducto: result.insertId, Nombre }
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

/**
 * Actualizar producto y promociones
 */
async function updateProduct(req, res) {
  const { id } = req.params;
  const { Nombre, Categoria, Talla, Color, Precio, Stock, EnPromocion, PrecioOferta, FechaFinPromo } = req.body;
  const nuevaImagen = req.file ? req.file.filename : null;

  try {
    // Si hay una imagen nueva, intentamos borrar la anterior del disco
    if (nuevaImagen) {
      const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
      if (rows.length > 0 && rows[0].Imagen) {
        const oldPath = path.join(__dirname, '../uploads/', rows[0].Imagen);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const promoActive = (EnPromocion === 'true' || EnPromocion === '1' || EnPromocion === 1) ? 1 : 0;
    
    let sql = `UPDATE producto SET Nombre=?, Categoria=?, Talla=?, Color=?, Precio=?, Stock=?, EnPromocion=?, PrecioOferta=?, FechaFinPromo=?`;
    const params = [Nombre, Categoria, Talla, Color, Precio, Stock, promoActive, PrecioOferta || 0, FechaFinPromo || null];

    if (nuevaImagen) {
      sql += ', Imagen=?';
      params.push(nuevaImagen);
    }
    sql += ' WHERE IdProducto=?';
    params.push(id);

    await pool.query(sql, params);
    res.json({ ok: true, message: 'Producto actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

/**
 * Ajustar Stock automáticamente (Uso interno para ventas)
 */
async function updateStockAfterSale(idProducto, cantidad) {
    try {
        await pool.query(
            'UPDATE producto SET Stock = Stock - ? WHERE IdProducto = ?',
            [cantidad, idProducto]
        );
        return true;
    } catch (err) {
        console.error("Error al actualizar stock:", err);
        return false;
    }
}

/**
 * Eliminar producto
 */
async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
    if (rows.length > 0 && rows[0].Imagen) {
      const filePath = path.join(__dirname, '../uploads/', rows[0].Imagen);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await pool.query('DELETE FROM producto WHERE IdProducto = ?', [id]);
    res.json({ ok: true, message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al eliminar' });
  }
}

module.exports = {
    getAllProducts,
    getProductsWithProviders,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStockAfterSale
};