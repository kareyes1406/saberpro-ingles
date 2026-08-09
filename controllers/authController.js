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
            req.flash('error', 'Tu cuenta ha sido desactivada. Contacta al administrador.');
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

exports.processRegister = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;
        
        // Validate all fields
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            req.flash('error', 'Todos los campos son obligatorios');
            return res.redirect('/auth/register');
        }
        
        if (password !== confirmPassword) {
            req.flash('error', 'Las contraseñas no coinciden');
            return res.redirect('/auth/register');
        }
        
        if (password.length < 6) {
            req.flash('error', 'La contraseña debe tener al menos 6 caracteres');
            return res.redirect('/auth/register');
        }
        
        // Check if email already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            req.flash('error', 'Ya existe una cuenta con ese email');
            return res.redirect('/auth/register');
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Find role student
        const roleResult = await executeQuery("SELECT RoleID FROM Roles WHERE RoleName = 'student'");
        const roleId = roleResult.recordset.length > 0 ? roleResult.recordset[0].RoleID : 1;
        
        // Create user
        const newUser = await User.create({
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            PasswordHash: hashedPassword,
            RoleID: roleId
        });
        
        // Initialize gamification row for new student
        await executeQuery(
            'INSERT INTO UserGamification (UserID, TotalXP, Level, CurrentStreak, LongestStreak, TotalCoins, CoinsSpent, UpdatedAt) VALUES (@UserID, 0, 1, 0, 0, 0, 0, GETDATE())',
            [{ name: 'UserID', type: sql.Int, value: newUser.UserID }]
        );
        
        req.flash('success_msg', '¡Registro exitoso! Ahora puedes iniciar sesión.');
        res.redirect('/auth/login');
        
    } catch (error) {
        console.error('Register Error:', error);
        req.flash('error', 'Error al registrar. Intenta de nuevo.');
        res.redirect('/auth/register');
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout Error:', err);
        res.redirect('/auth/login');
    });
};
