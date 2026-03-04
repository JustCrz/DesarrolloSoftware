const express = require('express');
const router = express.Router();
const pool = require('../bd');

// Obtener todas las ventas (se mantiene igual, pero optimizado)
router.get('/', async (req, res) => {
  try {
    const [pedidos] = await pool.query(`
      SELECT p.IdPedido, p.IdCliente, c.NombreC, p.Fecha, p.Total, p.Estado
      FROM pedido p
      JOIN cliente c ON p.IdCliente = c.IdCliente
      ORDER BY p.Fecha DESC
    `);

    for (let pedido of pedidos) {
      const [productos] = await pool.query(`
        SELECT pp.IdProducto, pr.Nombre, pp.Cantidad, pr.Precio
        FROM pedidoproducto pp
        JOIN producto pr ON pp.IdProducto = pr.IdProducto
        WHERE pp.IdPedido = ?
      `, [pedido.IdPedido]);
      pedido.productos = productos;
    }
    res.json(pedidos); // Enviamos directamente el array para que coincida con tu renderPagos()
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener pedidos' });
  }
});

// Registrar venta profesional con Transacción y Stock
router.post('/', async (req, res) => {
  let connection;
  try {
    const { IdCliente, productos, Estado } = req.body;

    // Obtenemos una conexión específica para la transacción
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let total = 0;
    
    // VALIDACIÓN DE PRECIOS Y STOCK
    for (let p of productos) {
      const [rows] = await connection.query(
        'SELECT Precio, Stock, Nombre FROM producto WHERE IdProducto = ?', 
        [p.IdProducto]
      );
      
      if (rows.length === 0) throw new Error(`El producto con ID ${p.IdProducto} no existe.`);
      
      const productoBD = rows[0];
      
      if (productoBD.Stock < p.Cantidad) {
        throw new Error(`Stock insuficiente para: ${productoBD.Nombre}. Disponible: ${productoBD.Stock}`);
      }

      total += productoBD.Precio * p.Cantidad;
    }

    // 1. INSERTAR EL PEDIDO
    const [resultPedido] = await connection.query(
      'INSERT INTO pedido (IdCliente, Fecha, Total, Estado) VALUES (?, NOW(), ?, ?)',
      [IdCliente, total, Estado || 'Pagado']
    );
    const IdPedido = resultPedido.insertId;

    // 2. INSERTAR DETALLES Y ACTUALIZAR STOCK
    for (let p of productos) {
      // Insertar en tabla de productos por pedido
      await connection.query(
        'INSERT INTO pedidoproducto (IdPedido, IdProducto, Cantidad) VALUES (?, ?, ?)',
        [IdPedido, p.IdProducto, p.Cantidad]
      );

      // RESTAR EL STOCK
      await connection.query(
        'UPDATE producto SET Stock = Stock - ? WHERE IdProducto = ?',
        [p.Cantidad, p.IdProducto]
      );
    }

    // Si todo salió bien, confirmamos los cambios
    await connection.commit();
    
    res.status(201).json({ ok: true, IdPedido, message: 'Venta registrada y stock actualizado' });

  } catch (err) {
    // Si algo falló, deshacemos cualquier cambio en la base de datos
    if (connection) await connection.rollback();
    console.error("Error en registro de venta:", err.message);
    res.status(400).json({ ok: false, message: err.message });
  } finally {
    // Muy importante liberar la conexión de vuelta al pool
    if (connection) connection.release();
  }
});

module.exports = router;