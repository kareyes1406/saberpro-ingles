const Progress = require('../models/Progress');
const Gamification = require('../models/Gamification');
const Evaluation = require('../models/Evaluation');
const { executeQuery, sql } = require('../config/database');
const MLService = require('./mlService');

class AIAssistantService {
    static async generatePersonalizedReport(userId) {
        // 1. Get Pre-Test Score
        const preTestQuery = `SELECT * FROM UserExams WHERE UserID = @UserID AND ExamType = 'PRE'`;
        const preTestResult = await executeQuery(preTestQuery, [{ name: 'UserID', type: sql.Int, value: userId }]);
        const preTest = preTestResult.recordset[0];

        if (!preTest) {
            return {
                reportText: "Aún no has completado tu Pre-Test Diagnóstico. Complétalo para que pueda analizar tu perfil.",
                radarData: [0, 0, 0, 0],
                strengths: [],
                weaknesses: []
            };
        }

        // 2. Get Module Progress
        const progressQuery = `
            SELECT UP.ActivityID, UP.IsCompleted, UP.Score, UP.AttemptNumber, UP.TimeSpentSeconds, A.ActivityTypeID, AT.TypeName
            FROM UserProgress UP
            INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
            INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
            WHERE UP.UserID = @UserID
        `;
        const progressResult = await executeQuery(progressQuery, [{ name: 'UserID', type: sql.Int, value: userId }]);
        const progress = progressResult.recordset;

        // 3. Aggregate Data by Competency
        const stats = {
            Vocabulary: { scoreSum: 0, attemptsSum: 0, count: 0, timeSum: 0 },
            Reading: { scoreSum: 0, attemptsSum: 0, count: 0, timeSum: 0 },
            Pragmatics: { scoreSum: 0, attemptsSum: 0, count: 0, timeSum: 0 },
            Grammar: { scoreSum: 0, attemptsSum: 0, count: 0, timeSum: 0 }
        };

        progress.forEach(p => {
            const type = p.TypeName;
            if (stats[type]) {
                stats[type].scoreSum += parseFloat(p.Score || 0);
                stats[type].attemptsSum += p.AttemptNumber || 1;
                stats[type].timeSum += p.TimeSpentSeconds || 0;
                stats[type].count++;
            }
        });

        // 4. Calculate Averages and Radar Data
        const currentAverages = {};
        const radarData = [];
        
        ['Vocabulary', 'Reading', 'Pragmatics', 'Grammar'].forEach(type => {
            const data = stats[type];
            if (data.count > 0) {
                currentAverages[type] = {
                    score: data.scoreSum / data.count,
                    attempts: data.attemptsSum / data.count,
                    time: data.timeSum / data.count
                };
                radarData.push(Math.round(data.scoreSum / data.count));
            } else {
                let preScore = 0;
                if (type === 'Vocabulary') preScore = preTest.VocabularyScore;
                if (type === 'Reading') preScore = preTest.ReadingScore;
                if (type === 'Pragmatics') preScore = preTest.PragmaticsScore;
                if (type === 'Grammar') preScore = preTest.GrammarScore;
                
                currentAverages[type] = { score: preScore, attempts: 1, time: 0 };
                radarData.push(Math.round(preScore));
            }
        });

        const averageCurrentScore = (radarData[0] + radarData[1] + radarData[2] + radarData[3]) / 4;

        // 5. ML INTREGRATION - Logistic Regression
        const gamiQuery = `SELECT * FROM UserGamification WHERE UserID = @UserID`;
        const gamiResult = await executeQuery(gamiQuery, [{ name: 'UserID', type: sql.Int, value: userId }]);
        const gamiStats = gamiResult.recordset[0] || {};
        
        const weeksQuery = `
            SELECT COUNT(DISTINCT A.WeekID) as completedWeeks 
            FROM UserProgress UP
            INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
            WHERE UP.UserID = @UserID AND UP.IsCompleted = 1
        `;
        const weeksResult = await executeQuery(weeksQuery, [{ name: 'UserID', type: sql.Int, value: userId }]);
        const completedWeeks = weeksResult.recordset[0].completedWeeks || 0;
        
        const totalCount = progress.length;
        const avgAttempts = totalCount > 0 ? progress.reduce((s, p) => s + (p.AttemptNumber || 1), 0) / totalCount : 1;
        const avgTimeSeconds = totalCount > 0 ? progress.reduce((s, p) => s + (p.TimeSpentSeconds || 0), 0) / totalCount : 0;

        const logisticResult = MLService.logisticRegression({
            avgScore: averageCurrentScore,
            preTestScore: preTest.TotalScore,
            completedWeeks: completedWeeks,
            currentStreak: gamiStats.CurrentStreak || 0,
            avgAttempts: avgAttempts,
            avgTimeSeconds: avgTimeSeconds
        });

        // 6. ML INTEGRATION - Linear Regression (Projected Score)
        const weeklyProgress = await executeQuery(`
            SELECT MW.WeekNumber, AVG(UP.Score) as AvgScore
            FROM ModuleWeeks MW
            INNER JOIN Activities A ON MW.WeekID = A.WeekID
            INNER JOIN UserProgress UP ON A.ActivityID = UP.ActivityID
            WHERE UP.UserID = @UserID AND UP.IsCompleted = 1
            GROUP BY MW.WeekNumber
            ORDER BY MW.WeekNumber
        `, [{ name: 'UserID', type: sql.Int, value: userId }]);
        
        const weekData = weeklyProgress.recordset.map(w => ({ x: w.WeekNumber, y: parseFloat(w.AvgScore) }));
        const linearResult = MLService.linearRegression(weekData);
        const projectedSaberPro = Math.round((linearResult.projectedScore / 100) * 300) || Math.round((averageCurrentScore / 100) * 300);

        // 7. ML INTEGRATION - K-Means Clustering & Gamified Ranks
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
        const thisStudentCluster = clustered.find(s => s.UserID === userId);
        
        let gamifiedRank = "Explorador de Saberes 🧭";
        if (thisStudentCluster) {
            if (thisStudentCluster.clusterName.includes('Alto Rendimiento')) gamifiedRank = 'Maestro Diamante 💎';
            else if (thisStudentCluster.clusterName.includes('Progreso')) gamifiedRank = 'Aventurero Oro 🏆';
            else if (thisStudentCluster.clusterName.includes('Riesgo')) gamifiedRank = 'Guerrero Bronce 🥉';
        }

        // 8. CALCULATE PERCENTILES
        const allScoresQuery = `
            SELECT UP.UserID, AT.TypeName, AVG(UP.Score) as AvgScore
            FROM UserProgress UP
            INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
            INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
            WHERE UP.IsCompleted = 1
            GROUP BY UP.UserID, AT.TypeName
        `;
        const allScoresResult = await executeQuery(allScoresQuery);
        const allScores = allScoresResult.recordset;
        
        const typeNames = {
            'Vocabulary': 'Vocabulario',
            'Reading': 'Comprensión Lectora',
            'Pragmatics': 'Pragmática',
            'Grammar': 'Gramática'
        };
        
        const percentiles = {};
        ['Vocabulary', 'Reading', 'Pragmatics', 'Grammar'].forEach(type => {
            const scoresOfThisType = allScores.filter(s => s.TypeName === type).map(s => parseFloat(s.AvgScore));
            if (scoresOfThisType.length > 0 && currentAverages[type]) {
                const myScore = currentAverages[type].score;
                const belowMe = scoresOfThisType.filter(s => s < myScore).length;
                const sameScore = scoresOfThisType.filter(s => s === myScore).length;
                const pctl = ((belowMe + 0.5 * sameScore) / scoresOfThisType.length) * 100;
                percentiles[type] = Math.max(1, Math.round(100 - pctl));
            }
        });

        // 9. BUILD THE REPORT TEXT
        let reportText = `¡Hola! Soy tu asistente IA de aprendizaje. Mi algoritmo te clasifica como un **${gamifiedRank}**. \n\n`;
        
        reportText += `🎯 **Proyección Saber Pro:** Analizando tu tendencia histórica, tu puntaje proyectado es **${projectedSaberPro} / 300** en el examen final. \n\n`;
        
        reportText += `Además, calculo que tienes un **${logisticResult.probability}% de probabilidad** de superar el umbral de aprobación. ${logisticResult.recommendation}\n\n`;
        
        if (Object.keys(percentiles).length > 0) {
            reportText += `📊 **Comparativa de Nivel (Top %):**\n`;
            Object.entries(percentiles).forEach(([type, topPct]) => {
                const typeName = typeNames[type];
                let emoji = topPct <= 20 ? '🔥' : topPct <= 50 ? '👍' : '⚠️';
                reportText += `- En **${typeName}** estás en el **Top ${topPct}%** de toda la clase. ${emoji}\n`;
            });
        }
        
        let weakestType = 'Vocabulary';
        let lowestScore = 100;
        ['Vocabulary', 'Reading', 'Pragmatics', 'Grammar'].forEach(type => {
            if (currentAverages[type] && currentAverages[type].score < lowestScore) {
                lowestScore = currentAverages[type].score;
                weakestType = type;
            }
        });
        
        reportText += `\n💡 **Siguiente Paso Recomendado:** Te sugiero enfocarte en **${typeNames[weakestType]}**. Es el área donde más rápido puedes subir de nivel.\n`;

        if (logisticResult.riskFactors && logisticResult.riskFactors.length > 0) {
            reportText += `\n🚨 **Factores a mejorar (Mi radar ha detectado):**\n`;
            logisticResult.riskFactors.forEach(rf => {
                reportText += `- ${rf.factor}\n`;
            });
        }

        return {
            reportText,
            radarData,
            projectedScore: projectedSaberPro,
            strengths: [],
            weaknesses: []
        };
    }
}

module.exports = AIAssistantService;
