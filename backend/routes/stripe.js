const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripe.controller'); // Corregido el nombre

/**
 * RUTA DEL WEBHOOK
 * IMPORTANTE: El webhook requiere los datos "raw" (crudos) para validar la firma de Stripe.
 */
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.handleStripeWebhook);

/**
 * RUTA PARA CREAR LA SESIÓN DE PAGO
 */
router.post('/create-checkout-session', stripeController.createCheckoutSession);

module.exports = router;