const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

// Esta ruta será llamada por el app.use('/api/stripe') normal
router.post('/create-checkout-session', stripeController.createCheckoutSession);

module.exports = router;
