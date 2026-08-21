const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Rate limiting para rutas de autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 peticiones por IP
    message: 'Demasiados intentos, por favor intenta de nuevo en 15 minutos'
});

// Routes
router.get('/login', authController.showLogin);
router.post('/login', authLimiter, authController.processLogin);
router.get('/register', authController.showRegister);
router.post('/register', authLimiter, authController.processRegister);
router.post('/verify-pin', authLimiter, authController.verifyPin);
router.post('/logout', authController.logout);

module.exports = router;
