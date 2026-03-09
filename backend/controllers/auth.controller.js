/**
 * @module AuthController
 */
<<<<<<< HEAD
=======

>>>>>>> origin/main
const pool = require('../bd');
const bcrypt = require('bcrypt');

/**
<<<<<<< HEAD
 * Autenticar usuario por correo y contraseña
=======
 * Autenticar usuario por correo y contrasena
>>>>>>> origin/main
 * @async
 * @function authlogin
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
<<<<<<< HEAD
 */
async function authlogin(req, res) {
  try {
    // Extraemos los datos del body (manejamos 'contraseña' y 'contrasena' por compatibilidad)
    const correo = req.body.correo;
    const contraseña = req.body['contraseña'] || req.body.contrasena || req.body.contrasenna;

    // 1. Validación de campos vacíos
=======
 * @returns {Promise<Object>} Respuesta HTTP con informacion de sesion
 */
async function authlogin(req, res) {
  try{
    const correo = req.body.correo;
    const contraseña = req.body['contraseña'] || req.body.contrasena;

>>>>>>> origin/main
    if (!correo || !contraseña) {
      return res.status(400).json({
        ok: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }
<<<<<<< HEAD

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
    
=======
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
>>>>>>> origin/main
    if (!match) {
      return res.status(401).json({
        ok: false,
        message: 'Contraseña incorrecta'
      });
    }

<<<<<<< HEAD
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
=======
    const admins = ['admin@tienda.com', 'gerente@tienda.com'];
    const role = admins.includes(user.Correo) ? 'admin' : 'cliente';

    return res.json({
      ok: true,
      user: {
        id: user.IdCliente,
        nombre: user.NombreC,
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
>>>>>>> origin/main
