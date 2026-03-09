/**
 * @module SalesController
 */
<<<<<<< HEAD
const pool = require('../bd');

/**
 * Obtener todas las ventas con información del cliente
 */
async function getAllSales(req, res) {
  try {
    const sql = `
      SELECT p.*, c.NombreC 
      FROM pedido p 
      JOIN cliente c ON p.IdCliente = c.IdCliente 
      ORDER BY p.Fecha DESC
    `;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener ventas' });
=======

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
>>>>>>> origin/main
  }
}

/**
<<<<<<< HEAD
 * Obtener detalle de una venta específica
 */
async function getSaleDetail(req, res) {
  const { id } = req.params;
  try {
    const sql = `
      SELECT pp.*, prod.Nombre 
      FROM pedidoproducto pp
      JOIN producto prod ON pp.IdProducto = prod.IdProducto
      WHERE pp.IdPedido = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    res.json({ ok: true, detalle: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener detalle' });
  }
}

/**
 * Crear venta usando TRANSACCIONES (Para llamadas desde la API)
 */
async function createSale(req, res) {
  const { IdCliente, productos } = req.body;
  try {
    await processSaleInternally(IdCliente, productos);
    res.status(201).json({ ok: true, message: 'Venta registrada con éxito' });
  } catch (err) {
    console.error('❌ Error en createSale:', err.message);
    res.status(400).json({ ok: false, message: err.message });
  }
}

/**
 * Lógica centralizada para registrar venta y descontar stock
 * Esta es la que llama el Webhook de Stripe
 */
async function processSaleInternally(IdCliente, productos) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let totalVenta = 0;

        // 1. Validar disponibilidad
        for (let item of productos) {
            const [prodRows] = await connection.query(
                'SELECT Precio, Stock, Nombre FROM producto WHERE IdProducto = ? FOR UPDATE', 
                [item.IdProducto]
            );

            if (prodRows.length === 0) throw new Error(`Producto ID ${item.IdProducto} no existe.`);
            if (prodRows[0].Stock < item.Cantidad) throw new Error(`Stock insuficiente para: ${prodRows[0].Nombre}`);

            totalVenta += prodRows[0].Precio * item.Cantidad;
        }

        // 2. Registrar pedido
        const [pedidoRes] = await connection.query(
            'INSERT INTO pedido (IdCliente, Fecha, Total, Estado) VALUES (?, NOW(), ?, ?)',
            [IdCliente, totalVenta, 'Pagado']
        );
        const idPedido = pedidoRes.insertId;

        // 3. Registrar productos y descontar stock
        for (let item of productos) {
            await connection.query(
                'INSERT INTO pedidoproducto (IdPedido, IdProducto, Cantidad) VALUES (?, ?, ?)',
                [idPedido, item.IdProducto, item.Cantidad]
            );
            await connection.query(
                'UPDATE producto SET Stock = Stock - ? WHERE IdProducto = ?',
                [item.Cantidad, item.IdProducto]
            );
        }

        await connection.commit();
        console.log("✅ Venta procesada correctamente. ID Pedido:", idPedido);
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('❌ Error crítico en processSaleInternally:', err.message);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

// Exportamos todas las funciones necesarias
exports.getAllSales = getAllSales;
exports.createSale = createSale;
exports.getSaleDetail = getSaleDetail;
exports.processSaleInternally = processSaleInternally;
=======
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
>>>>>>> origin/main
