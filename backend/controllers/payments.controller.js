/**
 * @module PaymentsController
 */

const { getAllPayments, getPaymentByOrder, registerPayment } = require('../services/payments.service');

/**
 * Obtener todos los pagos (basado en pedidos pagados)
 * @async
 * @function getPayments
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con pagos
 */
const getPayments = async (req, res) => {
  try {
    const pagos = await getAllPayments();
    return res.json({ ok: true, pagos });
  } catch (err) {
    console.error('Error al obtener pagos:', err);
    return res.status(404).json({ ok: false, message: 'Error al obtener pagos' });
  }
};

/**
 * Obtener pago de un pedido
 * @async
 * @function getPaymentsByOrder
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con pago del pedido
 */
const getPaymentsByOrder = async (req, res) => {
  try {
    const idPedido = parseInt(req.params.idPedido);
    const pagos = await getPaymentByOrder(idPedido);
    return res.json({ ok: true, pagos });
  } catch (err) {
    console.error('Error al obtener pagos de pedido:', err);
    return res.status(400).json({ ok: false, message: 'Error al obtener pagos del pedido' });
  }
};

/**
 * Registrar un pago (actualiza estado del pedido)
 * @async
 * @function registerPaymentController
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de registro
 */
const registerPaymentController = async (req, res) => {
  try {
    const { IdPedido } = req.body;
    const result = await registerPayment(IdPedido);

    return res.status(201).json({
      ok: true,
      message: result.message
    });
  } catch (err) {
    console.error('Error al registrar pago:', err);
    if (err.message.includes('Falta')) {
      return res.status(400).json({ ok: false, message: err.message });
    }
    return res.status(404).json({ ok: false, message: 'Error al registrar pago' });
  }
};

module.exports = {
  getPayments,
  getPaymentsByOrder,
  registerPaymentController
};
