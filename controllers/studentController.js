/**
 * controllers/studentController.js
 * Controlador del Estudiante — Conexión real a Azure SQL Server
 * Roadmap de 12 semanas, progreso de sub-módulos y perfil
 */
const Module = require('../models/Module');
const Progress = require('../models/Progress');
const Gamification = require('../models/Gamification');
const { executeQuery, sql } = require('../config/database');

exports.showRoadmap = async (req, res) => {
    try {
        const userId = req.session.userId;
        const moduleId = 1; // Inglés Saber Pro
        
        // Check if Pre-Test is completed
        const preTestQuery = `SELECT 1 FROM UserExams WHERE UserID = @UserID AND ExamType = 'PRE'`;
        const preTestResult = await executeQuery(preTestQuery, [{ name: 'UserID', type: sql.Int, value: userId }]);
        if (preTestResult.recordset.length === 0) {
            return res.redirect('/exam/pre-test');
        }

        // Get module weeks
        const weeks = await Module.getWeeks(moduleId);
        
        // Get student progress for this module
        const progress = await Progress.getStudentProgress(userId, moduleId);
        
        // Get gamification stats
        const studentStats = await Gamification.getStudentStats(userId) || {
            TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0
        };
        
        // Get badges
        const earnedBadges = await Gamification.getUserBadges(userId);
        
        // Get all badges for display (earned + locked)
        const allBadgesResult = await executeQuery('SELECT * FROM Badges ORDER BY XPRequired ASC');
        const allBadges = allBadgesResult.recordset.map(badge => ({
            ...badge,
            earned: earnedBadges.some(eb => eb.BadgeID === badge.BadgeID)
        }));
        
        // Enrich weeks with progress data
        const enrichedWeeks = [];
        let previousCompleted = true; // First week is always available
        
        for (const week of weeks) {
            const weekActivities = await Module.getWeekActivities(week.WeekID);
            
            // Filter progress to find unique activities completed in this specific week
            const weekProgress = progress.filter(p => p.WeekID === week.WeekID);
            const completedActivityIds = new Set(
                weekProgress
                    .filter(p => p.IsCompleted === true || p.IsCompleted === 1)
                    .map(p => p.ActivityID)
            );
            
            // A week is completed only if ALL its activities are successfully completed
            const isCompleted = weekActivities.length > 0 && completedActivityIds.size >= weekActivities.length;
            const isAvailable = previousCompleted;
            
            const activityLink = `/student/week/${week.WeekID}`;
            
            enrichedWeeks.push({
                ...week,
                isCompleted,
                isAvailable,
                isBossWeek: week.IsBossWeek === true || week.IsBossWeek === 1,
                activityLink,
                completedCount: completedActivityIds.size,
                totalActivities: weekActivities.length
            });
            
            previousCompleted = isCompleted;
        }
        
        // Update streak
        await Gamification.updateStreak(userId);
        
        res.render('student/roadmap', {
            title: 'Mi Ruta de Aprendizaje',
            cssFile: 'roadmap.css',
            jsFile: 'roadmap.js',
            weeks: enrichedWeeks,
            badges: allBadges,
            studentStats,
            allWeeksCompleted: previousCompleted,
            user: req.session.user
        });
        
    } catch (error) {
        console.error('Roadmap Error:', error);
        res.status(500).send('Error cargando el roadmap. Intenta de nuevo.');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, password } = req.body;
        const userId = req.session.userId;
        
        let query = `UPDATE Users SET FirstName = @FirstName, LastName = @LastName`;
        const params = [
            { name: 'FirstName', type: require('../config/database').sql.NVarChar, value: firstName },
            { name: 'LastName', type: require('../config/database').sql.NVarChar, value: lastName },
            { name: 'UserID', type: require('../config/database').sql.Int, value: userId }
        ];

        if (password && password.trim() !== '') {
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash(password, 10);
            query += `, PasswordHash = @PasswordHash`;
            params.push({ name: 'PasswordHash', type: require('../config/database').sql.NVarChar, value: hash });
        }
        
        query += ` WHERE UserID = @UserID`;
        
        await require('../config/database').executeQuery(query, params);
        
        // Update session
        if (req.session.user) {
            req.session.user.FirstName = firstName;
            req.session.user.LastName = lastName;
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
};

exports.showWeek = async (req, res) => {
    try {
        const userId = req.session.userId;
        const weekId = parseInt(req.params.weekId);

        // Check if Pre-Test is completed
        const preTestQuery = `SELECT 1 FROM UserExams WHERE UserID = @UserID AND ExamType = 'PRE'`;
        const preTestResult = await executeQuery(preTestQuery, [{ name: 'UserID', type: sql.Int, value: userId }]);
        if (preTestResult.recordset.length === 0) {
            return res.redirect('/exam/pre-test');
        }
        
        // Get week details
        const weekResult = await executeQuery('SELECT * FROM ModuleWeeks WHERE WeekID = @WeekID', [
            { name: 'WeekID', type: sql.Int, value: weekId }
        ]);
        const week = weekResult.recordset[0];
        if (!week) return res.redirect('/student');
        
        // Get activities of this week (should be 20)
        const activities = await Module.getWeekActivities(weekId);
        
        // Get user progress in this week
        const weekProgress = await Progress.getWeekProgress(userId, weekId);
        
        // Map activities to establish their state (locked/available/completed)
        const enrichedActivities = [];
        let previousCompleted = true; // First activity is always available
        
        activities.forEach(act => {
            // Check if there is ANY successful completion for this activity
            const isCompleted = weekProgress.some(p => p.ActivityID === act.ActivityID && (p.IsCompleted === true || p.IsCompleted === 1));
            const isAvailable = previousCompleted;
            
            // Set game URL
            let playUrl = '#';
            if (act.GameMechanic === 'vocabulary_match') {
                playUrl = `/game/vocabulary/${act.ActivityID}`;
            } else if (act.GameMechanic === 'drag_drop') {
                playUrl = `/game/reading/${act.ActivityID}`;
            } else if (act.GameMechanic === 'boss_multiple_choice') {
                playUrl = `/game/boss/${act.ActivityID}`;
            } else if (act.GameMechanic === 'pragmatics_map') {
                playUrl = `/game/pragmatics/${act.ActivityID}`;
            } else if (act.GameMechanic === 'grammar_circuit') {
                playUrl = `/game/grammar/${act.ActivityID}`;
            }
            
            enrichedActivities.push({
                ...act,
                isCompleted,
                isAvailable,
                playUrl
            });
            
            previousCompleted = isCompleted;
        });
        
        const completedCount = enrichedActivities.filter(a => a.isCompleted).length;
        const totalCoins = enrichedActivities.reduce((acc, a) => acc + (a.isCompleted ? a.CoinReward : 0), 0);
        
        // Get student stats for header navbar
        const studentStats = await Gamification.getStudentStats(userId) || {
            TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0
        };
        
        res.render('student/week', {
            title: `Semana ${week.WeekNumber}: ${week.Title}`,
            cssFile: 'roadmap.css', // reuse roadmap styling layout
            jsFile: null,
            week,
            activities: enrichedActivities,
            completedCount,
            totalCoins,
            studentStats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Week Error:', error);
        res.redirect('/student');
    }
};

exports.showProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Get gamification stats
        const studentStats = await Gamification.getStudentStats(userId) || {
            TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0, LongestStreak: 0
        };
        
        // Get badges
        const earnedBadges = await Gamification.getUserBadges(userId);
        
        // Get user progress details
        const progressStats = await Progress.getCompletionStats(userId) || {
            TotalActivities: 0, CompletedActivities: 0, AverageScore: 0
        };

        // AI Assistant Data
        const AIAssistantService = require('../services/aiAssistantService');
        const aiReport = await AIAssistantService.generatePersonalizedReport(userId);
        
        res.render('student/profile', {
            title: 'Mi Perfil de Estudiante',
            cssFile: 'profile.css',
            jsFile: null,
            studentStats,
            badges: earnedBadges,
            progressStats,
            aiReport,
            student: req.session.user,
            user: req.session.user
        });
    } catch (error) {
        console.error('Profile Error:', error);
        res.redirect('/student');
    }
};
