/**
 * @module ProvidersController
 */
const { 
  getAllProviders, 
  createProvider, 
  deleteProvider, 
  updateProvider 
} = require('../services/providers.service');

/**
 * Obtener todos los proveedores
 * @async
 * @function getProviders
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con proveedores
 */
const getProviders = async (req, res) => {
  try {
    const providers = await getAllProviders();
    return res.json({ ok: true, providers, provider: providers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al obtener proveedores' });
  }
};

/**
 * Registrar un nuevo proveedor
 */
const addProvider = async (req, res) => {
  const { Nombre, Telefono, Correo, Direccion } = req.body;
  
  try {
    const id = await createProvider({ Nombre, Telefono, Correo, Direccion });
    res.status(201).json({ 
      ok: true, 
      message: 'Proveedor registrado correctamente',
      id
    });
  } catch (err) {
    console.error(err);
    if (err.message.includes('ya está registrado')) {
      return res.status(400).json({ ok: false, message: err.message });
    }
    res.status(500).json({ ok: false, message: 'Error al registrar proveedor' });
  }
};

/**
 * Eliminar un proveedor por ID
 */
const deleteProviderController = async (req, res) => {
  const { id } = req.params;
  try {
    await deleteProvider(id);
    res.json({ ok: true, message: 'Proveedor eliminado exitosamente' });
  } catch (err) {
    console.error(err);
    if (err.message.includes('no encontrado')) {
      return res.status(404).json({ ok: false, message: err.message });
    }
    res.status(500).json({ ok: false, message: 'Error al eliminar proveedor' });
  }
};

/**
 * Actualizar datos de un proveedor
 */
const updateProviderController = async (req, res) => {
  const { id } = req.params;
  const { Nombre, Telefono, Correo, Direccion } = req.body;
  try {
    await updateProvider(id, { Nombre, Telefono, Correo, Direccion });
    res.json({ ok: true, message: 'Proveedor actualizado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al actualizar' });
  }
};

module.exports = {
  getProviders,
  addProvider,
  deleteProviderController,
  updateProviderController
};
