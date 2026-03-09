const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

// Esta ruta será llamada por el POST que pusimos arriba en el server.js
// Como server.js ya puso express.raw, esta ruta recibirá el buffer correctamente
router.post('/webhook', stripeController.handleStripeWebhook);

// Esta ruta será llamada por el app.use('/api/stripe') normal
router.post('/create-checkout-session', stripeController.createCheckoutSession);

module.exports = router;