const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { authenticate } = require('../middleware/auth');

/**
 * RUTA DEL WEBHOOK

 */
router.post('/webhook', stripeController.handleStripeWebhook);

/**
 * RUTA PARA CREAR LA SESIÓN DE PAGO
 */
router.post('/create-checkout-session', authenticate, stripeController.createCheckoutSession);

module.exports = router;
