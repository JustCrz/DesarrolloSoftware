/**
 * @module UsersController
 */
const { getAllUsers, registerUser, deleteUser } = require('../services/users.service');

/**
 * Obtener todos los usuarios
 * @async
 * @function getAllUsersController
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con la lista de usuarios
 */
const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json({ ok: true, users });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Error al obtener usuarios' });
  }
};

/**
 * Registrar un nuevo usuario
 * @async
 * @function registerUserController
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP del registro
 */
const registerUserController = async (req, res) => {
  try {
    const { NombreC, Correo } = req.body;
    const passwordRaw = req.body['Contraseña'] || req.body.Contrasena || req.body.password;
    const { Telefono, Direccion } = req.body;

    const result = await registerUser({
      NombreC,
      Correo,
      passwordRaw,
      Telefono,
      Direccion
    });

    res.status(201).json({ ok: true, message: 'Usuario registrado exitosamente', id: result.id });
  } catch (err) {
    console.error('Error en registro:', err);
    if (err.message.includes('ya está registrado')) {
      return res.status(400).json({ ok: false, message: err.message });
    }
    if (err.message.includes('obligatorios')) {
      return res.status(400).json({ ok: false, message: err.message });
    }
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
};

/**
 * Eliminar un cliente
 */
const deleteUserController = async (req, res) => {
  const { id } = req.params;
  try {
    await deleteUser(id);
    res.json({ ok: true, message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'No se puede eliminar un cliente con historial de compras' });
  }
};

module.exports = {
  getAllUsersController,
  registerUserController,
  deleteUserController
};
