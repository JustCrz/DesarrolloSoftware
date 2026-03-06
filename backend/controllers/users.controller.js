/**
 * @module UsersController
 */

const db = require('../bd');
const bcrypt = require('bcrypt');

/**
 * Obtener todos los usuarios
 * @async
 * @function getAllUsers
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con la lista de usuarios
 */
async function getAllUsers(req, res) {
  try {
    const sql = 'SELECT IdCliente, NombreC, Correo, Telefono, Direccion FROM cliente';
    const [users] = await db.query(sql);
    return res.json({ ok: true, users });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Error al obtener usuarios' });
  }
}

/**
 * Registrar un nuevo usuario
 * @async
 * @function registerUser
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP del registro
 */
async function registerUser(req, res) {
  try {
    const { NombreC, Correo, Telefono, Direccion } = req.body;
    const password = req.body['Contraseña'] || req.body['ContraseÃ±a'] || req.body.Contrasena;

    if (!password) {
      return res.status(400).json({ ok: false, message: 'La contrasena es obligatoria' });
    }

    const [existing] = await db.query(
      'SELECT * FROM cliente WHERE Correo = ?',
      [Correo]
    );

    if (existing.length > 0) {
      return res.status(400).json({ ok: false, message: 'El correo ya esta registrado' });
    }

    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    await db.query(
      'INSERT INTO cliente (NombreC, Correo, Telefono, Direccion, ContraseÃ±a) VALUES (?, ?, ?, ?, ?)',
      [NombreC, Correo, Telefono || '', Direccion || '', hashed]
    );

    return res.json({ ok: true });
  } catch (err) {
    return res.status(400).json({ ok: false, message: err.message });
  }
}

exports.getAllUsers = getAllUsers;
exports.registerUser = registerUser;
