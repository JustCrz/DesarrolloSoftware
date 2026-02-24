/**
 * @module CartController
 */

const pool = require('../bd');

/**
 * Recalcular y actualizar el total del carrito
 * @async
 * @function actualizarTotalCarrito
 * @param {number} idCarrito Id del carrito
 * @returns {Promise<number>} Total actualizado
 */
async function actualizarTotalCarrito(idCarrito) {
  const [rows] = await pool.query(
    `
    SELECT SUM(p.Precio * cp.Cantidad) AS Total
    FROM carritoproducto cp
    JOIN producto p ON cp.IdProducto = p.IdProducto
    WHERE cp.IdCarrito = ?
  `,
    [idCarrito]
  );

  const total = rows[0].Total || 0;
  await pool.query('UPDATE carrito SET Total = ? WHERE IdCarrito = ?', [total, idCarrito]);
  return total;
}

/**
 * Obtener carrito por cliente con su lista de productos
 * @async
 * @function getCartClient
 * @param {number} idCliente Id del cliente
 * @returns {Promise<Object|null>} Carrito del cliente o null
 */
async function getCartClient(idCliente) {
  const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
  if (carritoRows.length === 0) {
    return null;
  }

  const carrito = carritoRows[0];
  const [productos] = await pool.query(
    `
      SELECT cp.IdProducto, p.Nombre, p.Precio, cp.Cantidad
      FROM carritoproducto cp
      JOIN producto p ON cp.IdProducto = p.IdProducto
      WHERE cp.IdCarrito = ?
    `,
    [carrito.IdCarrito]
  );

  return {
    ...carrito,
    productos
  };
}

/**
 * Agregar un producto al carrito del cliente
 * @async
 * @function addProductToCart
 * @param {number} idCliente Id del cliente
 * @param {number} idProducto Id del producto
 * @param {number} cantidad Cantidad a agregar
 * @returns {Promise<number>} Total actualizado del carrito
 */
async function addProductToCart(idCliente, idProducto, cantidad) {
  let [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
  let idCarrito;

  if (carritoRows.length === 0) {
    const [result] = await pool.query('INSERT INTO carrito (IdCliente, Total) VALUES (?, 0)', [idCliente]);
    idCarrito = result.insertId;
  } else {
    idCarrito = carritoRows[0].IdCarrito;
  }

  const [prodRows] = await pool.query(
    'SELECT * FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?',
    [idCarrito, idProducto]
  );

  if (prodRows.length > 0) {
    await pool.query(
      'UPDATE carritoproducto SET Cantidad = Cantidad + ? WHERE IdCarrito = ? AND IdProducto = ?',
      [cantidad, idCarrito, idProducto]
    );
  } else {
    await pool.query(
      'INSERT INTO carritoproducto (IdCarrito, IdProducto, Cantidad) VALUES (?, ?, ?)',
      [idCarrito, idProducto, cantidad]
    );
  }

  const total = await actualizarTotalCarrito(idCarrito);
  return total;
}

/**
 * Eliminar un producto del carrito del cliente
 * @async
 * @function removeProductFromCart
 * @param {number} idCliente Id del cliente
 * @param {number} idProducto Id del producto
 * @returns {Promise<number|null>} Total actualizado o null si no hay carrito
 */
async function removeProductFromCart(idCliente, idProducto) {
  const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
  if (carritoRows.length === 0) {
    return null;
  }

  const idCarrito = carritoRows[0].IdCarrito;
  await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?', [idCarrito, idProducto]);

  const total = await actualizarTotalCarrito(idCarrito);
  return total;
}

/**
 * Actualizar la cantidad de un producto en el carrito
 * @async
 * @function updateProductQuantity
 * @param {number} idCliente Id del cliente
 * @param {number} idProducto Id del producto
 * @param {number} cantidad Nueva cantidad
 * @returns {Promise<number|null>} Total actualizado o null si no hay carrito
 */
async function updateProductQuantity(idCliente, idProducto, cantidad) {
  const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
  if (carritoRows.length === 0) {
    return null;
  }

  const idCarrito = carritoRows[0].IdCarrito;

  if (cantidad <= 0) {
    await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?', [idCarrito, idProducto]);
  } else {
    await pool.query(
      'UPDATE carritoproducto SET Cantidad = ? WHERE IdCarrito = ? AND IdProducto = ?',
      [cantidad, idCarrito, idProducto]
    );
  }

  const total = await actualizarTotalCarrito(idCarrito);
  return total;
}

exports.getCartClient = getCartClient;
exports.addProductToCart = addProductToCart;
exports.removeProductFromCart = removeProductFromCart;
exports.updateProductQuantity = updateProductQuantity;
