/**
 * @module ProvidersController
 */
<<<<<<< HEAD
const pool = require('../bd');

/**
 * Obtener todos los proveedores registrados
 */
async function getProviders(req, res) {
    try {
        const sql = 'SELECT * FROM proveedores';
        const [rows] = await pool.query(sql);
        res.json({ ok: true, providers: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, message: 'Error al obtener proveedores' });
    }
=======

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
>>>>>>> origin/main
}

/**
 * Registrar un nuevo proveedor
<<<<<<< HEAD
 */
async function addProvider(req, res) {
    const { Nombre, Telefono, Correo, Direccion } = req.body;
    
    try {
        // 1. Validar si el correo ya existe para evitar duplicados
        const [existing] = await pool.query(
            'SELECT * FROM proveedores WHERE Correo = ?',
            [Correo]
        );

        if (existing.length > 0) {
            return res.status(400).json({ ok: false, message: 'El correo ya está registrado' });
        }

        // 2. Insertar nuevo proveedor
        const [result] = await pool.query(
            'INSERT INTO proveedores (Nombre, Telefono, Correo, Direccion) VALUES (?, ?, ?, ?)',
            [Nombre, Telefono || null, Correo || null, Direccion || null]
        );

        res.status(201).json({ 
            ok: true, 
            message: 'Proveedor registrado correctamente',
            id: result.insertId 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, message: 'Error al registrar proveedor' });
    }
}

/**
 * Eliminar un proveedor por ID
 */
async function deleteProvider(req, res) {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM proveedores WHERE IdProveedor = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: 'Proveedor no encontrado' });
        }

        res.json({ ok: true, message: 'Proveedor eliminado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, message: 'Error al eliminar proveedor' });
    }
}

/**
 * Actualizar datos de un proveedor (Opcional, pero recomendado)
 */
async function updateProvider(req, res) {
    const { id } = req.params;
    const { Nombre, Telefono, Correo, Direccion } = req.body;
    try {
        await pool.query(
            'UPDATE proveedores SET Nombre=?, Telefono=?, Correo=?, Direccion=? WHERE IdProveedor=?',
            [Nombre, Telefono, Correo, Direccion, id]
        );
        res.json({ ok: true, message: 'Proveedor actualizado' });
    } catch (err) {
        res.status(500).json({ ok: false, message: 'Error al actualizar' });
    }
=======
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
>>>>>>> origin/main
}

exports.getProviders = getProviders;
exports.addProvider = addProvider;
exports.deleteProvider = deleteProvider;
<<<<<<< HEAD
exports.updateProvider = updateProvider;
=======
>>>>>>> origin/main
