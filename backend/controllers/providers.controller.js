/**
 * @module ProvidersController
 */

const db = require('../bd');

/**
 * Obtener todos los proveedores
 * @async
 * @function getProviders
 * @returns {Promise<Array>} Lista de proveedores
 */
async function getProviders() {
    const sql = 'SELECT * FROM proveedores';
    const [result] = await db.query(sql)
    return result
}

/**
 * Registrar un nuevo proveedor
 * @async
 * @function addProvider
 * @param {Object} providerData Datos del proveedor
 * @returns {Promise<Object>} Resultado de la insercion
 */
async function addProvider(providerData) {
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

    return result;
}

/**
 * Eliminar un proveedor
 * @async
 * @function deleteProvider
 * @param {number} id
 * @returns {Promise<void>}
 */
async function deleteProvider(id) {
    await db.query(
        'DELETE FROM proveedores WHERE IdProveedor = ?', 
        [id]
    );
}

exports.getProviders = getProviders;
exports.addProvider = addProvider;
exports.deleteProvider = deleteProvider;
