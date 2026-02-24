const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', async (req, res) => {
  try {
    const users = await authController.authlogin;
    res.json({ ok: true, users });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});
module.exports = router;