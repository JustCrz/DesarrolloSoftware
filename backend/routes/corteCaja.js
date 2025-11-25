const express = require('express');
const router = express.Router();
const pool = require('../bd');

// Obtener cortes de caja
router.get('/', async (req, res) => {
  try {
    const [cortes] = await pool.query('SELECT * FROM cortecaja ORDER BY FechaInicio DESC');
    res.json({ ok: true, cortes });
  } catch (err) {
    console.error('Error al obtener cortes de caja:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener cortes de caja' });
  }
});

// Registrar nuevo corte de caja
router.post('/', async (req, res) => {
  try {
    const { FechaInicio, FechaFin, TotalEfectivo = 0, TotalTarjeta = 0 } = req.body;

    if (!FechaInicio || !FechaFin) {
      return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
    }

    // Calcular total de ventas y cantidad de transacciones entre fechas
    const [ventas] = await pool.query(`
      SELECT SUM(Total) AS VentasTotales, COUNT(*) AS CantidadTransacciones
      FROM pedido
      WHERE Fecha BETWEEN ? AND ?
    `, [FechaInicio, FechaFin]);

    const VentasTotales = ventas[0]?.VentasTotales || 0;
    const CantidadTransacciones = ventas[0]?.CantidadTransacciones || 0;

    // Insertar corte
    const [result] = await pool.query(
      `INSERT INTO cortecaja (FechaInicio, FechaFin, VentasTotales, CantidadTransacciones, TotalEfectivo, TotalTarjeta)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [FechaInicio, FechaFin, VentasTotales, CantidadTransacciones, TotalEfectivo, TotalTarjeta]
    );

    res.status(201).json({
      ok: true,
      message: 'Corte registrado correctamente',
      corte: { IdCorte: result.insertId, FechaInicio, FechaFin, VentasTotales, CantidadTransacciones, TotalEfectivo, TotalTarjeta }
    });

  } catch (err) {
    console.error('Error al registrar corte de caja:', err);
    res.status(500).json({ ok: false, message: 'Error al registrar corte de caja' });
  }
});

module.exports = router;
