const express = require('express');
const router = express.Router();
const { getPayments, getPaymentsByOrder, registerPaymentController } = require('../controllers/payments.controller');

router.get('/', getPayments);
router.get('/:idPedido', getPaymentsByOrder);
router.post('/', registerPaymentController);

module.exports = router;
