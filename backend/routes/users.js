// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../bd');
const bcrypt = require('bcrypt');

// GET todos los usuarios (solo para test)
router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT IdCliente, NombreC, Correo, Telefono, Direccion FROM cliente';
    const [results] = await db.query(sql);
    res.json({ ok: true, users: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener usuarios' });
  }
});

// Registrar usuario-cliente
router.post('/register', async (req, res) => {
  try {
    const { NombreC, Correo, Telefono, Direccion, Contraseña } = req.body;

    if (!NombreC || !Correo || !Contraseña) {
      return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios' });
    }

    // Revisar si el correo ya existe
    const [existing] = await db.query('SELECT * FROM cliente WHERE Correo = ?', [Correo]);
    if (existing.length > 0) {
      return res.status(400).json({ ok: false, message: 'El correo ya está registrado' });
    }

    // Generar hash de la contraseña
    const saltRounds = 10;
    const hashedContraseña = await bcrypt.hash(Contraseña, saltRounds);

    const sql = 'INSERT INTO cliente (NombreC, Correo, Telefono, Direccion, Contraseña) VALUES (?, ?, ?, ?, ?)';
    await db.query(sql, [NombreC, Correo, Telefono || '', Direccion || '', hashedContraseña]);

    res.json({ ok: true, message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al registrar usuario' });
  }
});

// Iniciar sesión
router.post('/login', async (req, res) => {
  const { Correo, Contraseña } = req.body;
  try {
    // Buscar usuario por correo
    const [results] = await db.query('SELECT * FROM cliente WHERE Correo = ?', [Correo]);
    if (results.length === 0) {
      return res.status(401).json({ ok: false, message: 'Usuario no encontrado' });
    }

    const user = results[0];

    // Comparar contraseña con el hash
    const match = await bcrypt.compare(Contraseña, user.Contraseña);
    if (!match) {
      return res.status(401).json({ ok: false, message: 'Contraseña incorrecta' });
    }

    // No enviar la contraseña al frontend
    delete user.Contraseña;

    res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al iniciar sesión' });
  }
});

module.exports = router;
