/**
 * @module CartController
 */
const poolReal = require('../bd');

/**
 * Función interna modificada para aceptar el pool (necesario para tests)
 */
async function actualizarTotalCarrito(idCarrito, pool = poolReal) {
  const [rows] = await pool.query(
    `SELECT SUM(IF(p.EnPromocion = 1 AND p.PrecioOferta > 0, p.PrecioOferta, p.Precio) * cp.Cantidad) AS Total 
     FROM carritoproducto cp JOIN producto p ON cp.IdProducto = p.IdProducto WHERE cp.IdCarrito = ?`,
    [idCarrito]
  );
  const total = rows[0].Total || 0;
  await pool.query('UPDATE carrito SET Total = ? WHERE IdCarrito = ?', [total, idCarrito]);
  return total;
}

async function getCartClient(req, res, { pool = poolReal } = {}) {
  const { idCliente } = req.params;
  try {
    const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
    if (carritoRows.length === 0) {
      return res.json({ ok: true, carrito: { productos: [], Total: 0 } });
    }
    const carrito = carritoRows[0];
    const [productos] = await pool.query(
      `SELECT cp.IdProducto, p.Nombre, p.Precio, p.Imagen, cp.Cantidad, (p.Precio * cp.Cantidad) as Subtotal
       FROM carritoproducto cp JOIN producto p ON cp.IdProducto = p.IdProducto WHERE cp.IdCarrito = ?`,
      [carrito.IdCarrito]
    );
    res.json({ ok: true, carrito: { ...carrito, productos } });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener carrito' });
  }
}

async function addProductToCart(req, res, { pool = poolReal } = {}) {
  const { idCliente } = req.params;
  const { IdProducto, Cantidad } = req.body;
  try {
    let [carritoRows] = await pool.query('SELECT IdCarrito FROM carrito WHERE IdCliente = ?', [idCliente]);
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
      await pool.query('UPDATE carritoproducto SET Cantidad = Cantidad + ? WHERE IdCarrito = ? AND IdProducto = ?', [Cantidad, idCarrito, IdProducto]);
    } else {
      await pool.query('INSERT INTO carritoproducto (IdCarrito, IdProducto, Cantidad) VALUES (?, ?, ?)', [idCarrito, IdProducto, Cantidad]);
    }

    const nuevoTotal = await actualizarTotalCarrito(idCarrito, pool);
    res.json({ ok: true, message: 'Producto añadido', Total: nuevoTotal });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al añadir producto' });
  }
}

async function updateProductQuantity(req, res, { pool = poolReal } = {}) {
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
    const nuevoTotal = await actualizarTotalCarrito(idCarrito, pool);
    res.json({ ok: true, message: 'Cantidad actualizada', Total: nuevoTotal });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al actualizar cantidad' });
  }
}

async function removeProductFromCart(req, res, { pool = poolReal } = {}) {
  const { idCliente, idProducto } = req.params;
  try {
    const [carrito] = await pool.query('SELECT IdCarrito FROM carrito WHERE IdCliente = ?', [idCliente]);
    if (carrito.length === 0) return res.status(404).json({ ok: false });
    await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?', [carrito[0].IdCarrito, idProducto]);
    const nuevoTotal = await actualizarTotalCarrito(carrito[0].IdCarrito, pool);
    res.json({ ok: true, Total: nuevoTotal });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

async function clearCart(req, res, { pool = poolReal } = {}) {
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

exports.getCartClient = getCartClient;
exports.addProductToCart = addProductToCart;
exports.updateProductQuantity = updateProductQuantity;
exports.removeProductFromCart = removeProductFromCart;
exports.clearCart = clearCart;