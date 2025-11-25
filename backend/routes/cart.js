const express = require('express');
const router = express.Router();
const pool = require('../bd');

//Calcular total carrito
async function actualizarTotalCarrito(IdCarrito) {
  const [rows] = await pool.query(`
    SELECT SUM(p.Precio * cp.Cantidad) AS Total
    FROM carritoproducto cp
    JOIN producto p ON cp.IdProducto = p.IdProducto
    WHERE cp.IdCarrito = ?
  `, [IdCarrito]);

  const total = rows[0].Total || 0;
  await pool.query('UPDATE carrito SET Total = ? WHERE IdCarrito = ?', [total, IdCarrito]);
  return total;
}
//Obtener un carro de un cliente
router.get('/:idCliente', async (req, res) => {
  const idCliente = parseInt(req.params.idCliente);
  try {
    const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
    if (carritoRows.length === 0) return res.json({ ok: true, carrito: null });

    const carrito = carritoRows[0];

    const [productos] = await pool.query(`
      SELECT cp.IdProducto, p.Nombre, p.Precio, cp.Cantidad
      FROM carritoproducto cp
      JOIN producto p ON cp.IdProducto = p.IdProducto
      WHERE cp.IdCarrito = ?
    `, [carrito.IdCarrito]);

    carrito.productos = productos;
    res.json({ ok: true, carrito });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener carrito' });
  }
});

//Agregar producto a carrito
router.post('/:idCliente', async (req, res) => {
  const idCliente = parseInt(req.params.idCliente);
  const { IdProducto, Cantidad } = req.body;

  try {
    // Verificar si el carrito existe, si no, crearlo
    let [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
    let IdCarrito;
    if (carritoRows.length === 0) {
      const [result] = await pool.query('INSERT INTO carrito (IdCliente, Total) VALUES (?, 0)', [idCliente]);
      IdCarrito = result.insertId;
    } else {
      IdCarrito = carritoRows[0].IdCarrito;
    }

    // Verificar si el producto ya está en el carrito
    const [prodRows] = await pool.query(
      'SELECT * FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?',
      [IdCarrito, IdProducto]
    );

    if (prodRows.length > 0) {
      // Actualizar cantidad
      await pool.query(
        'UPDATE carritoproducto SET Cantidad = Cantidad + ? WHERE IdCarrito = ? AND IdProducto = ?',
        [Cantidad, IdCarrito, IdProducto]
      );
    } else {
      // Insertar producto
      await pool.query(
        'INSERT INTO carritoproducto (IdCarrito, IdProducto, Cantidad) VALUES (?, ?, ?)',
        [IdCarrito, IdProducto, Cantidad]
      );
    }

    // Recalcular total
    const total = await actualizarTotalCarrito(IdCarrito);

    res.status(201).json({ ok: true, message: 'Producto agregado al carrito', Total: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al agregar producto al carrito' });
  }
});

//Eliminar un producto del carrito
router.delete('/:idCliente/:idProducto', async (req, res) => {
  const idCliente = parseInt(req.params.idCliente);
  const idProducto = parseInt(req.params.idProducto);

  try {
    const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
    if (carritoRows.length === 0) return res.status(404).json({ ok: false, message: 'Carrito no encontrado' });

    const IdCarrito = carritoRows[0].IdCarrito;

    await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?', [IdCarrito, idProducto]);

    // Recalcular total
    const total = await actualizarTotalCarrito(IdCarrito);

    res.json({ ok: true, message: 'Producto eliminado del carrito', Total: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al eliminar producto del carrito' });
  }
});

//Actualizar cantidad de producto
router.put('/:idCliente', async (req, res) => {
  const idCliente = parseInt(req.params.idCliente);
  const { IdProducto, Cantidad } = req.body;

  try {
    const [carritoRows] = await pool.query('SELECT * FROM carrito WHERE IdCliente = ?', [idCliente]);
    if (carritoRows.length === 0) return res.status(404).json({ ok: false, message: 'Carrito no encontrado' });

    const IdCarrito = carritoRows[0].IdCarrito;

    if (Cantidad <= 0) {
      // Si la cantidad es 0 o menor, eliminar el producto
      await pool.query('DELETE FROM carritoproducto WHERE IdCarrito = ? AND IdProducto = ?', [IdCarrito, IdProducto]);
    } else {
      await pool.query('UPDATE carritoproducto SET Cantidad = ? WHERE IdCarrito = ? AND IdProducto = ?', [Cantidad, IdCarrito, IdProducto]);
    }

    // Recalcular total
    const total = await actualizarTotalCarrito(IdCarrito);

    res.json({ ok: true, message: 'Cantidad actualizada', Total: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al actualizar cantidad del carrito' });
  }
});

module.exports = router;