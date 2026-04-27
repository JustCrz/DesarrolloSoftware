/**
 * @module StripeService
 * Servicio para integración con Stripe
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { processSale } = require('./sales.service');
const pool = require('../bd');

/**
 * Crear sesión de checkout con Stripe
 * @async
 * @function createCheckoutSession
 * @param {Array} items Array de items con Nombre, Precio, Cantidad
 * @param {number} idUsuario ID del usuario
 * @returns {Promise<string>} ID de la sesión de Stripe
 */
async function createCheckoutSession(items, idUsuario) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'mxn',
          product_data: { name: item.Nombre },
          unit_amount: Math.round(item.Precio * 100),
        },
        quantity: item.Cantidad,
      })),
      mode: 'payment',
      metadata: {
        items: JSON.stringify(items),
        idUsuario: idUsuario
      },
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html',
    });

    return session.id;
  } catch (error) {
    throw new Error(`Error al crear sesión de Stripe: ${error.message}`);
  }
}

/**
 * Procesar webhook de Stripe
 * @async
 * @function processWebhook
 * @param {Object} event Evento de Stripe
 * @returns {Promise<Object>} Resultado del procesamiento
 */
async function processWebhook(event) {
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const itemsRaw = session.metadata?.items;
      const idUsuario = session.metadata?.idUsuario;

      if (!itemsRaw || !idUsuario) {
        throw new Error('Metadata incompleta en la sesión de Stripe');
      }

      const items = JSON.parse(itemsRaw);

      console.log('Pago recibido, iniciando actualización de inventario...');
      
      const { idPedido } = await processSale(idUsuario, items);
      console.log('Inventario actualizado correctamente.');

      await pool.query(
        'UPDATE pedido SET Estado = ? WHERE IdPedido = ?',
        ['PAGADO', idPedido]
      );
      console.log('Pedido actualizado a PAGADO.');

      return { success: true, idPedido };
    }

    return { success: false, message: 'Tipo de evento no procesado' };
  } catch (error) {
    console.error('Error fatal al procesar webhook:', error);
    throw error;
  }
}

module.exports = {
  createCheckoutSession,
  processWebhook
};
