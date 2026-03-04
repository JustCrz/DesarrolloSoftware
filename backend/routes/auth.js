// backend/routes/auth.js
const express = require('express'); 
const router = express.Router();    
const pool = require('../bd');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  const { Correo, Contraseña } = req.body; 

  try {
    const [rows] = await pool.query(
      'SELECT * FROM cliente WHERE Correo = ?',
      [Correo]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(Contraseña, user.Contraseña);
    if (!match) return res.status(401).json({ ok: false, message: 'Contraseña incorrecta' });

    const admins = ['admin@tienda.com', 'gerente@tienda.com', 'admin@gmail.com'];
    const role = admins.includes(user.Correo) ? 'admin' : 'cliente';

    // Opcional: eliminar la contraseña antes de enviar al frontend por seguridad
    delete user.Contraseña;

    res.json({ ok: true, user: { ...user, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error del servidor' });
  }
});


module.exports = router;