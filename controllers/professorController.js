/**
 * controllers/professorController.js
 * Controlador del Rol Profesor — Solo Lectura
 * Acceso a analíticas, KPIs, modelos predictivos y detalle de estudiantes sin opciones de edición/eliminación.
 */
const User = require('../models/User');
const { executeQuery, sql } = require('../config/database');
const MLService = require('../services/mlService');

class ProfessorController {
    async showDashboard(req, res) {
        try {
            // Total Active Students
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
            
            // Abandon rate (7+ days inactive)
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
                       ISNULL((SELECT COUNT(DISTINCT MW.WeekNumber) FROM UserProgress UP2
                        INNER JOIN Activities A2 ON UP2.ActivityID = A2.ActivityID
                        INNER JOIN ModuleWeeks MW ON A2.WeekID = MW.WeekID
                        WHERE UP2.UserID = U.UserID AND UP2.IsCompleted = 1), 0) as CurrentWeek,
                       (SELECT TOP 1 A3.Title FROM UserProgress UP3 
                        INNER JOIN Activities A3 ON UP3.ActivityID = A3.ActivityID 
                        WHERE UP3.UserID = U.UserID AND UP3.IsCompleted = 1 
                        ORDER BY UP3.CompletedAt DESC) as CurrentActivity
                FROM Users U
                INNER JOIN Roles R ON U.RoleID = R.RoleID
                LEFT JOIN UserGamification UG ON U.UserID = UG.UserID
                WHERE R.RoleName = 'student'
                ORDER BY U.CreatedAt DESC
            `);
            
            res.render('professor/dashboard', {
                title: 'Panel del Docente',
                cssFile: 'admin.css',
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
            console.error('Professor Dashboard Error:', error);
            res.redirect('/');
        }
    }

    async getKPIData(req, res) {
        try {
            // Reusing the robust KPI analytics logic
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
            
            const weeklyTime = await executeQuery(`
                SELECT MW.WeekNumber, AVG(UP.TimeSpentSeconds) as AvgTime
                FROM ModuleWeeks MW
                INNER JOIN Activities A ON MW.WeekID = A.WeekID
                INNER JOIN UserProgress UP ON A.ActivityID = UP.ActivityID
                WHERE MW.ModuleID = 1 AND UP.IsCompleted = 1
                GROUP BY MW.WeekNumber ORDER BY MW.WeekNumber
            `);
            
            const effectiveness = await executeQuery(`
                SELECT AT.TypeName, AVG(UP.Score) as AvgScore, COUNT(*) as Attempts
                FROM UserProgress UP
                INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
                INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
                WHERE UP.IsCompleted = 1
                GROUP BY AT.TypeName
            `);
            
            const dailyActivity = await executeQuery(`
                SELECT CAST(UP.CompletedAt AS DATE) as ActivityDate, COUNT(*) as ActivityCount
                FROM UserProgress UP
                WHERE UP.CompletedAt >= DATEADD(day, -7, GETDATE())
                GROUP BY CAST(UP.CompletedAt AS DATE)
                ORDER BY ActivityDate
            `);

            const preTestAvgs = await executeQuery(`
                SELECT 
                    AVG(VocabularyScore) as AvgVocab,
                    AVG(ReadingScore) as AvgReading,
                    AVG(PragmaticsScore) as AvgPragmatics,
                    AVG(GrammarScore) as AvgGrammar,
                    AVG(TotalScore) as AvgTotal
                FROM UserExams WHERE ExamType = 'PRE'
            `);

            const moduleAvgs = await executeQuery(`
                SELECT AT.TypeName, AVG(UP.Score) as AvgScore
                FROM UserProgress UP
                INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
                INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
                WHERE UP.IsCompleted = 1
                GROUP BY AT.TypeName
            `);

            const xpDistribution = await executeQuery(`
                SELECT UG.Level, COUNT(*) as StudentCount
                FROM UserGamification UG
                INNER JOIN Users U ON UG.UserID = U.UserID
                INNER JOIN Roles R ON U.RoleID = R.RoleID
                WHERE R.RoleName = 'student'
                GROUP BY UG.Level
                ORDER BY UG.Level
            `);

            const topStudents = await executeQuery(`
                SELECT TOP 10 U.FirstName + ' ' + U.LastName as FullName, UG.TotalXP, UG.Level
                FROM UserGamification UG
                INNER JOIN Users U ON UG.UserID = U.UserID
                INNER JOIN Roles R ON U.RoleID = R.RoleID
                WHERE R.RoleName = 'student' AND U.IsActive = 1
                ORDER BY UG.TotalXP DESC
            `);

            const studentsForClustering = await executeQuery(`
                SELECT 
                    U.UserID, U.FirstName + ' ' + U.LastName as FullName,
                    ISNULL(UG.TotalXP, 0) as totalXP,
                    ISNULL(UG.Level, 1) as level,
                    ISNULL(UG.CurrentStreak, 0) as currentStreak,
                    ISNULL((SELECT AVG(UP2.Score) FROM UserProgress UP2 WHERE UP2.UserID = U.UserID AND UP2.IsCompleted = 1), 0) as avgScore,
                    ISNULL((SELECT AVG(CAST(UP2.AttemptNumber AS FLOAT)) FROM UserProgress UP2 WHERE UP2.UserID = U.UserID), 1) as avgAttempts,
                    ISNULL((SELECT COUNT(DISTINCT MW.WeekNumber) FROM UserProgress UP2
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
            console.error('Professor KPI Data Error:', error);
            res.status(500).json({ error: 'Error al obtener KPIs' });
        }
    }

    async showStudentDetail(req, res) {
        try {
            const targetUserId = parseInt(req.params.id, 10);

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
            if (!student) return res.redirect('/professor/dashboard');

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

            // Progress per competency
            const competencyProgress = await executeQuery(`
                SELECT AT.TypeName, AVG(UP.Score) as AvgScore, COUNT(*) as Activities
                FROM UserProgress UP
                INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
                INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
                WHERE UP.UserID = @UserID AND UP.IsCompleted = 1
                GROUP BY AT.TypeName
            `, [{ name: 'UserID', type: sql.Int, value: targetUserId }]);

            // Linear Regression
            const weekData = weeklyProgress.recordset
                .filter(w => w.AvgScore !== null)
                .map(w => ({ x: w.WeekNumber, y: parseFloat(w.AvgScore) }));

            const linearResult = MLService.linearRegression(weekData);

            // Per-activity progress for accurate ML calculations matching aiAssistantService
            const individualProgress = await executeQuery(`
                SELECT UP.Score, UP.AttemptNumber, UP.TimeSpentSeconds, UP.IsCompleted,
                       AT.TypeName
                FROM UserProgress UP
                INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
                INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
                WHERE UP.UserID = @UserID
            `, [{ name: 'UserID', type: sql.Int, value: targetUserId }]);
            const indivProgress = individualProgress.recordset;
            const indivCount = indivProgress.length;

            const compStats = { Vocabulary: { sum: 0, count: 0 }, Reading: { sum: 0, count: 0 }, Pragmatics: { sum: 0, count: 0 }, Grammar: { sum: 0, count: 0 } };
            indivProgress.forEach(p => {
                if (compStats[p.TypeName]) {
                    compStats[p.TypeName].sum += parseFloat(p.Score || 0);
                    compStats[p.TypeName].count++;
                }
            });
            const compAverages = {};
            ['Vocabulary', 'Reading', 'Pragmatics', 'Grammar'].forEach(type => {
                if (compStats[type].count > 0) {
                    compAverages[type] = compStats[type].sum / compStats[type].count;
                } else if (preTest) {
                    if (type === 'Vocabulary') compAverages[type] = parseFloat(preTest.VocabularyScore || 0);
                    else if (type === 'Reading') compAverages[type] = parseFloat(preTest.ReadingScore || 0);
                    else if (type === 'Pragmatics') compAverages[type] = parseFloat(preTest.PragmaticsScore || 0);
                    else if (type === 'Grammar') compAverages[type] = parseFloat(preTest.GrammarScore || 0);
                } else {
                    compAverages[type] = 0;
                }
            });
            const avgScore = (compAverages.Vocabulary + compAverages.Reading + compAverages.Pragmatics + compAverages.Grammar) / 4;
            const avgAttempts = indivCount > 0 ? indivProgress.reduce((s, p) => s + (p.AttemptNumber || 1), 0) / indivCount : 1;
            const avgTimeSeconds = indivCount > 0 ? indivProgress.reduce((s, p) => s + (p.TimeSpentSeconds || 0), 0) / indivCount : 0;
            const completedWeeks = weeklyProgress.recordset.filter(w => w.CompletedActivities > 0).length;

            const logisticResult = MLService.logisticRegression({
                avgScore,
                preTestScore: preTest ? parseFloat(preTest.TotalScore) : 0,
                completedWeeks,
                currentStreak: student.CurrentStreak,
                avgAttempts,
                avgTimeSeconds
            });

            // K-Means cluster
            const studentsForCluster = await executeQuery(`
                SELECT U.UserID,
                    ISNULL(UG.TotalXP, 0) as totalXP,
                    ISNULL((SELECT AVG(UP2.Score) FROM UserProgress UP2 WHERE UP2.UserID = U.UserID AND UP2.IsCompleted = 1), 0) as avgScore,
                    ISNULL((SELECT AVG(CAST(UP2.AttemptNumber AS FLOAT)) FROM UserProgress UP2 WHERE UP2.UserID = U.UserID), 1) as avgAttempts,
                    ISNULL((SELECT COUNT(DISTINCT MW.WeekNumber) FROM UserProgress UP2
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

            res.render('professor/student_detail', {
                title: `Progreso de ${student.FirstName} ${student.LastName}`,
                cssFile: 'admin.css',
                student,
                preTest,
                weeklyProgress: weeklyProgress.recordset,
                competencyProgress: competencyProgress.recordset,
                compAverages,
                linearResult,
                logisticResult,
                clusterInfo: thisStudentCluster,
                projectedSaberPro: Math.round((linearResult.projectedScore / 100) * 300) || Math.round((avgScore / 100) * 300),
                user: req.session.user
            });
        } catch (error) {
            console.error('Professor Student Detail Error:', error);
            res.redirect('/professor/dashboard');
        }
    }
}

module.exports = new ProfessorController();
