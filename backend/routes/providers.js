const express = require('express');
const router = express.Router();
const providersController = require('../controllers/providers.controller');

router.get('/', providersController.getProviders);
router.post('/', providersController.addProvider);
router.delete('/:id', providersController.deleteProvider);

module.exports = router;
