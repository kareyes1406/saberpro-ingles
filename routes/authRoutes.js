const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Rate limiting para login (3 intentos, 2 minutos de bloqueo)
const loginLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutos
    max: 3, // 3 peticiones fallidas permitidas (se ajustará para que solo cuente fallos si es posible, pero por ahora limitamos las llamadas a la ruta)
    message: 'Has superado el límite de 3 intentos. Por favor espera 2 minutos para volver a intentar.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes
router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, authController.processLogin);
router.get('/register', authController.showRegister);
router.post('/register', authController.processRegister);
router.post('/verify-pin', authController.verifyPin);

// Recuperación de Contraseña
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-pin', authController.verifyResetPin);
router.post('/reset-password', authController.resetPassword);

router.post('/logout', authController.logout);

module.exports = router;
