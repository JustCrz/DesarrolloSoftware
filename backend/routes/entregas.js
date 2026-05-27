const express = require('express');
const router = express.Router();
const entregasController = require('../controllers/entregas.controller');

router.get('/mapa', entregasController.getPedidosMapa);

module.exports = router;