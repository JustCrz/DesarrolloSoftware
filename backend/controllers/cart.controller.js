/**
 * @module CartController
 */

const pool = require('../bd');

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
 * Obtener carrito de un cliente
 * @async
 * @function getCartClient
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con carrito
 */
async function getCartClient(req, res) {
  try {
    const idCliente = parseInt(req.params.idCliente);
    const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
    if (carritoRows.length === 0) {
      return res.json({ ok: true, carrito: null });
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

    carrito.productos = productos;
    return res.json({ ok: true, carrito });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al obtener carrito' });
  }
}

/**
 * Agregar producto al carrito
 * @async
 * @function addProductToCart
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de alta
 */
async function addProductToCart(req, res) {
  try {
    const idCliente = parseInt(req.params.idCliente);
    const { IdProducto, Cantidad } = req.body;

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
      [idCarrito, IdProducto]
    );

    if (prodRows.length > 0) {
      await pool.query(
        'UPDATE carritoproducto SET Cantidad = Cantidad + ? WHERE IdCarrito = ? AND IdProducto = ?',
        [Cantidad, idCarrito, IdProducto]
      );
    } else {
      await pool.query(
        'INSERT INTO carritoproducto (IdCarrito, IdProducto, Cantidad) VALUES (?, ?, ?)',
        [idCarrito, IdProducto, Cantidad]
      );
    }

    const total = await actualizarTotalCarrito(idCarrito);
    return res.status(201).json({ ok: true, message: 'Producto agregado al carrito', Total: total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al agregar producto al carrito' });
  }
}

/**
 * Eliminar producto de un carrito
 * @async
 * @function removeProductFromCart
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de eliminacion
 */
async function removeProductFromCart(req, res) {
  try {
    const idCliente = parseInt(req.params.idCliente);
    const idProducto = parseInt(req.params.idProducto);
    const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);

    if (carritoRows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Carrito no encontrado' });
    }

    const idCarrito = carritoRows[0].IdCarrito;
    await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?', [idCarrito, idProducto]);

    const total = await actualizarTotalCarrito(idCarrito);
    return res.json({ ok: true, message: 'Producto eliminado del carrito', Total: total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al eliminar producto del carrito' });
  }
}

/**
 * Actualizar cantidad de un producto en carrito
 * @async
 * @function updateProductQuantity
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de actualizacion
 */
async function updateProductQuantity(req, res) {
  try {
    const idCliente = parseInt(req.params.idCliente);
    const { IdProducto, Cantidad } = req.body;
    const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);

    if (carritoRows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Carrito no encontrado' });
    }

    const idCarrito = carritoRows[0].IdCarrito;

    if (Cantidad <= 0) {
      await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?', [idCarrito, IdProducto]);
    } else {
      await pool.query(
        'UPDATE carritoproducto SET Cantidad = ? WHERE IdCarrito = ? AND IdProducto = ?',
        [Cantidad, idCarrito, IdProducto]
      );
    }

    const total = await actualizarTotalCarrito(idCarrito);
    return res.json({ ok: true, message: 'Cantidad actualizada', Total: total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al actualizar cantidad del carrito' });
  }
}

exports.getCartClient = getCartClient;
exports.addProductToCart = addProductToCart;
exports.removeProductFromCart = removeProductFromCart;
exports.updateProductQuantity = updateProductQuantity;
