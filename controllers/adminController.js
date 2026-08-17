/**
 * controllers/adminController.js
 * Controlador Administrativo — Conexión real a Azure SQL Server
 * Dashboard KPIs, CRUD de usuarios, Analítica avanzada + ML
 */
const User = require('../models/User');
const Gamification = require('../models/Gamification');
const Evaluation = require('../models/Evaluation');
const bcrypt = require('bcryptjs');
const { executeQuery, sql } = require('../config/database');
const MLService = require('../services/mlService');

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

        // NEW: Pre-Test scores by competency (average across all students)
        const preTestAvgs = await executeQuery(`
            SELECT 
                AVG(VocabularyScore) as AvgVocab,
                AVG(ReadingScore) as AvgReading,
                AVG(PragmaticsScore) as AvgPragmatics,
                AVG(GrammarScore) as AvgGrammar,
                AVG(TotalScore) as AvgTotal
            FROM UserExams WHERE ExamType = 'PRE'
        `);

        // NEW: Module progress average scores by competency (to compare with pre-test)
        const moduleAvgs = await executeQuery(`
            SELECT AT.TypeName, AVG(UP.Score) as AvgScore
            FROM UserProgress UP
            INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
            INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
            WHERE UP.IsCompleted = 1
            GROUP BY AT.TypeName
        `);

        // NEW: XP Level distribution
        const xpDistribution = await executeQuery(`
            SELECT UG.Level, COUNT(*) as StudentCount
            FROM UserGamification UG
            INNER JOIN Users U ON UG.UserID = U.UserID
            INNER JOIN Roles R ON U.RoleID = R.RoleID
            WHERE R.RoleName = 'student'
            GROUP BY UG.Level
            ORDER BY UG.Level
        `);

        // NEW: Top 10 students by XP
        const topStudents = await executeQuery(`
            SELECT TOP 10 U.FirstName + ' ' + U.LastName as FullName, UG.TotalXP, UG.Level
            FROM UserGamification UG
            INNER JOIN Users U ON UG.UserID = U.UserID
            INNER JOIN Roles R ON U.RoleID = R.RoleID
            WHERE R.RoleName = 'student' AND U.IsActive = 1
            ORDER BY UG.TotalXP DESC
        `);

        // NEW: K-Means Clustering — prepare data for all students
        const studentsForClustering = await executeQuery(`
            SELECT 
                U.UserID, U.FirstName + ' ' + U.LastName as FullName,
                ISNULL(UG.TotalXP, 0) as totalXP,
                ISNULL(UG.Level, 1) as level,
                ISNULL(UG.CurrentStreak, 0) as currentStreak,
                ISNULL((SELECT AVG(UP2.Score) FROM UserProgress UP2 WHERE UP2.UserID = U.UserID AND UP2.IsCompleted = 1), 0) as avgScore,
                ISNULL((SELECT AVG(CAST(UP2.AttemptNumber AS FLOAT)) FROM UserProgress UP2 WHERE UP2.UserID = U.UserID), 1) as avgAttempts,
                ISNULL((SELECT MAX(MW.WeekNumber) FROM UserProgress UP2
                    INNER JOIN Activities A2 ON UP2.ActivityID = A2.ActivityID
                    INNER JOIN ModuleWeeks MW ON A2.WeekID = MW.WeekID
                    WHERE UP2.UserID = U.UserID AND UP2.IsCompleted = 1), 0) as completedWeeks
            FROM Users U
            INNER JOIN Roles R ON U.RoleID = R.RoleID
            LEFT JOIN UserGamification UG ON U.UserID = UG.UserID
            WHERE R.RoleName = 'student' AND U.IsActive = 1
        `);

        const clusteredStudents = MLService.kMeansClustering(studentsForClustering.recordset, 3);
        const clusterSummary = [0, 1, 2].map(ci => {
            const members = clusteredStudents.filter(s => s.cluster === ci);
            if (members.length === 0) return null;
            return {
                name: members[0].clusterName,
                color: members[0].clusterColor,
                count: members.length,
                avgScore: Math.round(members.reduce((s, m) => s + m.avgScore, 0) / members.length),
                avgXP: Math.round(members.reduce((s, m) => s + m.totalXP, 0) / members.length)
            };
        }).filter(Boolean);
        
        res.json({
            weeklyCompletion: weeklyCompletion.recordset,
            weeklyTime: weeklyTime.recordset,
            effectiveness: effectiveness.recordset,
            dailyActivity: dailyActivity.recordset,
            preTestAvgs: preTestAvgs.recordset[0],
            moduleAvgs: moduleAvgs.recordset,
            xpDistribution: xpDistribution.recordset,
            topStudents: topStudents.recordset,
            clusterSummary,
            clusteredStudents
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

exports.showStudentDetail = async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id);

        // Student basic info
        const studentResult = await executeQuery(`
            SELECT U.UserID, U.FirstName, U.LastName, U.Email, U.CreatedAt, U.LastLoginAt,
                   ISNULL(UG.TotalXP, 0) as TotalXP, ISNULL(UG.Level, 1) as Level,
                   ISNULL(UG.CurrentStreak, 0) as CurrentStreak, ISNULL(UG.TotalCoins, 0) as TotalCoins
            FROM Users U
            LEFT JOIN UserGamification UG ON U.UserID = UG.UserID
            WHERE U.UserID = @UserID
        `, [{ name: 'UserID', type: sql.Int, value: targetUserId }]);

        const student = studentResult.recordset[0];
        if (!student) return res.redirect('/admin/dashboard');

        // Pre-test scores
        const preTestResult = await executeQuery(
            `SELECT * FROM UserExams WHERE UserID = @UserID AND ExamType = 'PRE' ORDER BY CompletedAt DESC`,
            [{ name: 'UserID', type: sql.Int, value: targetUserId }]
        );
        const preTest = preTestResult.recordset[0] || null;

        // Progress per week
        const weeklyProgress = await executeQuery(`
            SELECT MW.WeekNumber, MW.Title,
                COUNT(DISTINCT A.ActivityID) as TotalActivities,
                COUNT(DISTINCT CASE WHEN UP.IsCompleted = 1 THEN UP.ActivityID END) as CompletedActivities,
                AVG(CASE WHEN UP.IsCompleted = 1 THEN UP.Score END) as AvgScore,
                SUM(UP.TimeSpentSeconds) as TotalTime,
                AVG(CAST(UP.AttemptNumber AS FLOAT)) as AvgAttempts
            FROM ModuleWeeks MW
            LEFT JOIN Activities A ON MW.WeekID = A.WeekID
            LEFT JOIN UserProgress UP ON A.ActivityID = UP.ActivityID AND UP.UserID = @UserID
            WHERE MW.ModuleID = 1
            GROUP BY MW.WeekNumber, MW.Title
            ORDER BY MW.WeekNumber
        `, [{ name: 'UserID', type: sql.Int, value: targetUserId }]);

        // Progress per competency (for radar chart)
        const competencyProgress = await executeQuery(`
            SELECT AT.TypeName, AVG(UP.Score) as AvgScore, COUNT(*) as Activities
            FROM UserProgress UP
            INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
            INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
            WHERE UP.UserID = @UserID AND UP.IsCompleted = 1
            GROUP BY AT.TypeName
        `, [{ name: 'UserID', type: sql.Int, value: targetUserId }]);

        // Build data points for Linear Regression (week → avg score)
        const weekData = weeklyProgress.recordset
            .filter(w => w.AvgScore !== null)
            .map(w => ({ x: w.WeekNumber, y: parseFloat(w.AvgScore) }));

        const linearResult = MLService.linearRegression(weekData);

        // Build features for Logistic Regression
        const completedWeeks = weeklyProgress.recordset.filter(w => w.CompletedActivities > 0).length;
        const allScores = weeklyProgress.recordset.filter(w => w.AvgScore !== null).map(w => parseFloat(w.AvgScore));
        const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
        const allAttempts = weeklyProgress.recordset.filter(w => w.AvgAttempts !== null).map(w => parseFloat(w.AvgAttempts));
        const avgAttempts = allAttempts.length > 0 ? allAttempts.reduce((a, b) => a + b, 0) / allAttempts.length : 1;
        const totalTime = weeklyProgress.recordset.reduce((s, w) => s + (w.TotalTime || 0), 0);
        const avgTimeSeconds = completedWeeks > 0 ? totalTime / completedWeeks : 0;

        const logisticResult = MLService.logisticRegression({
            avgScore,
            preTestScore: preTest ? parseFloat(preTest.TotalScore) : 0,
            completedWeeks,
            currentStreak: student.CurrentStreak,
            avgAttempts,
            avgTimeSeconds
        });

        // K-Means cluster for this student
        const studentsForCluster = await executeQuery(`
            SELECT U.UserID,
                ISNULL(UG.TotalXP, 0) as totalXP,
                ISNULL((SELECT AVG(UP2.Score) FROM UserProgress UP2 WHERE UP2.UserID = U.UserID AND UP2.IsCompleted = 1), 0) as avgScore,
                ISNULL((SELECT AVG(CAST(UP2.AttemptNumber AS FLOAT)) FROM UserProgress UP2 WHERE UP2.UserID = U.UserID), 1) as avgAttempts,
                ISNULL((SELECT MAX(MW.WeekNumber) FROM UserProgress UP2
                    INNER JOIN Activities A2 ON UP2.ActivityID = A2.ActivityID
                    INNER JOIN ModuleWeeks MW ON A2.WeekID = MW.WeekID
                    WHERE UP2.UserID = U.UserID AND UP2.IsCompleted = 1), 0) as completedWeeks
            FROM Users U
            INNER JOIN Roles R ON U.RoleID = R.RoleID
            LEFT JOIN UserGamification UG ON U.UserID = UG.UserID
            WHERE R.RoleName = 'student' AND U.IsActive = 1
        `);
        const clustered = MLService.kMeansClustering(studentsForCluster.recordset, 3);
        const thisStudentCluster = clustered.find(s => s.UserID === targetUserId) || { clusterName: 'Sin datos', clusterColor: '#6b7280' };

        res.render('admin/student_detail', {
            title: `Progreso de ${student.FirstName} ${student.LastName}`,
            cssFile: 'admin.css',
            student,
            preTest,
            weeklyProgress: weeklyProgress.recordset,
            competencyProgress: competencyProgress.recordset,
            linearResult,
            logisticResult,
            clusterInfo: thisStudentCluster,
            user: req.session.user
        });
    } catch (error) {
        console.error('Student Detail Error:', error);
        res.redirect('/admin/dashboard');
    }
};
