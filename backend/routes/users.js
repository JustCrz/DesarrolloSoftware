const express = require('express');
const router = express.Router();

let users = [
  { id: 1, user: 'admin', email: 'admin@mail.com', pass: '123', role: 'admin' },
];

// Obtener usuarios (solo para depuración)
router.get('/', (req, res) => {
  res.json(users);
});

// Registrar usuario
router.post('/register', (req, res) => {
  const nuevo = { id: Date.now(), ...req.body };
  users.push(nuevo);
  res.status(201).json({ ok: true, user: nuevo });
});

// Iniciar sesión
router.post('/login', (req, res) => {
  const { user, pass, role } = req.body;
  const encontrado = users.find(
    u => (u.user === user || u.email === user) && u.pass === pass && u.role === role
  );
  if (!encontrado) {
    return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
  }
  res.json({ ok: true, user: encontrado });
});

module.exports = router;
