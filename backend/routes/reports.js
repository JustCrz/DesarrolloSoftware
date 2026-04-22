const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');


router.get('/daily-summary', reportsController.getDailySummary);
router.get('/top-product', reportsController.getTopProduct);
router.get('/sales-by-date', reportsController.getSalesByDate);

module.exports = router;