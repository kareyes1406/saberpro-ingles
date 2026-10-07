const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Rate limiting amigable con proxies universitarios y respuestas en formato JSON
const loginLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutos
    max: 10, // Aumentado para evitar bloquear aulas completas bajo el mismo proxy
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Has superado el límite de intentos. Por favor espera 2 minutos para volver a intentar.'
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const pinLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // Permite margen para reintentos de PIN sin colapsar usuarios en misma red
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Demasiados intentos de verificación con PIN. Por favor espera unos minutos.'
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes
router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, authController.processLogin);
router.get('/register', authController.showRegister);
router.post('/register', authController.processRegister);
router.post('/verify-pin', pinLimiter, authController.verifyPin);

// Recuperación de Contraseña
router.post('/forgot-password', loginLimiter, authController.forgotPassword);
router.post('/verify-reset-pin', loginLimiter, authController.verifyResetPin);
router.post('/reset-password', authController.resetPassword);

router.post('/logout', authController.logout);

module.exports = router;
