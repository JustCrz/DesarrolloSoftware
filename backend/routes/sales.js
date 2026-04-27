const express = require('express');
const router = express.Router();
const { getAllSalesController, createSaleController } = require('../controllers/sales.controller');

router.get('/', getAllSalesController);
router.post('/', createSaleController);

module.exports = router;
