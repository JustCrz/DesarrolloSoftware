const express = require('express');
const router = express.Router();
// Importamos el controlador 
const cartController = require('../controllers/cart.controller');

/**
 * @route GET /api/cart/:idCliente
 * @desc  Obtener el carrito con productos 
 */
router.get('/:idCliente', cartController.getCartClient);

/**
 * @route POST /api/cart/:idCliente
 * @desc  Agregar o actualizar cantidad 
 */
router.post('/:idCliente', cartController.addProductToCart);

/**
 * @route PUT /api/cart/:idCliente
 * @desc  Actualizar cantidad manual 
 */
router.put('/:idCliente', cartController.updateProductQuantity); 

/**
 * @route DELETE /api/cart/:idCliente/:idProducto
 * @desc  Eliminar un producto específico y recalcular total
 */
router.delete('/:idCliente/:idProducto', cartController.removeProductFromCart);

module.exports = router;
