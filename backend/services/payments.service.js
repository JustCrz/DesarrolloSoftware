/**
 * @module PaymentsService
 * Servicio para gestionar pagos
 */

const pool = require('../bd');

/**
 * Obtener todos los pagos
 * @async
 * @function getAllPayments
 * @returns {Promise<Array>} Lista de pagos procesados
 */
async function getAllPayments() {
  const [pagos] = await pool.query(
    `
    SELECT p.IdPedido, p.IdCliente, p.Total, p.Estado, p.Fecha
    FROM pedido p
    WHERE p.Estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
    ORDER BY p.Fecha DESC
  `
  );
  return pagos;
}

/**
 * Obtener pago de un pedido específico
 * @async
 * @function getPaymentByOrder
 * @param {number} idPedido ID del pedido
 * @returns {Promise<Array>} Información del pago
 */
async function getPaymentByOrder(idPedido) {
  const [pagos] = await pool.query('SELECT * FROM pedido WHERE IdPedido = ?', [idPedido]);
  return pagos;
}

/**
 * Registrar/actualizar un pago
 * @async
 * @function registerPayment
 * @param {number} idPedido ID del pedido
 * @returns {Promise<Object>} Confirmación de registro
 * @throws {Error} Si falta el ID del pedido
 */
async function registerPayment(idPedido) {
  if (!idPedido) {
    throw new Error('Falta IdPedido');
  }

  const [result] = await pool.query(
  'UPDATE pedido SET Estado = ? WHERE IdPedido = ?',
  ['PAGADO', idPedido]
  );

  if (result.affectedRows === 0) {
    throw new Error('Pedido no encontrado');
  }

  return { message: 'Pedido actualizado a pagado' };
}

module.exports = {
  getAllPayments,
  getPaymentByOrder,
  registerPayment
};
