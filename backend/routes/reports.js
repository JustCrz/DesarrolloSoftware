const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate, requireRole } = require('../middleware/auth');


router.get('/daily-summary', authenticate, requireRole('admin'), reportsController.getDailySummary);
router.get('/top-product', reportsController.getTopProduct);
router.get('/sales', authenticate, requireRole('admin'), reportsController.getSalesByRange);
router.get('/sales-by-date', authenticate, requireRole('admin'), reportsController.getSalesByDate);

module.exports = router;
