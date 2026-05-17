const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');

// --- RUTAS DE CONSULTA (GET) ---

// 1. Obtener todas las ventas (Para Gestión de Entregas / Mapa Admin)
router.get('/', salesController.getAllSales);

// 2. Obtener pedidos de un cliente específico (Vista "Mis Pedidos")
router.get('/usuario/:idCliente', salesController.getSalesByUser);

// 3. Obtener el detalle de una venta específica
router.get('/detalle/:id', salesController.getSaleDetail);


// --- RUTAS DE ACCIÓN (POST / PUT) ---

// 4. Crear venta manualmente
router.post('/', salesController.createSale);

// 5. Actualizar estado del pedido (Para cambiar a "En camino" o "Entregado")
router.put('/estado/:id', salesController.updateStatus);

module.exports = router;