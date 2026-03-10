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
    const correo = req.body.correo;
    const contraseña = req.body['contraseña'] || req.body.contrasena;

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
    // 5. Lógica de Roles (Tu toque especial)
    // Definimos quiénes son administradores. Puedes usar una lista o una columna en la DB.
    const admins = ['admin@tienda.com', 'gerente@tienda.com', 'marjorie@tienda.com'];
    const role = admins.includes(user.Correo) ? 'admin' : 'cliente';

    // 6. Respuesta exitosa con los datos que necesita tu script.js
   return res.json({
      ok: true,
      message: 'Bienvenido a Marjorie Store',
      user: {
        IdCliente: user.IdCliente, // Cambiado de 'id' a 'IdCliente'
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

// Exportamos la función para que el Router la pueda usar
exports.authlogin = authlogin;
