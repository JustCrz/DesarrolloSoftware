/**
 * @module ProductsController
 */
const {
  getAllProducts,
  getProductsProviders,
  createProduct,
  removeProduct,
  updateProduct
} = require('../services/products.service');
/**
 * Obtener todos los productos para el catálogo público
 */
const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.status(200).json({ok: true, products});
  } catch (error) {
    console.log(error)
    res.status(500).json({ok: false, message: 'Error al obtener productos' });
  }
};

const getProductsWithProviders = async (req, res) => {
  try {
    const products = await getProductsProviders();
    res.json({ ok: true, products });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener productos con proveedores' });
  }
};

/**
 * Registrar un nuevo producto (Maneja la imagen de Multer)
 */
const addProduct = async (req, res) => {
  try {
    const product = await createProduct(req.body, req.file);
    res.status(201).json({ ok: true, product });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
};


const updateProductController = async (req, res) => {
  try {
    await updateProduct(req.params.id, req.body, req.file);
    res.json({ ok: true, message: 'Producto actualizado correctamente' });
  } catch (error) {
    res.status(404).json({ ok: false, message: 'Error al actualizar producto' });
  }
};

/**
 * Eliminar producto y su archivo de imagen asociado
 */
const deleteProduct = async (req, res) => {
  try {
    await removeProduct(req.params.id);
    res.json({ ok: true, message: 'Producto eliminado' });
  } catch (error) {
    res.status(404).json({ ok: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductsWithProviders,
  addProduct,
  deleteProduct,
  updateProductController
};
