/**
 * @module CartController
 * Controlador para gestionar el carrito de compras de Marjorie Store
 */
const { 
  getClientCart, 
  addToCart, 
  updateQuantity, 
  removeFromCart, 
  emptyCart 
} = require('../services/cart.service');

/**
 * Obtener carrito de un cliente
 * @async
 * @function getCartClient
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con carrito
 */
const getCartClient = async (req, res) => {
  try {
    const idCliente = parseInt(req.params.idCliente);
    const carrito = await getClientCart(idCliente);
    return res.json({ ok: true, carrito });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al obtener carrito' });
  }
};

/**
 * Agregar producto al carrito
 * @async
 * @function addProductToCart
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de alta
 */
const addProductToCart = async (req, res) => {
  try {
    const { idCliente } = req.params;
    const { idProducto, cantidad } = req.body;

    if (!idProducto || !cantidad) {
      return res.status(400).json({
        ok: false,
        message: 'idProducto y cantidad son obligatorios'
      });
    }
    const total = await addToCart(
      parseInt(idCliente),
      parseInt(idProducto),
      parseInt(cantidad)
    );
    return res.status(200).json({
      ok: true,
      message: 'Producto agregado al carrito',
      Total: total
    });
  } catch (err) {
    console.error(err);
    if (err.message === 'Carrito no encontrado') {
      return res.status(404).json({ ok: false, message: err.message });
    }
    return res.status(500).json({
      ok: false,
      message: 'Error al agregar producto al carrito'
    });
  }
};

/**
 * Actualizar cantidad de un producto o eliminarlo si la cantidad es <= 0
 */
const updateProductQuantity = async (req, res) => {
  const { idCliente } = req.params;
  const { idProducto, cantidad } = req.body;

  try {
    const nuevoTotal = await updateQuantity(
      parseInt(idCliente),
      parseInt(idProducto),
      parseInt(cantidad)
    );
    return res.json({
      ok: true,
      message: 'Cantidad actualizada',
      Total: nuevoTotal
    });
  } catch (err) {
    console.error('ERROR REAL:', err.message);
    if (err.message && err.message.includes('Carrito no encontrado')) {
      return res.status(404).json({
        ok: false,
        message: err.message
      });
    }
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar cantidad'
    });
  }
};

/**
 * Eliminar un producto específico del carrito
 */
const removeProductFromCart = async (req, res) => {
  const { idCliente, idProducto } = req.params;
  try {
    const nuevoTotal = await removeFromCart(idCliente, idProducto);
    res.json({ ok: true, Total: nuevoTotal });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

/**
 * Vaciar todo el carrito
 */
const clearCart = async (req, res) => {
  const { idCliente } = req.params;
  try {
    await emptyCart(idCliente);
    res.json({ ok: true, message: 'Carrito vaciado' });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
};

module.exports = {
  getCartClient,
  addProductToCart,
  updateProductQuantity,
  removeProductFromCart,
  clearCart
};
