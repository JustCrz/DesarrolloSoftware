/**
 * @module SalesController
 */

const pool = require('../bd');

/**
 * Obtener ventas
 * @async
 * @function getSales
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con pedidos
 */
async function getSales(req, res) {
  try {
    const [pedidos] = await pool.query(
      `
      SELECT p.IdPedido, p.IdCliente, c.NombreC, p.Fecha, p.Total, p.Estado
      FROM pedido p
      JOIN cliente c ON p.IdCliente = c.IdCliente
      ORDER BY p.Fecha DESC
    `
    );

    for (const pedido of pedidos) {
      const [productos] = await pool.query(
        `
        SELECT pp.IdProducto, pr.Nombre, pp.Cantidad, pr.Precio
        FROM pedidoproducto pp
        JOIN producto pr ON pp.IdProducto = pr.IdProducto
        WHERE pp.IdPedido = ?
      `,
        [pedido.IdPedido]
      );
      pedido.productos = productos;
    }

    return res.json({ ok: true, pedidos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al obtener pedidos' });
  }
}

/**
 * Registrar una venta
 * @async
 * @function registerSale
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de registro
 */
async function registerSale(req, res) {
  try {
    const idCliente = req.body.IdCliente || req.body.usuarioId;
    const productos = req.body.productos || req.body.items || [];
    const estado = req.body.Estado;

    if (!idCliente || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ ok: false, message: 'Datos de venta incompletos' });
    }

    let total = 0;
    for (const p of productos) {
      const idProducto = p.IdProducto || p.ProductoId;
      const cantidad = p.Cantidad || p.cantidad;

      if (!idProducto || !cantidad) continue;

      const [rows] = await pool.query('SELECT Precio FROM producto WHERE IdProducto = ?', [idProducto]);
      if (rows.length === 0) continue;

      total += rows[0].Precio * cantidad;
      p.Precio = rows[0].Precio;
      p.IdProducto = idProducto;
      p.Cantidad = cantidad;
    }

    const [result] = await pool.query(
      'INSERT INTO pedido (IdCliente, Fecha, Total, Estado) VALUES (?, NOW(), ?, ?)',
      [idCliente, total, estado || 'Pendiente']
    );
    const idPedido = result.insertId;

    for (const p of productos) {
      await pool.query(
        'INSERT INTO pedidoproducto (IdPedido, IdProducto, Cantidad) VALUES (?, ?, ?)',
        [idPedido, p.IdProducto, p.Cantidad]
      );
    }

    return res.status(201).json({ ok: true, IdPedido: idPedido, productos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al registrar pedido' });
  }
}

exports.getSales = getSales;
exports.registerSale = registerSale;
