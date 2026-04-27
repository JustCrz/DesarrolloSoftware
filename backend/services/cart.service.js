const pool = require('../bd');

// Recalcular total
async function updateCartTotal(idCarrito) {
  const [rows] = await pool.query(
    `SELECT SUM(p.Precio * cp.Cantidad) AS Total 
     FROM carritoproducto cp 
     JOIN producto p ON cp.IdProducto = p.IdProducto
     WHERE cp.IdCarrito = ?`,
    [idCarrito]
  );

  const total = rows[0].Total || 0;

  await pool.query(
    'UPDATE carrito SET Total = ? WHERE IdCarrito = ?',
    [total, idCarrito]
  );

  return total;
}

// Obtener carrito
async function getClientCart(idCliente) {
  const [carritoRows] = await pool.query(
    'SELECT * FROM carrito WHERE IdCliente = ?',
    [idCliente]
  );

  if (carritoRows.length === 0) {
    return [];
  }

  const carrito = carritoRows[0];

  const [productos] = await pool.query(
    `SELECT 
        cp.IdProducto,
        p.Nombre,
        p.Imagen,
        p.Precio,
        cp.Cantidad
     FROM carritoproducto cp
     JOIN producto p ON cp.IdProducto = p.IdProducto
     WHERE cp.IdCarrito = ?`,
    [carrito.IdCarrito]
  );

  carrito.productos = productos;

  return carrito;
}

// Agregar producto
async function addToCart(idCliente, idProducto, cantidad) {
  const [carritoRows] = await pool.query(
    'SELECT * FROM carrito WHERE IdCliente = ?',
    [idCliente]
  );

  let idCarrito;

  if (carritoRows.length === 0) {
    const [result] = await pool.query(
      'INSERT INTO carrito (IdCliente, Total) VALUES (?, 0)',
      [idCliente]
    );
    idCarrito = result.insertId;
  } else {
    idCarrito = carritoRows[0].IdCarrito;
  }

  const [existente] = await pool.query(
    'SELECT * FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?',
    [idCarrito, idProducto]
  );

  if (existente.length > 0) {
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

  return await updateCartTotal(idCarrito);
}

// Actualizar cantidad
async function updateQuantity(idCliente, idProducto, cantidad) {
  const [carritoRows] = await pool.query(
    'SELECT IdCarrito FROM carrito WHERE IdCliente = ?',
    [idCliente]
  );

  if (carritoRows.length === 0) {
    throw new Error('Carrito no encontrado');
  }

  const idCarrito = carritoRows[0].IdCarrito;

  if (parseInt(cantidad) <= 0) {
    await pool.query(
      'DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?',
      [idCarrito, idProducto]
    );
  } else {
    await pool.query(
      'UPDATE carritoproducto SET Cantidad = ? WHERE IdCarrito = ? AND IdProducto = ?',
      [cantidad, idCarrito, idProducto]
    );
  }

  return await updateCartTotal(idCarrito);
}

// Eliminar producto
async function removeFromCart(idCliente, idProducto) {
  const [carrito] = await pool.query(
    'SELECT IdCarrito FROM carrito WHERE IdCliente = ?',
    [idCliente]
  );

  if (carrito.length === 0) {
    throw new Error('Carrito no encontrado');
  }

  await pool.query(
    'DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?',
    [carrito[0].IdCarrito, idProducto]
  );

  return await updateCartTotal(carrito[0].IdCarrito);
}

// Vaciar carrito
async function emptyCart(idCliente) {
  const [carrito] = await pool.query(
    'SELECT IdCarrito FROM carrito WHERE IdCliente = ?',
    [idCliente]
  );

  if (carrito.length > 0) {
    await pool.query(
      'DELETE FROM carritoproducto WHERE IdCarrito = ?',
      [carrito[0].IdCarrito]
    );

    await pool.query(
      'UPDATE carrito SET Total = 0 WHERE IdCarrito = ?',
      [carrito[0].IdCarrito]
    );
  }

  return { message: 'Carrito vaciado' };
}

module.exports = {
  getClientCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  emptyCart,
  updateCartTotal
};