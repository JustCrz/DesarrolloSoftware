/**
 * @module ProvidersController
 */

const db = require('../bd');

/**
 * Obtener todos los proveedores
 * @async
 * @function getProviders
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con proveedores
 */
async function getProviders(req, res) {
  try {
    const sql = 'SELECT * FROM proveedores';
    const [providers] = await db.query(sql);
    return res.json({ ok: true, providers, provider: providers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al obtener proveedores' });
  }
}

/**
 * Registrar un nuevo proveedor
 * @async
 * @function addProvider
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP del registro
 */
async function addProvider(req, res) {
  try {
    const { Nombre, Telefono, Correo, Direccion } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM proveedores WHERE Correo = ?',
      [Correo]
    );

    if (existing.length > 0) {
      return res.status(400).json({ ok: false, message: 'El correo ya esta registrado' });
    }

    await db.query(
      'INSERT INTO proveedores (Nombre, Telefono, Correo, Direccion) VALUES (?, ?, ?, ?)',
      [Nombre, Telefono || null, Correo || null, Direccion || null]
    );

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al agregar proveedor' });
  }
}

/**
 * Eliminar un proveedor
 * @async
 * @function deleteProvider
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP de eliminacion
 */
async function deleteProvider(req, res) {
  try {
    const id = parseInt(req.params.id);
    await db.query('DELETE FROM proveedores WHERE IdProveedor = ?', [id]);
    return res.json({ ok: true, message: 'Proveedor eliminado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error al eliminar proveedor' });
  }
}

exports.getProviders = getProviders;
exports.addProvider = addProvider;
exports.deleteProvider = deleteProvider;
