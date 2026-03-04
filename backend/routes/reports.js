const express = require('express');
const router = express.Router();
const pool = require('../bd');

// Obtener resumen diario (Ventas hoy y total pedidos)
router.get('/daily-summary', async (req, res) => {
  try {
    // Usamos la vista que creamos en SQL
    const [rows] = await pool.query('SELECT * FROM vista_ingresos_periodo WHERE Fecha = CURDATE()');
    
    const datos = rows[0] || { total_pedidos: 0, ingresos_sucios: 0, ticket_promedio: 0 };
    res.json({ ok: true, datos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener resumen' });
  }
});

// Obtener el producto más vendido (Prenda estrella)
router.get('/top-product', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vista_productos_estrella LIMIT 1');
    res.json({ ok: true, producto: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener producto estrella' });
  }
});

module.exports = router;