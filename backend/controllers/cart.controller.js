/**
 * @module CartController
 * Controlador para gestionar el carrito de compras de Marjorie Store
 */
const pool = require('../bd');

/**
 * Función interna para recalcular el total de un carrito
 * Se ejecuta automáticamente tras cualquier cambio en los productos.
 */
async function actualizarTotalCarrito(idCarrito) {
  const [rows] = await pool.query(
    `SELECT SUM(p.Precio * cp.Cantidad) AS Total 
     FROM carritoproducto cp 
     JOIN producto p ON cp.IdProducto = p.IdProducto 
     WHERE cp.IdCarrito = ?`,
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

    const [prodExistente] = await pool.query(
      'SELECT * FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?',
      [idCarrito, IdProducto]
    );

    if (prodExistente.length > 0) {
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
 * Actualizar cantidad de un producto o eliminarlo si la cantidad es <= 0
 */
async function updateProductQuantity(req, res) {
  const { idCliente } = req.params;
  const { IdProducto, Cantidad } = req.body;

  try {
    const [carritoRows] = await pool.query('SELECT IdCarrito FROM carrito WHERE IdCliente = ?', [idCliente]);
    if (carritoRows.length === 0) return res.status(404).json({ ok: false, message: 'Carrito no encontrado' });

    const idCarrito = carritoRows[0].IdCarrito;

    if (parseInt(Cantidad) <= 0) {
      await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?', [idCarrito, IdProducto]);
    } else {
      await pool.query('UPDATE carritoproducto SET Cantidad = ? WHERE IdCarrito = ? AND IdProducto = ?', [Cantidad, idCarrito, IdProducto]);
    }

    const nuevoTotal = await actualizarTotalCarrito(idCarrito);
    res.json({ ok: true, message: 'Cantidad actualizada', Total: nuevoTotal });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al actualizar cantidad' });
  }
}

/**
 * Eliminar un producto específico del carrito
 */
async function removeProductFromCart(req, res) {
  const { idCliente, idProducto } = req.params;
  try {
    const [carrito] = await pool.query('SELECT IdCarrito FROM carrito WHERE IdCliente = ?', [idCliente]);
    if (carrito.length === 0) return res.status(404).json({ ok: false });

    await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?', 
      [carrito[0].IdCarrito, idProducto]);

    const nuevoTotal = await actualizarTotalCarrito(carrito[0].IdCarrito);
    res.json({ ok: true, Total: nuevoTotal });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

/**
 * Vaciar todo el carrito
 */
async function clearCart(req, res) {
  const { idCliente } = req.params;
  try {
    const [carrito] = await pool.query('SELECT IdCarrito FROM carrito WHERE IdCliente = ?', [idCliente]);
    if (carrito.length > 0) {
      await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ?', [carrito[0].IdCarrito]);
      await pool.query('UPDATE carrito SET Total = 0 WHERE IdCarrito = ?', [carrito[0].IdCarrito]);
    }
    res.json({ ok: true, message: 'Carrito vaciado' });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
}

// Exportación de todas las funciones para las rutas
exports.getCartClient = getCartClient;
exports.addProductToCart = addProductToCart;
exports.updateProductQuantity = updateProductQuantity;
exports.removeProductFromCart = removeProductFromCart;
exports.clearCart = clearCart;
