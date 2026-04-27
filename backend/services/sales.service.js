/**
 * @module SalesService
 * Servicio para gestionar ventas
 */

const pool = require('../bd');

/**
 * Obtener todas las ventas
 * @async
 * @function getAllSales
 * @returns {Promise<Array>} Lista de ventas con información del cliente
 */
async function getAllSales() {
  const sql = `
    SELECT p.*, c.NombreC 
    FROM pedido p 
    JOIN cliente c ON p.IdCliente = c.IdCliente 
    ORDER BY p.Fecha DESC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

/**
 * Obtener detalle de una venta específica
 * @async
 * @function getSaleDetail
 * @param {number} saleId ID del pedido
 * @returns {Promise<Array>} Detalle de productos de la venta
 */
async function getSaleDetail(saleId) {
  const sql = `
    SELECT 
      pp.IdPedido, pp.IdVariante, pp.Cantidad, pp.PrecioUnitario,
      v.Talla, v.Color, p.Nombre
    FROM pedidoproducto pp
    JOIN producto_variante v ON pp.IdVariante = v.IdVariante
    JOIN producto p ON v.IdProducto = p.IdProducto
    WHERE pp.IdPedido = ?
  `;
  const [rows] = await pool.query(sql, [saleId]);
  return rows;
}

/**
 * Procesar una venta (crear pedido y actualizar stock)
 * Usa transacciones para garantizar consistencia
 * @async
 * @function processSale
 * @param {number} idCliente ID del cliente
 * @param {Array} productos Array de productos con IdVariante y Cantidad
 * @returns {Promise<Object>} ID del pedido y total
 * @throws {Error} Si hay problemas en la transacción
 */
async function processSale(saleData) {
  const { clientId, productos } = saleData;

  if (!clientId) {
    throw new Error('Invalid client ID');
  }

  if (!productos || productos.length === 0) {
    throw new Error('Sale must have at least one item');
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let totalVenta = 0;

    // 1. Validar disponibilidad
    for (let item of productos) {
      const idVariante = item.IdVariante;

      const [varRows] = await connection.query(
        `SELECT v.Precio, v.Stock, p.Nombre 
         FROM producto_variante v 
         JOIN producto p ON v.IdProducto = p.IdProducto
         WHERE v.IdVariante = ? FOR UPDATE`,
        [idVariante]
      );

      if (varRows.length === 0) {
        throw new Error(`Variante ID ${idVariante} no existe.`);
      }

      if (varRows[0].Stock < item.Cantidad) {
        throw new Error(`Stock insuficiente para: ${varRows[0].Nombre}`);
      }

      const precioUnitario = varRows[0].Precio;
      item.PrecioUnitario = precioUnitario;
      totalVenta += precioUnitario * item.Cantidad;
    }

    // 2. Registrar pedido
    const [pedidoRes] = await connection.query(
      'INSERT INTO pedido (IdCliente, Fecha, Total, CostoEnvio, Estado) VALUES (?, NOW(), ?, ?, ?)',
      [clientId, totalVenta, 0, 'PAGADO']
    );

    const idPedido = pedidoRes.insertId;

    // 3. Registrar productos y descontar stock
    for (let item of productos) {
      await connection.query(
        'INSERT INTO pedidoproducto (IdPedido, IdVariante, Cantidad, PrecioUnitario) VALUES (?, ?, ?, ?)',
        [idPedido, item.IdVariante, item.Cantidad, item.PrecioUnitario]
      );

      await connection.query(
        'UPDATE producto_variante SET Stock = Stock - ? WHERE IdVariante = ?',
        [item.Cantidad, item.IdVariante]
      );
    }

    await connection.commit();

    return { idPedido, totalVenta };

  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getAllSales,
  getSaleDetail,
  processSale
};
