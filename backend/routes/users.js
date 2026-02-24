const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');

router.get('/', async (req, res) => {
  try {
    const users = await usersController.getAllUsers();
    res.json({ ok: true, users });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

router.post('/register', async (req, res) => {
  try {
    await usersController.registerUser(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

module.exports = router;