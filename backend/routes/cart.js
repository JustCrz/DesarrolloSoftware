const express = require('express');
const router = express.Router();
// Importamos el controlador donde movimos toda tu lógica anterior
const { getCartClient, addProductToCart, updateProductQuantity, removeProductFromCart, clearCart } = require('../controllers/cart.controller');

/**
 * @route GET /api/cart/:idCliente
 * @desc  Obtener el carrito con productos
 */
router.get('/:idCliente', getCartClient);
/**
 * @route POST /api/cart/:idCliente
 * @desc  Agregar o actualizar cantidad
 */
router.post('/:idCliente', addProductToCart);
/**
 * @route PUT /api/cart/:idCliente
 * @desc  Actualizar cantidad manual (Soporta eliminar si cantidad <= 0)
 */
router.put('/:idCliente', updateProductQuantity);
/**
 * @route DELETE /api/cart/:idCliente/:idVariante
 * @desc  Eliminar un producto específico y recalcular total
 */
router.delete('/:idCliente/:idVariante', removeProductFromCart);
/**
 * @route DELETE /api/cart/:idCliente
 * @desc  Vaciar todo el carrito
 */
router.delete('/:idCliente', clearCart);

module.exports = router;
