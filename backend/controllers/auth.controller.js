/**
 * @module AuthController
 */

const pool = require('../bd');
const bcrypt = require('bcrypt');

/**
 * Autenticar usuario por correo y contrasena
 * @async
 * @function authlogin
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP con informacion de sesion
 */
async function authlogin(req, res) {
  try{
    const { correo, contraseña } = req.body;
    const [rows] = await pool.query(
        'SELECT * FROM cliente WHERE Correo = ?',
        [correo]
      );

      const user = rows[0];
      if (!user) {
        return res.status(404).json({
          ok: false,
          message: 'Usuario no encontrado'
        });
      }

      const match = await bcrypt.compare(contraseña, user.Contraseña);
      if (!match) {
        return res.status(401).json({
          ok: false,
          message: 'Contraseña incorrecta'
        });
      }

      const admins = ['admin@tienda.com', 'gerente@tienda.com'];
      const role = admins.includes(user.Correo) ? 'admin' : 'cliente';

      return res.json({
        ok: true,
        user: {
          id: user.IdCliente,
          nombre: user.Nombre,
          correo: user.Correo,
          role
        }
      });
  }
  catch(err){
    res.status(400).json({ ok: false, message: err.message });
  }
}


exports.authlogin = authlogin;
