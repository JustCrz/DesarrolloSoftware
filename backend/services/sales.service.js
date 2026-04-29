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
      pp.IdPedido, pp.IdProducto, pp.Cantidad,
      p.Nombre, p.Precio
    FROM pedidoproducto pp
    JOIN producto p ON pp.IdProducto = p.IdProducto
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
async function processSale(IdCliente, productos) {
  if (!IdCliente) {
    throw new Error('Cliente requerido');
  }
  if (!productos || productos.length === 0) {
    throw new Error('La venta debe tener al menos un producto');
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let totalVenta = 0;

    // 🔹 Validar stock y calcular total
    for (let item of productos) {
      const [rows] = await connection.query(
        `SELECT Nombre, Precio, Stock 
         FROM producto 
         WHERE IdProducto = ? FOR UPDATE`,
        [item.IdProducto]
      );

      if (rows.length === 0) {
        throw new Error(`Producto ID ${item.IdProducto} no existe`);
      }

      if (rows[0].Stock < item.Cantidad) {
        throw new Error(`Stock insuficiente para ${rows[0].Nombre}`);
      }

      item.PrecioUnitario = rows[0].Precio;
      totalVenta += rows[0].Precio * item.Cantidad;
    }

    // 🔹 Crear pedido
    const [pedidoRes] = await connection.query(
      `INSERT INTO pedido 
       (IdCliente, Fecha, Total, Estado) 
       VALUES (?, NOW(), ?, ?)`,
      [IdCliente, totalVenta, 'PAGADO']
    );

    const idPedido = pedidoRes.insertId;

    // 🔹 Insertar productos y actualizar stock
    for (let item of productos) {
      await connection.query(
        `INSERT INTO pedidoproducto 
         (IdPedido, IdProducto, Cantidad) 
         VALUES (?, ?, ?)`,
        [idPedido, item.IdProducto, item.Cantidad]
      );

      await connection.query(
        `UPDATE producto 
         SET Stock = Stock - ? 
         WHERE IdProducto = ?`,
        [item.Cantidad, item.IdProducto]
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
