const pool = require('../bd');

async function getPedidosMapa(req, res) {
  try {
    // Buscamos pedidos que tengan coordenadas y no estén entregados aún
    const [rows] = await pool.query(
      'SELECT IdPedido, Latitud, Longitud, Estado, Total, Fecha FROM pedido WHERE Latitud IS NOT NULL AND Latitud != 0'
    );
    res.json({ ok: true, pedidos: rows });
  } catch (err) {
    console.error('Error al obtener pedidos para el mapa:', err);
    res.status(500).json({ ok: false, message: 'Error al cargar los puntos del mapa' });
  }
}

module.exports = { getPedidosMapa };