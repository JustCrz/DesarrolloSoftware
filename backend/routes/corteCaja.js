const express = require('express');
const router = express.Router();
const pool = require('../bd');

//Obtener los cortes realizados
router.get('/', async (req, res) => {
  try {
    const [cortes] = await pool.query('SELECT * FROM cortecaja ORDER BY FechaInicio DESC');
    res.json({ ok: true, cortes });
  } catch (err) {
    console.error('Error al obtener cortes de caja:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener cortes de caja' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [cortes] = await pool.query('SELECT * FROM cortecaja ORDER BY FechaInicio DESC');
    res.json({ ok: true, cortes });
  } catch (err) {
    console.error('Error al obtener cortes de caja:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener cortes de caja' });
  }
});

// Registrar un nuevo corte
router.post('/', async (req, res) => {
  try {
    const { FechaInicio, FechaFin, VentasTotales, CantidadTransacciones, TotalEfectivo, TotalTarjeta } = req.body;

    if (!FechaInicio || !FechaFin || VentasTotales == null || CantidadTransacciones == null) {
      return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
    }

    const [result] = await pool.query(
      `INSERT INTO cortecaja
       (FechaInicio, FechaFin, VentasTotales, CantidadTransacciones, TotalEfectivo, TotalTarjeta)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [FechaInicio, FechaFin, VentasTotales, CantidadTransacciones, TotalEfectivo || 0, TotalTarjeta || 0]
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