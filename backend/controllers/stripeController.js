/**
 * @module StripeController
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createCheckoutSession, processWebhook } = require('../services/stripe.service');

/**
 * Crear sesión de pago y pasar metadatos
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { items, idUsuario } = req.body;
    const sessionId = await createCheckoutSession(items, idUsuario);
    res.json({ id: sessionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Webhook para recibir notificación de éxito y descontar stock
 */
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const result = await processWebhook(event);
    res.json({ received: true, result });
  } catch (error) {
    console.error('Error fatal al procesar webhook:', error);
    return res.status(500).send('Error interno en la BD');
  }
};
