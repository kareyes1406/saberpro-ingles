/**
 * controllers/adminController.js
 * Controlador Administrativo — Conexión real a Azure SQL Server
 * Dashboard KPIs, CRUD de usuarios
 */
const User = require('../models/User');
const Gamification = require('../models/Gamification');
const Evaluation = require('../models/Evaluation');
const bcrypt = require('bcryptjs');
const { executeQuery, sql } = require('../config/database');

exports.showDashboard = async (req, res) => {
    try {
        // KPIs
        const totalUsersCount = await User.getActiveCount();
        
        // Completion rate
        const completionResult = await executeQuery(`
            SELECT 
                COUNT(DISTINCT UP.UserID) as UsersWithProgress,
                (SELECT COUNT(*) FROM Users U INNER JOIN Roles R ON U.RoleID = R.RoleID WHERE R.RoleName = 'student' AND U.IsActive = 1) as TotalStudents
            FROM UserProgress UP WHERE UP.IsCompleted = 1
        `);
        const compData = completionResult.recordset[0];
        const completionRate = compData.TotalStudents > 0 
            ? Math.round((compData.UsersWithProgress / compData.TotalStudents) * 100) : 0;
        
        // Abandon rate (students who haven't logged in for 7+ days)
        const abandonResult = await executeQuery(`
            SELECT COUNT(*) as Abandoned FROM Users U
            INNER JOIN Roles R ON U.RoleID = R.RoleID
            WHERE R.RoleName = 'student' AND U.IsActive = 1
            AND (U.LastLoginAt IS NULL OR DATEDIFF(day, U.LastLoginAt, GETDATE()) > 7)
        `);
        const abandonCount = abandonResult.recordset[0].Abandoned;
        const abandonRate = compData.TotalStudents > 0 
            ? Math.round((abandonCount / compData.TotalStudents) * 100) : 0;
        
        // Average time per evaluation
        const avgTimeResult = await executeQuery(`
            SELECT AVG(UP.TimeSpentSeconds) as AvgTime FROM UserProgress UP
            INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
            INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
            WHERE AT.TypeName = 'BossBattle' AND UP.IsCompleted = 1
        `);
        const avgTimeSeconds = avgTimeResult.recordset[0].AvgTime || 0;
        const avgTimeMinutes = Math.round(avgTimeSeconds / 60);
        
        // Get all students with their gamification stats
        const usersResult = await executeQuery(`
            SELECT U.UserID, U.FirstName, U.LastName, U.Email, U.IsActive, U.LastLoginAt,
                   ISNULL(UG.TotalXP, 0) as TotalXP, ISNULL(UG.Level, 1) as Level,
                   ISNULL(UG.CurrentStreak, 0) as CurrentStreak, ISNULL(UG.TotalCoins, 0) as TotalCoins,
                   (SELECT MAX(MW.WeekNumber) FROM UserProgress UP2
                    INNER JOIN Activities A2 ON UP2.ActivityID = A2.ActivityID
                    INNER JOIN ModuleWeeks MW ON A2.WeekID = MW.WeekID
                    WHERE UP2.UserID = U.UserID AND UP2.IsCompleted = 1) as CurrentWeek
            FROM Users U
            INNER JOIN Roles R ON U.RoleID = R.RoleID
            LEFT JOIN UserGamification UG ON U.UserID = UG.UserID
            WHERE R.RoleName = 'student'
            ORDER BY U.CreatedAt DESC
        `);
        
        res.render('admin/dashboard', {
            title: 'Dashboard Administrativo',
            kpis: {
                totalUsers: totalUsersCount,
                completionRate,
                abandonRate,
                avgTimeMinutes
            },
            users: usersResult.recordset,
            user: req.session.user
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).send('Error cargando dashboard');
    }
};

exports.listUsers = async (req, res) => {
    res.redirect('/admin/dashboard');
};

exports.createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password || 'SaberPro2026!', 10);
        
        const newUser = await User.create({
            FirstName: firstName, LastName: lastName,
            Email: email, PasswordHash: hashedPassword, RoleID: 1
        });
        
        await executeQuery(
            'INSERT INTO UserGamification (UserID, TotalXP, Level, CurrentStreak, LongestStreak, TotalCoins, CoinsSpent, UpdatedAt) VALUES (@UserID, 0, 1, 0, 0, 0, 0, GETDATE())',
            [{ name: 'UserID', type: sql.Int, value: newUser.UserID }]
        );
        
        res.json({ success: true, message: 'Estudiante creado exitosamente', user: newUser });
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { firstName, lastName, email, isActive } = req.body;
        
        await executeQuery(`
            UPDATE Users SET FirstName = @FirstName, LastName = @LastName, 
            Email = @Email, IsActive = @IsActive, UpdatedAt = GETDATE()
            WHERE UserID = @UserID
        `, [
            { name: 'FirstName', type: sql.NVarChar, value: firstName },
            { name: 'LastName', type: sql.NVarChar, value: lastName },
            { name: 'Email', type: sql.NVarChar, value: email },
            { name: 'IsActive', type: sql.Bit, value: isActive === '1' || isActive === true ? 1 : 0 },
            { name: 'UserID', type: sql.Int, value: userId }
        ]);
        
        res.json({ success: true, message: 'Usuario actualizado' });
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        await User.hardDeleteUser(userId);
        res.json({ success: true, message: 'Usuario eliminado permanentemente' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

exports.getKPIData = async (req, res) => {
    try {
        // Completion rate per week (12 weeks)
        const weeklyCompletion = await executeQuery(`
            SELECT MW.WeekNumber,
                COUNT(DISTINCT CASE WHEN UP.IsCompleted = 1 THEN UP.UserID END) as CompletedUsers,
                (SELECT COUNT(*) FROM Users U INNER JOIN Roles R ON U.RoleID = R.RoleID WHERE R.RoleName = 'student' AND U.IsActive = 1) as TotalStudents
            FROM ModuleWeeks MW
            LEFT JOIN Activities A ON MW.WeekID = A.WeekID
            LEFT JOIN UserProgress UP ON A.ActivityID = UP.ActivityID
            WHERE MW.ModuleID = 1
            GROUP BY MW.WeekNumber
            ORDER BY MW.WeekNumber
        `);
        
        // Average time per evaluation per week
        const weeklyTime = await executeQuery(`
            SELECT MW.WeekNumber, AVG(UP.TimeSpentSeconds) as AvgTime
            FROM ModuleWeeks MW
            INNER JOIN Activities A ON MW.WeekID = A.WeekID
            INNER JOIN UserProgress UP ON A.ActivityID = UP.ActivityID
            WHERE MW.ModuleID = 1 AND UP.IsCompleted = 1
            GROUP BY MW.WeekNumber ORDER BY MW.WeekNumber
        `);
        
        // Module effectiveness (by activity type)
        const effectiveness = await executeQuery(`
            SELECT AT.TypeName, AVG(UP.Score) as AvgScore, COUNT(*) as Attempts
            FROM UserProgress UP
            INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
            INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
            WHERE UP.IsCompleted = 1
            GROUP BY AT.TypeName
        `);
        
        // Student activity last 7 days
        const dailyActivity = await executeQuery(`
            SELECT CAST(UP.CompletedAt AS DATE) as ActivityDate, COUNT(*) as ActivityCount
            FROM UserProgress UP
            WHERE UP.CompletedAt >= DATEADD(day, -7, GETDATE())
            GROUP BY CAST(UP.CompletedAt AS DATE)
            ORDER BY ActivityDate
        `);
        
        res.json({
            weeklyCompletion: weeklyCompletion.recordset,
            weeklyTime: weeklyTime.recordset,
            effectiveness: effectiveness.recordset,
            dailyActivity: dailyActivity.recordset
        });
    } catch (error) {
        console.error('KPI Data Error:', error);
        res.status(500).json({ error: 'Error al obtener KPIs' });
    }
};

exports.showProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const adminResult = await User.findById(userId);
        res.render('admin/profile', {
            title: 'Mi Perfil de Administrador',
            cssFile: 'admin.css',
            admin: adminResult,
            user: req.session.user
        });
    } catch (error) {
        console.error('Admin Profile Error:', error);
        res.redirect('/admin/dashboard');
    }
};
