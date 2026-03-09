/**
 * @module UsersController
 */
<<<<<<< HEAD
const pool = require('../bd');
const bcrypt = require('bcrypt');

/**
 * Obtener todos los clientes registrados (Para el Panel Admin)
 */
async function getAllUsers(req, res) {
  try {
    const [rows] = await pool.query('SELECT IdCliente, NombreC, Correo, Telefono, Direccion FROM cliente');
    res.json({ ok: true, users: rows });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ ok: false, message: 'Error al obtener usuarios' });
=======

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
>>>>>>> origin/main
  }
}

/**
<<<<<<< HEAD
 * Registrar un nuevo cliente con contraseña encriptada
=======
 * Registrar un nuevo usuario
 * @async
 * @function registerUser
 * @param {Object} req Request de Express
 * @param {Object} res Response de Express
 * @returns {Promise<Object>} Respuesta HTTP del registro
>>>>>>> origin/main
 */
async function registerUser(req, res) {
  try {
    const { NombreC, Correo, Telefono, Direccion } = req.body;
<<<<<<< HEAD
    const passwordRaw = req.body['Contraseña'] || req.body.Contrasena || req.body.password;

    if (!NombreC || !Correo || !passwordRaw) {
      return res.status(400).json({ ok: false, message: 'Nombre, correo y contraseña son obligatorios' });
    }

    const [existing] = await pool.query('SELECT * FROM cliente WHERE Correo = ?', [Correo]);
    if (existing.length > 0) {
      return res.status(400).json({ ok: false, message: 'Este correo ya está registrado' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(passwordRaw, saltRounds);

    const [result] = await pool.query(
      'INSERT INTO cliente (NombreC, Correo, Contraseña, Telefono, Direccion) VALUES (?, ?, ?, ?, ?)',
      [NombreC, Correo, hashedPassword, Telefono || null, Direccion || null]
    );

    res.status(201).json({ ok: true, message: 'Usuario registrado exitosamente', id: result.insertId });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
}

/**
 * Iniciar sesión
 */
async function loginUser(req, res) {
  const { Correo, Contraseña } = req.body;
  try {
    const [results] = await pool.query('SELECT * FROM cliente WHERE Correo = ?', [Correo]);
    if (results.length === 0) {
      return res.status(401).json({ ok: false, message: 'Usuario no encontrado' });
    }

    const user = results[0];
    const match = await bcrypt.compare(Contraseña, user.Contraseña);
    if (!match) {
      return res.status(401).json({ ok: false, message: 'Contraseña incorrecta' });
    }

    delete user.Contraseña; // Seguridad: no enviar hash al frontend
    res.json({ ok: true, user });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ ok: false, message: 'Error al iniciar sesión' });
  }
}

/**
 * Eliminar un cliente
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM cliente WHERE IdCliente = ?', [id]);
    res.json({ ok: true, message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'No se puede eliminar un cliente con historial de compras' });
=======
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
>>>>>>> origin/main
  }
}

exports.getAllUsers = getAllUsers;
exports.registerUser = registerUser;
<<<<<<< HEAD
exports.loginUser = loginUser;
exports.deleteUser = deleteUser;
=======
>>>>>>> origin/main
