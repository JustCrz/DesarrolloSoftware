const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');

<<<<<<< HEAD
router.get('/', salesController.getAllSales);
router.post('/', salesController.createSale);

module.exports = router;
=======
router.get('/', salesController.getSales);
router.post('/', salesController.registerSale);

module.exports = router;
>>>>>>> origin/main
