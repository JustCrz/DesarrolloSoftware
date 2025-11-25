const express = require('express');
const router = express.Router();
const pool = require('../bd');
// Obtener ventas
router.get('/', async (req, res) => {
  try {
    // Traer todos los pedidos con datos del cliente
    const [pedidos] = await pool.query(`
      SELECT p.IdPedido, p.IdCliente, c.NombreC, p.Fecha, p.Total, p.Estado
      FROM pedido p
      JOIN cliente c ON p.IdCliente = c.IdCliente
      ORDER BY p.Fecha DESC
    `);
    // Traer productos de cada pedido
    for (let pedido of pedidos) {
      const [productos] = await pool.query(`
        SELECT pp.IdProducto, pr.Nombre, pp.Cantidad, pr.Precio
        FROM pedidoproducto pp
        JOIN producto pr ON pp.IdProducto = pr.IdProducto
        WHERE pp.IdPedido = ?
      `, [pedido.IdPedido]);
      pedido.productos = productos;
    }
    res.json({ ok: true, pedidos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener pedidos' });
  }
});

// Registrar venta
router.post('/', async (req, res) => {
  try {
    const { IdCliente, productos, Estado } = req.body;
    // productos = [{ IdProducto, Cantidad }, ...]

    // Calcular total
    let total = 0;
    for (let p of productos) {
      const [rows] = await pool.query('SELECT Precio FROM producto WHERE IdProducto = ?', [p.IdProducto]);
      if (rows.length === 0) continue;
      total += rows[0].Precio * p.Cantidad;
      p.Precio = rows[0].Precio; // guardar precio actual
    }

    // Insertar pedido
    const [result] = await pool.query(
      'INSERT INTO pedido (IdCliente, Fecha, Total, Estado) VALUES (?, NOW(), ?, ?)',
      [IdCliente, total, Estado || 'Pendiente']
    );
    const IdPedido = result.insertId;

    // Insertar productos en la tabla intermedia
    for (let p of productos) {
      await pool.query(
        'INSERT INTO pedidoproducto (IdPedido, IdProducto, Cantidad) VALUES (?, ?, ?)',
        [IdPedido, p.IdProducto, p.Cantidad]
      );
    }

    res.status(201).json({ ok: true, IdPedido, productos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al registrar pedido' });
  }
});

module.exports = router;
