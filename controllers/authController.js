/**
 * controllers/authController.js
 * Controlador de Autenticación — Conexión real a Azure SQL Server
 * Maneja login, registro y logout de usuarios
 */
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { executeQuery, sql } = require('../config/database');

exports.showLogin = (req, res) => {
    res.render('auth/login', { 
        title: 'Iniciar Sesión',
        error: req.flash('error'),
        success_msg: req.flash('success_msg')
    });
};

exports.processLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            req.flash('error', 'Por favor ingresa email y contraseña');
            return res.redirect('/auth/login');
        }
        
        // Find user in DB
        const user = await User.findByEmail(email);
        if (!user) {
            req.flash('error', 'Credenciales inválidas');
            return res.redirect('/auth/login');
        }
        
        // Check if user is active
        if (!user.IsActive) {
            if (user.VerificationPin) {
                req.flash('error', 'Tu cuenta no está verificada. Revisa tu correo y actívala.');
            } else {
                req.flash('error', 'Tu cuenta ha sido desactivada. Contacta al administrador.');
            }
            return res.redirect('/auth/login');
        }
        
        // Compare password with bcrypt
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            req.flash('error', 'Credenciales inválidas');
            return res.redirect('/auth/login');
        }
        
        // Update last login timestamp
        await User.updateLastLogin(user.UserID);
        
        // Get role name
        const roleResult = await executeQuery(
            'SELECT RoleName FROM Roles WHERE RoleID = @RoleID',
            [{ name: 'RoleID', type: sql.Int, value: user.RoleID }]
        );
        const roleName = roleResult.recordset[0]?.RoleName || 'student';
        
        // Set session
        req.session.userId = user.UserID;
        req.session.user = {
            UserID: user.UserID,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Email: user.Email,
            Role: roleName
        };
        req.session.role = roleName;
        
        // Redirect based on role
        if (roleName === 'admin') {
            return res.redirect('/admin/dashboard');
        }
        return res.redirect('/student');
        
    } catch (error) {
        console.error('Login Error:', error);
        req.flash('error', 'Error en el servidor. Intenta de nuevo.');
        res.redirect('/auth/login');
    }
};

exports.showRegister = (req, res) => {
    res.render('auth/register', {
        title: 'Registro',
        error: req.flash('error'),
        success_msg: req.flash('success_msg')
    });
};

const emailService = require('../services/emailService');

exports.processRegister = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;
        
        // Return JSON helper
        const returnError = (msg) => res.status(400).json({ success: false, error: msg });

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return returnError('Todos los campos son obligatorios');
        }
        
        if (password !== confirmPassword) {
            return returnError('Las contraseñas no coinciden');
        }
        
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return returnError('La contraseña no cumple con los requisitos de seguridad');
        }
        
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return returnError('Ya existe una cuenta con ese email');
        }
        
        const hashedPassword = await bcrypt.hash(password, 12); // Aumentado a 12
        
        const roleResult = await executeQuery("SELECT RoleID FROM Roles WHERE RoleName = 'student'");
        const roleId = roleResult.recordset.length > 0 ? roleResult.recordset[0].RoleID : 1;
        
        // Crear usuario INACTIVO
        const newUser = await User.create({
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            PasswordHash: hashedPassword,
            RoleID: roleId,
            IsActive: 0
        });
        
        // Generar PIN aleatorio de 6 dígitos para el nuevo usuario
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        await User.saveVerificationPin(newUser.UserID, pin);
        
        // Enviar correo electrónico al usuario que se está registrando
        await emailService.sendVerificationPin(email, pin);
        
        await executeQuery(
            'INSERT INTO UserGamification (UserID, TotalXP, Level, CurrentStreak, LongestStreak, TotalCoins, CoinsSpent, UpdatedAt) VALUES (@UserID, 0, 1, 0, 0, 0, 0, GETDATE())',
            [{ name: 'UserID', type: sql.Int, value: newUser.UserID }]
        );
        
        res.json({ success: true, requiresPin: true, email: email });
        
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ success: false, error: 'Error al registrar. Intenta de nuevo.' });
    }
};

exports.verifyPin = async (req, res) => {
    try {
        const { email, pin } = req.body;
        if (!email || !pin) {
            return res.status(400).json({ success: false, error: 'Email y PIN requeridos' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Consultar PIN en BD
        const result = await executeQuery(
            'SELECT VerificationPin, PinExpiry FROM Users WHERE UserID = @UserID',
            [{ name: 'UserID', type: sql.Int, value: user.UserID }]
        );

        const dbPin = result.recordset[0].VerificationPin;
        const expiry = result.recordset[0].PinExpiry;

        if (!dbPin || dbPin !== pin) {
            return res.status(400).json({ success: false, error: 'PIN incorrecto' });
        }

        if (new Date() > new Date(expiry)) {
            return res.status(400).json({ success: false, error: 'El PIN ha expirado' });
        }

        // Activar usuario
        await User.activateUser(user.UserID);
        
        res.json({ success: true, message: 'Cuenta verificada correctamente' });

    } catch (error) {
        console.error('Verify PIN error:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout Error:', err);
        res.redirect('/auth/login');
    });
};
