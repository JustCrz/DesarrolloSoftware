const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

router.get('/:idCliente', cartController.getCartClient);
router.post('/:idCliente', cartController.addProductToCart);
router.delete('/:idCliente/:idProducto', cartController.removeProductFromCart);
router.put('/:idCliente', cartController.updateProductQuantity);

module.exports = router;
