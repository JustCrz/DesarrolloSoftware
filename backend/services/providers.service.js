/**
 * @module ProvidersService
 * Servicio para gestionar proveedores
 */

const db = require('../bd');

/**
 * Obtener todos los proveedores
 * @async
 * @function getAllProviders
 * @returns {Promise<Array>} Lista de proveedores
 */
async function getAllProviders() {
  const sql = 'SELECT * FROM proveedores';
  const [providers] = await db.query(sql);
  return providers;
}

/**
 * Crear nuevo proveedor
 * @async
 * @function createProvider
 * @param {Object} providerData Datos del proveedor
 * @param {string} providerData.Nombre Nombre del proveedor
 * @param {string} [providerData.Telefono] Teléfono
 * @param {string} [providerData.Correo] Email
 * @param {string} [providerData.Direccion] Dirección
 * @returns {Promise<number>} ID del proveedor creado
 * @throws {Error} Si el email ya existe
 */
async function createProvider(providerData) {
  const { Nombre, Telefono, Correo, Direccion } = providerData;
  
  const [existing] = await db.query(
    'SELECT * FROM proveedores WHERE Correo = ?',
    [Correo]
  );

  if (existing.length > 0) {
    throw new Error('El correo ya está registrado');
  }

  const [result] = await db.query(
    'INSERT INTO proveedores (Nombre, Telefono, Correo, Direccion) VALUES (?, ?, ?, ?)',
    [Nombre, Telefono || null, Correo || null, Direccion || null]
  );

  return result.insertId;
}

/**
 * Eliminar un proveedor
 * @async
 * @function deleteProvider
 * @param {number} id ID del proveedor
 * @returns {Promise<Object>} Confirmación
 * @throws {Error} Si el proveedor no existe
 */
async function deleteProvider(id) {
  const [result] = await db.query('DELETE FROM proveedores WHERE IdProveedor = ?', [id]);
  
  if (result.affectedRows === 0) {
    throw new Error('Proveedor no encontrado');
  }

  return { message: 'Proveedor eliminado exitosamente' };
}

/**
 * Actualizar datos de un proveedor
 * @async
 * @function updateProvider
 * @param {number} id ID del proveedor
 * @param {Object} providerData Datos actualizados
 * @returns {Promise<Object>} Confirmación
 */
async function updateProvider(id, providerData) {
  const { Nombre, Telefono, Correo, Direccion } = providerData;
  
  const [result] = await db.query(
    'UPDATE proveedores SET Nombre=?, Telefono=?, Correo=?, Direccion=? WHERE IdProveedor=?',
    [Nombre, Telefono, Correo, Direccion, id]
  );

  if (result.affectedRows === 0) {
  throw new Error('Proveedor no encontrado');
  }

  return { message: 'Proveedor actualizado' };
}

module.exports = {
  getAllProviders,
  createProvider,
  deleteProvider,
  updateProvider
};
