/**
 * @module UsersController
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
  const [results] = await db.query(sql);
  return results;
}

/**
 * Registrar un nuevo usuario
 * @async
 * @function registerUser
 * @param {Object} userData Datos del usuario
 * @returns {Promise<void>}
 */
async function registerUser(userData) {
  const { NombreC, Correo, Telefono, Direccion, Contraseña } = userData;
  //Busca si el correo dado existe en la base de datos
  const [existing] = await db.query(
    'SELECT * FROM cliente WHERE Correo = ?',
    [Correo]
  );

  if (existing.length > 0) {
    throw new Error('El correo ya está registrado');
  }
  //Genera un hash para la contraseña y guardar ese dato
  const saltRounds = 10;
  const hashed = await bcrypt.hash(Contraseña, saltRounds);

  await db.query(
    'INSERT INTO cliente (NombreC, Correo, Telefono, Direccion, Contraseña) VALUES (?, ?, ?, ?, ?)',
    [NombreC, Correo, Telefono || '', Direccion || '', hashed]
  );
}

exports.getAllUsers = getAllUsers;
exports.registerUser = registerUser;
