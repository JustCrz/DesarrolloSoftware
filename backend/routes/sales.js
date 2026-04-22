const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');

// 1. Pon la ruta de PRODUCTOS primero (Prioridad alta)
// Cambiamos el nombre ligeramente para que no haya duda
router.get('/detalle/:id', salesController.getSaleDetail);

// 2. Obtener todas las ventas (Panel Admin)
router.get('/', salesController.getAllSales);

// 3. Crear nueva venta (Checkout)
router.post('/', salesController.createSale);
// Ruta para actualizar el estado del pedido (Admin)
router.put('/update-status/:id', salesController.updateStatus);

module.exports = router;