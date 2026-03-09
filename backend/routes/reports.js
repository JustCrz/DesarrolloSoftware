const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');

// Estas tres rutas ahora conectan perfectamente con las funciones 
// que definimos y exportamos en reports.controller.js
router.get('/daily-summary', reportsController.getDailySummary);
router.get('/top-product', reportsController.getTopProduct);
router.get('/sales-by-date', reportsController.getSalesByDate);

module.exports = router;