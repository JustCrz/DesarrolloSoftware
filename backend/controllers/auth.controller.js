/**
 * @module AuthController
 */
const pool = require('../bd');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Autenticar usuario por correo y contraseña
 * @async
 * @function authlogin
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 */
async function authlogin(req, res) {
  try {
    // Extraemos los datos del body (manejamos 'contraseña' y 'contrasena' por compatibilidad)
    const correo = req.body.correo;
    const contraseña = req.body['contraseña'] || req.body.contrasena || req.body.contrasenna;

    // 1. Validación de campos vacíos
    if (!correo || !contraseña) {
      return res.status(400).json({
        ok: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }

    // 2. Buscar al usuario en la base de datos
    const [rows] = await pool.query(
      'SELECT * FROM cliente WHERE Correo = ?',
      [correo]
    );

    const user = rows[0];

    // 3. Si el usuario no existe
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'El correo no está registrado'
      });
    }

    // 4. Comparar la contraseña enviada con el hash de la DB usando Bcrypt
    const match = await bcrypt.compare(contraseña, user.Contraseña);
    
    if (!match) {
      return res.status(401).json({
        ok: false,
        message: 'Contraseña incorrecta'
      });
    }

    const role = user.role || 'cliente';
    const token = jwt.sign(
      { id: user.IdCliente, role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 6. Respuesta exitosa con los datos que necesita tu script.js
   return res.json({
      ok: true,
      message: 'Bienvenido a Marjorie Store',
      token,
      user: {
        IdCliente: user.IdCliente, 
        nombre: user.NombreC,
        correo: user.Correo,
        role: role
      }
    });

  } catch (err) {
    console.error('Error en el Login:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error interno del servidor' 
    });
  }
}

async function me(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT IdCliente, NombreC, Correo, role FROM cliente WHERE IdCliente = ?',
      [req.user.id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      user: {
        IdCliente: user.IdCliente,
        nombre: user.NombreC,
        correo: user.Correo,
        role: user.role || 'cliente'
      }
    });
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
}

module.exports = {
    authlogin,
    me
};
