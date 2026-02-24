const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

// Obtener un carro de un cliente
router.get('/:idCliente', async (req, res) => {
  const idCliente = parseInt(req.params.idCliente);

  try {
    const carrito = await cartController.getCartClient(idCliente);
    res.json({ ok: true, carrito });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener carrito' });
  }
});

// Agregar producto a carrito
router.post('/:idCliente', async (req, res) => {
  const idCliente = parseInt(req.params.idCliente);
  const { IdProducto, Cantidad } = req.body;

  try {
    const total = await cartController.addProductToCart(idCliente, IdProducto, Cantidad);
    res.status(201).json({ ok: true, message: 'Producto agregado al carrito', Total: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al agregar producto al carrito' });
  }
});

// Eliminar un producto del carrito
router.delete('/:idCliente/:idProducto', async (req, res) => {
  const idCliente = parseInt(req.params.idCliente);
  const idProducto = parseInt(req.params.idProducto);

  try {
    const total = await cartController.removeProductFromCart(idCliente, idProducto);
    if (total === null) {
      return res.status(404).json({ ok: false, message: 'Carrito no encontrado' });
    }

    res.json({ ok: true, message: 'Producto eliminado del carrito', Total: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al eliminar producto del carrito' });
  }
});

// Actualizar cantidad de producto
router.put('/:idCliente', async (req, res) => {
  const idCliente = parseInt(req.params.idCliente);
  const { IdProducto, Cantidad } = req.body;

  try {
    const total = await cartController.updateProductQuantity(idCliente, IdProducto, Cantidad);
    if (total === null) {
      return res.status(404).json({ ok: false, message: 'Carrito no encontrado' });
    }

    res.json({ ok: true, message: 'Cantidad actualizada', Total: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al actualizar cantidad del carrito' });
  }
});

module.exports = router;
