const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');

router.get('/', salesController.getSales);
router.post('/', salesController.registerSale);

module.exports = router;
