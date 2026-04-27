/**
 * @module UsersService
 * Servicio para gestionar usuarios
 */

const db = require('../bd');
const bcrypt = require('bcrypt');

/**
 * Obtener todos los usuarios
 * @async
 * @function getAllUsers
 * @returns {Promise<Array>} Lista de usuarios
 */
async function getAllUsers() {
  const sql = 'SELECT IdCliente, NombreC, Correo, Telefono, Direccion FROM cliente';
  const [users] = await db.query(sql);
  return users;
}

/**
 * Registrar un nuevo usuario
 * @async
 * @function registerUser
 * @param {Object} userData Datos del usuario
 * @param {string} userData.NombreC Nombre completo
 * @param {string} userData.Correo Email
 * @param {string} userData.passwordRaw Contraseña sin encriptar
 * @param {string} [userData.Telefono] Teléfono
 * @param {string} [userData.Direccion] Dirección
 * @returns {Promise<Object>} ID del usuario creado
 * @throws {Error} Si el email ya existe
 */
async function registerUser(userData) {
  const { NombreC, Correo, passwordRaw, Telefono, Direccion } = userData;

  if (!NombreC || !Correo || !passwordRaw) {
    throw new Error('Nombre, correo y contraseña son obligatorios');
  }

  const [existing] = await db.query('SELECT * FROM cliente WHERE Correo = ?', [Correo]);
  if (existing.length > 0) {
    throw new Error('Este correo ya está registrado');
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(passwordRaw, saltRounds);

  const [result] = await db.query(
    'INSERT INTO cliente (NombreC, Correo, Contraseña, Telefono, Direccion) VALUES (?, ?, ?, ?, ?)',
    [NombreC, Correo, hashedPassword, Telefono || null, Direccion || null]
  );

  return { id: result.insertId };
}

/**
 * Eliminar un usuario
 * @async
 * @function deleteUser
 * @param {number} id ID del usuario
 * @returns {Promise<Object>} Resultado de eliminación
 */
async function deleteUser(id) {
  await db.query('DELETE FROM cliente WHERE IdCliente = ?', [id]);
  return { message: 'Usuario eliminado' };
}

module.exports = {
  getAllUsers,
  registerUser,
  deleteUser
};
