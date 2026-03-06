const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');

router.get('/', paymentsController.getPayments);
router.get('/:idPedido', paymentsController.getPaymentsByOrder);
router.post('/', paymentsController.registerPayment);

module.exports = router;
