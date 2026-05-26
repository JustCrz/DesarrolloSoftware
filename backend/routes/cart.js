const express = require('express');
const router = express.Router();
// Importamos el controlador 
const cartController = require('../controllers/cart.controller');
const { authenticate, requireSelfOrAdmin } = require('../middleware/auth');

/**
 * @route GET /api/cart/:idCliente
 * @desc  Obtener el carrito con productos 
 */
router.get('/:idCliente', authenticate, requireSelfOrAdmin('idCliente'), cartController.getCartClient);

/**
 * @route POST /api/cart/:idCliente
 * @desc  Agregar o actualizar cantidad 
 */
router.post('/:idCliente', authenticate, requireSelfOrAdmin('idCliente'), cartController.addProductToCart);

/**
 * @route PUT /api/cart/:idCliente
 * @desc  Actualizar cantidad manual 
 */
router.put('/:idCliente', authenticate, requireSelfOrAdmin('idCliente'), cartController.updateProductQuantity); 

/**
 * @route DELETE /api/cart/:idCliente/:idProducto
 * @desc  Eliminar un producto específico y recalcular total
 */
router.delete('/:idCliente/:idProducto', authenticate, requireSelfOrAdmin('idCliente'), cartController.removeProductFromCart);

module.exports = router;
