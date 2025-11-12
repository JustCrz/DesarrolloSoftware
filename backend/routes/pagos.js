const express = require('express');
const router = express.Router();
const pool = require('../bd');

//Obtener los pagos
router.get('/', async (req, res) => {
  try {
    const [pagos] = await pool.query(`
      SELECT pa.*, pe.IdCliente, pe.Total, pe.Estado AS EstadoPedido
      FROM pago pa
      JOIN pedido pe ON pa.IdPedido = pe.IdPedido
      ORDER BY pa.Fecha DESC
    `);
    res.json({ ok: true, pagos });
  } catch (err) {
    console.error('Error al obtener pagos:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener pagos' });
  }
});

//Obtener un pago especifico
router.get('/:idPedido', async (req, res) => {
  const idPedido = parseInt(req.params.idPedido);
  try {
    const [pagos] = await pool.query(
      'SELECT * FROM pago WHERE IdPedido = ?',
      [idPedido]
    );
    res.json({ ok: true, pagos });
  } catch (err) {
    console.error('Error al obtener pagos de pedido:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener pagos del pedido' });
  }
});

//Registrar un pago hecho
router.post('/', async (req, res) => {
  try {
    const { IdPedido, MetodoPago, Monto, Fecha } = req.body;

    if (!IdPedido || !MetodoPago || !Monto) {
      return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
    }

    // Insertar pago
    const [result] = await pool.query(
      'INSERT INTO pago (IdPedido, MetodoPago, Monto, Fecha, Estado) VALUES (?, ?, ?, ?, ?)',
      [IdPedido, MetodoPago, Monto, Fecha || new Date(), 'Pagado']
    );

    // Actualizar estado del pedido a "Pagado"
    await pool.query(
      'UPDATE pedido SET Estado = ? WHERE IdPedido = ?',
      ['Pagado', IdPedido]
    );

    res.status(201).json({
      ok: true,
      message: 'Pago registrado y pedido actualizado a pagado',
      pago: { IdPago: result.insertId, IdPedido, MetodoPago, Monto, Fecha: Fecha || new Date(), Estado: 'Pagado' }
    });
  } catch (err) {
    console.error('Error al registrar pago:', err);
    res.status(500).json({ ok: false, message: 'Error al registrar pago' });
  }
});

module.exports = router;