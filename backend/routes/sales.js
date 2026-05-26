const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const { authenticate, requireRole, requireSelfOrAdmin } = require('../middleware/auth');

// --- RUTAS DE CONSULTA (GET) ---

// 1. Obtener todas las ventas (Para Gestión de Entregas / Mapa Admin)
router.get('/', authenticate, requireRole('admin'), salesController.getAllSales);

// 2. Obtener pedidos de un cliente específico (Vista "Mis Pedidos")
router.get('/usuario/:idCliente', authenticate, requireSelfOrAdmin('idCliente'), salesController.getSalesByUser);

// 3. Obtener el detalle de una venta específica
router.get('/detalle/:id', authenticate, salesController.getSaleDetail);


// --- RUTAS DE ACCIÓN (POST / PUT) ---

// 4. Crear venta manualmente
router.post('/', authenticate, salesController.createSale);

// 5. Actualizar estado del pedido (Para cambiar a "En camino" o "Entregado")
router.put('/estado/:id', authenticate, requireRole('admin'), salesController.updateStatus);
router.put('/update-status/:id', authenticate, requireRole('admin'), salesController.updateStatus);
router.post('/adjust-stock', authenticate, requireRole('admin'), salesController.adjustStockManual);

module.exports = router;
