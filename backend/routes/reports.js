const express = require('express');
const router = express.Router();
const { getTopProductController, getDailySummaryController, getSalesByDateController } = require('../controllers/reports.controller');

router.get('/daily-summary', getDailySummaryController);
router.get('/top-product', getTopProductController);
router.get('/sales-by-date', getSalesByDateController);

module.exports = router;