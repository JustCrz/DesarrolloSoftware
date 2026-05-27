const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');

router.get('/', salesController.getAllSales);
router.get('/usuario/:idCliente', salesController.getSalesByUser);
router.get('/detalle/:id', salesController.getSaleDetail);
router.post('/', salesController.createSale);

// CORRECCIÓN: el frontend llama /update-status/:id, no /estado/:id
router.put('/update-status/:id', salesController.updateStatus);

// NUEVO: ruta que faltaba para el ajuste manual de stock
router.post('/adjust-stock', salesController.adjustStockManual);

module.exports = router;