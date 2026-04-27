/**
 * @module AuthController
 */
const { loginUser } = require('../services/auth.service');

/**
 * Autenticar usuario por correo y contraseña
 * @async
 * @function authlogin
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con informacion de sesion
 */
const authlogin = async (req, res) => {
  try {
    const correo = req.body.correo;
    const contrasena = req.body['contraseña'] || req.body.contrasena || req.body.password;

    const user = await loginUser(correo, contrasena);
    
    return res.json({
      ok: true,
      message: 'Bienvenido a Marjorie Store',
      user
    });
  } catch (err) {
    console.error('Error en el Login:', err);
    if (err.message === 'El correo no está registrado') {
      return res.status(404).json({ ok: false, message: err.message });
    }
    if (err.message === 'Contraseña incorrecta') {
      return res.status(401).json({ ok: false, message: err.message });
    }
    if (err.message === 'Correo y contraseña son obligatorios') {
      return res.status(400).json({ ok: false, message: err.message });
    }
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  authlogin
};
