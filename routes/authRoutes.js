const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes: GET /login, POST /login, GET /register, POST /register, POST /logout
router.get('/login', authController.showLogin);
router.post('/login', authController.processLogin);
router.get('/register', authController.showRegister);
router.post('/register', authController.processRegister);
router.post('/logout', authController.logout);

module.exports = router;
