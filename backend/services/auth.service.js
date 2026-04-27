/**
 * @module AuthService
 * Servicio de autenticación
 */

const pool = require('../bd');
const bcrypt = require('bcrypt');

/**
 * Autenticar usuario por correo y contraseña
 * @async
 * @function loginUser
 * @param {string} correo Email del usuario
 * @param {string} contrasena Contraseña del usuario
 * @returns {Promise<Object>} Objeto del usuario con rol
 * @throws {Error} Si credenciales son inválidas
 */
async function loginUser(correo, contrasena) {
  if (!correo || !contrasena) {
    throw new Error('Correo y contraseña son obligatorios');
  }

  const [rows] = await pool.query(
    'SELECT * FROM cliente WHERE Correo = ?',
    [correo]
  );

  const user = rows[0];

  if (!user) {
    throw new Error('El correo no está registrado');
  }

  const match = await bcrypt.compare(contrasena, user.Contraseña);
  
  if (!match) {
    throw new Error('Contraseña incorrecta');
  }

  delete user.Contraseña;

  const admins = ['admin@tienda.com', 'gerente@tienda.com', 'marjorie@tienda.com'];
  const role = admins.includes(user.Correo) ? 'admin' : 'cliente';

  return {
    IdCliente: user.IdCliente,
    nombre: user.NombreC,
    correo: user.Correo,
    role: role
  };
}

module.exports = {
  loginUser
};
