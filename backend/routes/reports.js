const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');


router.get('/daily-summary', reportsController.getDailySummary);
router.get('/top-product', reportsController.getTopProduct);
router.get('/sales-by-date', reportsController.getSalesByDate);

// Ruta que usa el frontend: /api/reports/sales?start=...&end=...
router.get('/sales', async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ ok: false, message: 'Faltan fechas' });
  try {
    const [rows] = await require('../bd').query(
      `SELECT COUNT(*) as totalPedidos, COALESCE(SUM(Total),0) as totalIngresos 
       FROM pedido WHERE DATE(Fecha) BETWEEN ? AND ?`,
      [start, end]
    );
    res.json({ totalPedidos: rows[0].totalPedidos, totalIngresos: rows[0].totalIngresos });
  } catch(err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;