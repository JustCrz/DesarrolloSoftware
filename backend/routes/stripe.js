const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

/**
 * RUTA DEL WEBHOOK

 */
router.post('/webhook', stripeController.handleStripeWebhook);

/**
 * RUTA PARA CREAR LA SESIÓN DE PAGO
 */
router.post('/create-checkout-session', stripeController.createCheckoutSession);

module.exports = router;