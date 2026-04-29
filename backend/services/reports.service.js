/**
 * @module ReportsService
 * Servicio para generar reportes
 */

const pool = require('../bd');

/**
 * Obtener el producto más vendido
 * @async
 * @function getTopProduct
 * @returns {Promise<Object>} Producto más vendido con estadísticas
 */
async function getTopProduct() {
  const query = `
    SELECT 
      p.Nombre AS prenda,
      p.Imagen,
      SUM(pp.Cantidad) AS unidades_vendidas,
      SUM(pp.Cantidad * p.Precio) AS total_generado
    FROM pedidoproducto pp
    JOIN producto p ON pp.IdProducto = p.IdProducto
    GROUP BY p.IdProducto
    ORDER BY unidades_vendidas DESC
    LIMIT 1
  `;
  const [rows] = await pool.query(query);
  const producto = rows[0]
  ? {
      ...rows[0],
      unidades_vendidas: Number(rows[0].unidades_vendidas),
      total_generado: Number(rows[0].total_generado)
    }
  : { 
      prenda: 'Sin ventas registradas',
      Imagen: null,
      unidades_vendidas: 0,
      total_generado: 0
    };
  return producto;
}

/**
 * Obtener resumen de ventas del día
 * @async
 * @function getDailySummary
 * @returns {Promise<Object>} Total de pedidos e ingresos del día
 */
async function getDailySummary() {
  const [rows] = await pool.query(`
    SELECT COUNT(IdPedido) as total_pedidos, COALESCE(SUM(Total), 0) as ingresos_sucios 
    FROM pedido 
    WHERE DATE(Fecha) = CURDATE()
  `);
  
  const datos = rows[0] || { total_pedidos: 0, ingresos_sucios: 0 };
  
  return datos;
}

/**
 * Obtener ventas de una fecha específica
 * @async
 * @function getSalesByDate
 * @param {string} fecha Fecha en formato YYYY-MM-DD
 * @returns {Promise<Array>} Ventas del día especificado
 */
async function getSalesByDate(fecha) {
  const [rows] = await pool.query(`
    SELECT p.*, c.NombreC 
    FROM pedido p 
    JOIN cliente c ON p.IdCliente = c.IdCliente 
    WHERE DATE(p.Fecha) = ?
  `, [fecha]);
  
  return rows;
}

module.exports = {
  getTopProduct,
  getDailySummary,
  getSalesByDate
};
