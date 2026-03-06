/**
 * @module PaymentsController
 */

const pool = require('../bd');

/**
 * Obtener todos los pagos
 * @async
 * @function getPayments
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con pagos
 */
async function getPayments(req, res) {
  try {
    const [pagos] = await pool.query(
      `
      SELECT pa.*, p.IdCliente, p.Total, p.Estado AS EstadoPedido
      FROM pago pa
      JOIN pedido p ON pa.IdPedido = p.IdPedido
      ORDER BY pa.Fecha DESC
    `
    );
    return res.json({ ok: true, pagos });
  } catch (err) {
    console.error('Error al obtener pagos:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener pagos' });
  }
}

/**
 * Obtener pagos de un pedido
 * @async
 * @function getPaymentsByOrder
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con pagos del pedido
 */
async function getPaymentsByOrder(req, res) {
  try {
    const idPedido = parseInt(req.params.idPedido);
    const [pagos] = await pool.query('SELECT * FROM pago WHERE IdPedido = ?', [idPedido]);
    return res.json({ ok: true, pagos });
  } catch (err) {
    console.error('Error al obtener pagos de pedido:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener pagos del pedido' });
  }
}

/**
 * Registrar un pago
 * @async
 * @function registerPayment
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de registro
 */
async function registerPayment(req, res) {
  try {
    const { IdPedido, MetodoPago, Monto, Fecha } = req.body;

    if (!IdPedido || !MetodoPago || !Monto) {
      return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
    }

    const paymentDate = Fecha || new Date();

    const [result] = await pool.query(
      'INSERT INTO pago (IdPedido, MetodoPago, Monto, Fecha, Estado) VALUES (?, ?, ?, ?, ?)',
      [IdPedido, MetodoPago, Monto, paymentDate, 'Pagado']
    );

    await pool.query(
      'UPDATE pedido SET Estado = ? WHERE IdPedido = ?',
      ['Pagado', IdPedido]
    );

    return res.status(201).json({
      ok: true,
      message: 'Pago registrado y pedido actualizado a pagado',
      pago: {
        IdPago: result.insertId,
        IdPedido,
        MetodoPago,
        Monto,
        Fecha: paymentDate,
        Estado: 'Pagado'
      }
    });
  } catch (err) {
    console.error('Error al registrar pago:', err);
    return res.status(500).json({ ok: false, message: 'Error al registrar pago' });
  }
}

exports.getPayments = getPayments;
exports.getPaymentsByOrder = getPaymentsByOrder;
exports.registerPayment = registerPayment;
