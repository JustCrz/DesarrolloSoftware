/**
 * @module ReportsController
 */
const { getTopProduct, getDailySummary, getSalesByDate } = require('../services/reports.service');

/**
 * Obtener el producto más vendido (Producto Estrella)
 */
const getTopProductController = async (req, res) => {
  try {
    const producto = await getTopProduct();
    res.json({ ok: true, producto });
  } catch (err) {
    console.error("Error en getTopProduct:", err);
    res.status(500).json({ ok: false, message: 'Error al obtener estadísticas' });
  }
};

/**
 * Resumen de ventas del día actual
 */
const getDailySummaryController = async (req, res) => {
  try {
    const datos = await getDailySummary();
    res.json({ ok: true, datos });
  } catch (err) {
    console.error("Error en getDailySummary:", err);
    res.status(500).json({ ok: false, message: 'Error en resumen' });
  }
};

/**
 * Obtener ventas filtradas por una fecha específica
 */
const getSalesByDateController = async (req, res) => {
  const { fecha } = req.query;
  try {
    const ventasDetalle = await getSalesByDate(fecha);
    res.json({ ok: true, ventasDetalle });
  } catch (err) {
    console.error("Error en getSalesByDate:", err);
    res.status(500).json({ ok: false, message: 'Error al filtrar ventas' });
  }
};

module.exports = {
  getTopProductController,
  getDailySummaryController,
  getSalesByDateController
};
