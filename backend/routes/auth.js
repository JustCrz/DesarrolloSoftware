// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../bd');
const bcrypt = require('bcrypt');

// POST /users -> registra o hace login dependiendo de los datos enviados
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  console.log(req.body);
  console.log("correo:", correo);

  try {
    const [rows] = await pool.query(
      'SELECT * FROM cliente WHERE Correo = ?',
      [correo]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });

    // Comparar contraseña
    const match = await bcrypt.compare(contraseña, user.Contraseña);
    if (!match) return res.status(401).json({ ok: false, message: 'Contraseña incorrecta' });

    // Asignar rol según correo
    const admins = ['admin@tienda.com', 'gerente@tienda.com'];
    const role = admins.includes(user.Correo) ? 'admin' : 'cliente';

    // Retornar usuario y rol
    res.json({ ok: true, user: { ...user, role } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error del servidor' });
  }
});

module.exports = router;
