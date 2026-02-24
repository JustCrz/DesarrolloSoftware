/**
 * @module ProductsController
 */

const pool = require('../bd');
const fs = require('fs');

/**
 * Obtener todos los productos
 * @async
 * @function getAllProducts
 * @returns {Promise<Array>} Lista de productos
 */
async function getAllProducts() {
  const [rows] = await pool.query('SELECT * FROM producto');
  return rows;
}

/**
 * Obtener productos con el nombre de su proveedor
 * @async
 * @function getProductsWithProviders
 * @returns {Promise<Array>} Lista de productos con proveedor
 */
async function getProductsWithProviders() {
  const sql = `
    SELECT p.*, pr.NombreProveedor
    FROM producto p
    LEFT JOIN ProductoProveedor pp ON p.IdProducto = pp.IdProducto
    LEFT JOIN Proveedores pr ON pp.IdProveedor = pr.IdProveedor
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

/**
 * Registrar un nuevo producto
 * @async
 * @function addProduct
 * @param {Object} productData Datos del producto
 * @param {string|null} imageFilename Nombre del archivo de imagen
 * @returns {Promise<Object>} Producto creado
 */
async function addProduct(productData, imageFilename) {
  const { Nombre, Categoria, Talla, Color, Precio, Stock } = productData;
  const Imagen = imageFilename || null;

  if (!Nombre || !Categoria || !Precio || !Stock) {
    throw new Error('Faltan campos obligatorios');
  }

  const [result] = await pool.query(
    'INSERT INTO producto (Nombre, Categoria, Talla, Color, Precio, Stock, Imagen) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [Nombre, Categoria, Talla || null, Color || null, Precio, Stock, Imagen]
  );

  return {
    IdProducto: result.insertId,
    Nombre,
    Categoria,
    Talla,
    Color,
    Precio,
    Stock,
    Imagen
  };
}

/**
 * Actualizar un producto existente
 * @async
 * @function updateProduct
 * @param {number|string} id Id del producto
 * @param {Object} productData Datos del producto
 * @param {string|null} imageFilename Nombre del archivo de imagen
 * @returns {Promise<void>}
 */
async function updateProduct(id, productData, imageFilename) {
  const { Nombre, Categoria, Talla, Color, Precio, Stock } = productData;
  const Imagen = imageFilename || null;

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
}

/**
 * Eliminar un producto y su imagen asociada
 * @async
 * @function deleteProduct
 * @param {number|string} id Id del producto
 * @returns {Promise<number>} Cantidad de filas afectadas
 */
async function deleteProduct(id) {
  const [rows] = await pool.query('SELECT Imagen FROM producto WHERE IdProducto = ?', [id]);
  if (rows.length > 0 && rows[0].Imagen) {
    const filePath = `uploads/${rows[0].Imagen}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const [result] = await pool.query('DELETE FROM producto WHERE IdProducto = ?', [id]);
  return result.affectedRows;
}

exports.getAllProducts = getAllProducts;
exports.getProductsWithProviders = getProductsWithProviders;
exports.addProduct = addProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;

