/**
 * @module SalesController
 */
const { getAllSales, getSaleDetail, processSale } = require('../services/sales.service');

/**
 * Obtener todas las ventas con información del cliente
 */
const getAllSalesController = async (req, res) => {
  try {
    const sales = await getAllSales();
    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener ventas' });
  }
};

/**
 * Obtener detalle de una venta específica
 */
const getSaleDetailController = async (req, res) => {
  const { id } = req.params;
  try {
    const detalle = await getSaleDetail(id);
    res.json({ ok: true, detalle });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener detalle' });
  }
};

/**
 * Crear venta usando TRANSACCIONES (Para llamadas desde la API)
 */
const createSaleController = async (req, res) => {
  const { IdCliente, productos } = req.body;
  try {
    const result = await processSale(IdCliente, productos);
    res.status(201).json({ ok: true, message: 'Venta registrada con éxito', result });
  } catch (err) {
    console.error('Error en createSale:', err.message);
    res.status(400).json({ ok: false, message: err.message });
  }
};

module.exports = {
  getAllSalesController,
  createSaleController,
  getSaleDetailController,
  processSale
};
