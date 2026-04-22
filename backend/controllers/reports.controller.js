/**
 * @module ReportsController
 */
const pool = require('../bd');

/**
 * Obtener el producto más vendido (Producto Estrella)
 */
async function getTopProduct(req, res) {
  try {
    const query = `
      SELECT p.Nombre as prenda, p.Imagen, SUM(pp.Cantidad) as unidades_vendidas, SUM(pp.Cantidad * p.Precio) as total_generado
      FROM pedidoproducto pp
      JOIN producto p ON pp.IdProducto = p.IdProducto
      GROUP BY p.IdProducto
      ORDER BY unidades_vendidas DESC
      LIMIT 1
    `;
    const [rows] = await pool.query(query);
    
    // Si no hay ventas, enviamos un objeto por defecto
    const producto = rows[0] || { 
      prenda: 'Sin ventas registradas', 
      Imagen: null, 
      unidades_vendidas: 0, 
      total_generado: 0 
    };
    
    res.json({ ok: true, producto });
  } catch (err) {
    console.error("Error en getTopProduct:", err);
    res.status(500).json({ ok: false, message: 'Error al obtener estadísticas' });
  }
}

/**
 * Resumen de ventas del día actual
 */
async function getDailySummary(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(IdPedido) as total_pedidos, COALESCE(SUM(Total), 0) as ingresos_sucios 
      FROM pedido 
      WHERE DATE(Fecha) = CURDATE()
    `);
    
    const datos = rows[0] || { total_pedidos: 0, ingresos_sucios: 0 };
    
    res.json({ ok: true, datos });
  } catch (err) {
    console.error("Error en getDailySummary:", err);
    res.status(500).json({ ok: false, message: 'Error en resumen' });
  }
}

/**
 * Obtener ventas filtradas por una fecha específica
 */
async function getSalesByDate(req, res) {
  const { fecha } = req.query; 
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.NombreC 
      FROM pedido p 
      JOIN cliente c ON p.IdCliente = c.IdCliente 
      WHERE DATE(p.Fecha) = ?
    `, [fecha]);
    
    res.json({ ok: true, ventasDetalle: rows });
  } catch (err) {
    console.error("Error en getSalesByDate:", err);
    res.status(500).json({ ok: false, message: 'Error al filtrar ventas' });
  }
}

// Funciones exportadas para que el router pueda reconocerlas
exports.getTopProduct = getTopProduct;
exports.getDailySummary = getDailySummary;
exports.getSalesByDate = getSalesByDate;