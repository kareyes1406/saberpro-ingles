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
        
        const weekData = [];
        if (preTest && preTest.TotalScore !== null && preTest.TotalScore !== undefined) {
            weekData.push({ x: 0, y: parseFloat(preTest.TotalScore) });
        }
        weeklyProgress.recordset.forEach(w => {
            if (w.AvgScore !== null && w.AvgScore !== undefined) {
                weekData.push({ x: w.WeekNumber, y: parseFloat(w.AvgScore) });
            }
        });
        const linearResult = MLService.linearRegression(weekData);
        const projectedSaberPro = Math.round((linearResult.projectedScore / 100) * 300) || Math.round((averageCurrentScore / 100) * 300);

        // 7. ML INTEGRATION - K-Means Clustering & Gamified Ranks
        const studentsForCluster = await executeQuery(`
            SELECT U.UserID,
                ISNULL(UG.TotalXP, 0) as totalXP,
                ISNULL(
                    (SELECT AVG(UP2.Score) FROM UserProgress UP2 WHERE UP2.UserID = U.UserID AND UP2.IsCompleted = 1),
                    ISNULL((SELECT TOP 1 TotalScore FROM UserExams UE WHERE UE.UserID = U.UserID AND UE.ExamType = 'PRE' ORDER BY CompletedAt DESC), 0)
                ) as avgScore,
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
        const thisStudentCluster = clustered.find(s => s.UserID === userId);
        
        const level = gamiStats.Level || 1;
        let gamifiedRank = "Explorador de Saberes 🧭";
        if (progress.length === 0) {
            gamifiedRank = "Aspirante a Saber Pro 📝";
        } else if (level >= 10) {
            gamifiedRank = "Maestro Diamante 💎";
        } else if (level >= 7) {
            gamifiedRank = "Experto Platino 💠";
        } else if (level >= 4) {
            gamifiedRank = "Aventurero Oro 🏆";
        } else if (level >= 2) {
            gamifiedRank = "Explorador Plata 🥈";
        } else {
            gamifiedRank = "Iniciado Bronce 🥉";
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
            'Pragmatics': 'Avisos y Diálogos',
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

        // 9. ADVANCED NLG EXPERT SYSTEM (Generación de Lenguaje Natural)
        
        // Determinar fortalezas y debilidades reales
        const sortedTypes = ['Vocabulary', 'Reading', 'Pragmatics', 'Grammar']
            .filter(t => currentAverages[t])
            .map(t => ({
                type: t,
                name: typeNames[t],
                score: currentAverages[t].score,
                percentile: percentiles[t] || 50
            }))
            .sort((a, b) => b.score - a.score);

        const bestType = sortedTypes.length > 0 ? sortedTypes[0] : null;
        const weakestTypeData = sortedTypes.length > 0 ? sortedTypes[sortedTypes.length - 1] : null;

        // Recuperar nombre del estudiante
        const userQuery = await executeQuery('SELECT FirstName FROM Users WHERE UserID = @UserID', [{ name: 'UserID', type: sql.Int, value: userId }]);
        const studentName = userQuery.recordset[0]?.FirstName || 'Estudiante';

        // Helper para aleatoriedad
        const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        let reportText = "";

        if (progress.length === 0) {
            // Reporte para estudiante recién llegado (sólo pre-test)
            const intros = [
                `¡Hola <strong>${studentName}</strong>! Veo que has completado tu <strong>Prueba Diagnóstica</strong>, pero aún no has iniciado tu entrenamiento en los módulos.`,
                `¡Bienvenido <strong>${studentName}</strong>! Tu diagnóstico inicial está listo, aunque noto que todavía no has empezado los desafíos de la plataforma.`,
                `¡Saludos <strong>${studentName}</strong>! Ya tengo los resultados de tu evaluación previa, ahora solo falta que comiences a sumar experiencia en los minijuegos.`
            ];
            
            const projections = [
                `Basado exclusivamente en tu diagnóstico, proyecto que obtendrías aproximadamente <strong>${projectedSaberPro} puntos</strong> en la prueba real. Tienes una probabilidad inicial de éxito del <strong>${logisticResult.probability}%</strong>.`,
                `Según este primer escaneo, mi algoritmo estima un puntaje de <strong>${projectedSaberPro} puntos sobre 300</strong> en el examen nacional, con un <strong>${logisticResult.probability}%</strong> de opciones de aprobar.`,
                `Si el examen del ICFES fuera hoy, mis cálculos te situarían en <strong>${projectedSaberPro} puntos</strong>. Tienes un <strong>${logisticResult.probability}%</strong> de probabilidad de superarlo exitosamente.`
            ];

            reportText += `<p style="margin-bottom: 1rem;">${pickRandom(intros)}</p>`;
            reportText += `<p style="margin-bottom: 1rem;">${pickRandom(projections)}</p>`;

            if (bestType && weakestTypeData && bestType.type !== weakestTypeData.type) {
                const skills = [
                    `Tu mapa de habilidades revela que tienes potencial en <strong>${bestType.name}</strong>, pero te recomiendo que nuestra prioridad sea reforzar <strong>${weakestTypeData.name}</strong>.`,
                    `Tus bases en <strong>${bestType.name}</strong> son prometedoras; sin embargo, el análisis muestra que debes enfocar tu energía en mejorar <strong>${weakestTypeData.name}</strong>.`,
                    `Destacas inicialmente en <strong>${bestType.name}</strong>. A pesar de ello, el principal obstáculo a superar será tu rendimiento en <strong>${weakestTypeData.name}</strong>.`
                ];
                reportText += `<p style="margin-bottom: 1rem;">${pickRandom(skills)}</p>`;
            }

            const advices = [
                `<strong>Mi consejo inmediato:</strong> ¡Ve al mapa interactivo y comienza tu primer desafío ahora mismo! Entre más juegues, más preciso será mi análisis.`,
                `<strong>¿Qué sigue?</strong> Abre el mapa de módulos y supera tu primera lección para que empiece a medir tu verdadero potencial de aprendizaje.`,
                `<strong>Tu próximo paso:</strong> Dirígete a la ruta de aprendizaje y completa tu primera actividad. ¡Demuéstrame de qué eres capaz!`
            ];
            reportText += `<p style="margin-bottom: 0;">${pickRandom(advices)}</p>`;

        } else {
            // Reporte completo para estudiantes activos
            const greetingOpts = [
                `¡Hola <strong>${studentName}</strong>! He analizado a fondo tu rendimiento y patrones de aprendizaje.`,
                `¡Saludos <strong>${studentName}</strong>! Como tu tutor virtual de IA, he procesado tus últimas métricas.`,
                `¡Qué tal <strong>${studentName}</strong>! He escaneado tu progreso cognitivo en la plataforma.`
            ];

            let statusOpts = [];
            if (logisticResult.probability >= 80) {
                statusOpts = [
                    `Estás en el camino perfecto para triunfar. Has alcanzado el rango de <strong>${gamifiedRank}</strong>, lo que indica un dominio excelente. Estimo un <strong>${logisticResult.probability}% de probabilidad</strong> de que superes la prueba Saber Pro con holgura.`,
                    `¡Tus métricas son sobresalientes! Actualmente ostentas el título de <strong>${gamifiedRank}</strong>. Los datos me dan un <strong>${logisticResult.probability}% de certeza</strong> de que aprobarás el examen sin problemas.`,
                    `Demuestras un rendimiento de élite. Tu nivel como <strong>${gamifiedRank}</strong> respalda mi predicción: tienes un <strong>${logisticResult.probability}% de posibilidades</strong> de obtener un gran resultado nacional.`
                ];
            } else if (logisticResult.probability >= 60) {
                statusOpts = [
                    `Mantienes un ritmo sólido y te ubicas como <strong>${gamifiedRank}</strong>. Con un <strong>${logisticResult.probability}% de probabilidad de aprobación</strong>, tienes buenas bases, pero aún hay detalles técnicos que debemos afinar.`,
                    `Vas por buen camino. Tu clasificación de <strong>${gamifiedRank}</strong> y tu probabilidad del <strong>${logisticResult.probability}%</strong> muestran que estamos cerca de la meta, aunque no podemos confiarnos.`,
                    `Tu progreso es constante. Eres un <strong>${gamifiedRank}</strong> con un <strong>${logisticResult.probability}% de opciones de pasar</strong>. Sigamos puliendo tus conocimientos para asegurar ese resultado.`
                ];
            } else {
                statusOpts = [
                    `Actualmente te encuentras en la categoría de <strong>${gamifiedRank}</strong>. Las matemáticas de mi motor predicen un <strong>${logisticResult.probability}% de probabilidad</strong> de éxito. ¡Pero no te preocupes! Tenemos tiempo para revertir estos números atacando las áreas clave.`,
                    `Estás catalogado como <strong>${gamifiedRank}</strong>. Con un <strong>${logisticResult.probability}% de estimación de éxito</strong>, mi diagnóstico es que necesitamos intensificar tu entrenamiento de inmediato para subir ese número.`,
                    `Tu nivel actual es <strong>${gamifiedRank}</strong>. La proyección del <strong>${logisticResult.probability}% de probabilidad</strong> nos indica que estamos en zona de riesgo. Necesitamos cambiar tu estrategia de estudio desde hoy.`
                ];
            }

            reportText += `<p style="margin-bottom: 1rem;">${pickRandom(greetingOpts)} ${pickRandom(statusOpts)}</p>`;

            let projOpts = [
                `Si presentaras el examen nacional hoy, mi modelo proyecta que obtendrías aproximadamente <strong>${projectedSaberPro} puntos sobre 300</strong>. `,
                `De mantenerse esta tendencia, tu resultado final estimado rondaría los <strong>${projectedSaberPro} puntos sobre 300</strong>. `,
                `Mi red neuronal proyecta que tu nota en el ICFES sería de unos <strong>${projectedSaberPro}/300</strong> bajo tus condiciones actuales. `
            ];
            
            let projectionSentence = pickRandom(projOpts);
            if (bestType && weakestTypeData && bestType.type !== weakestTypeData.type) {
                const mapOpts = [
                    `Veamos tus habilidades: Tu mayor talento es <strong>${bestType.name}</strong> (top ${bestType.percentile}% de la clase). Sin embargo, la barrera que frena tu puntaje global es <strong>${weakestTypeData.name}</strong>.`,
                    `Al desglosar tu radar: Eres muy fuerte en <strong>${bestType.name}</strong>, superando al ${100 - bestType.percentile}% de estudiantes. Tu talón de Aquiles, y donde debes enfocarte, es <strong>${weakestTypeData.name}</strong>.`,
                    `Analizando tus competencias: Destacas notablemente en <strong>${bestType.name}</strong>. No obstante, para subir de nivel globalmente debes superar tu deficiencia en <strong>${weakestTypeData.name}</strong>.`
                ];
                projectionSentence += pickRandom(mapOpts);
            }
            reportText += `<p style="margin-bottom: 1rem;">${projectionSentence}</p>`;

            if (logisticResult.riskFactors && logisticResult.riskFactors.length > 0) {
                const riskIntros = [
                    `Mi radar ha detectado patrones en tu comportamiento que podrían frenar tu avance:`,
                    `He encontrado algunos factores de riesgo en tus hábitos que debes corregir de inmediato:`,
                    `Presta mucha atención a estas alertas que mi algoritmo detectó en tu forma de jugar:`
                ];
                reportText += `<p style="margin-bottom: 0.5rem;">${pickRandom(riskIntros)}</p><ul style="margin-bottom: 1rem; padding-left: 1.5rem;">`;
                logisticResult.riskFactors.forEach(rf => {
                    reportText += `<li style="margin-bottom: 0.25rem;">⚠️ <strong>${rf.factor}:</strong> Intenta ajustar esto para que tu cerebro asimile mejor la información.</li>`;
                });
                reportText += `</ul>`;
            } else {
                const habitOpts = [
                    `🌟 <strong>Hábitos de Estudio:</strong> ¡Estás demostrando unos hábitos de estudio de primer nivel! Tu constancia está creando conexiones neuronales muy fuertes en el idioma.`,
                    `🌟 <strong>Disciplina de Acero:</strong> Tu tiempo de respuesta y tus pocos reintentos me dicen que estás estudiando con mucha concentración. ¡Sigue así!`,
                    `🌟 <strong>Estrategia de Aprendizaje:</strong> Tus métricas de interacción son excelentes. Juegas a un ritmo ideal para que la memoria a largo plazo haga su trabajo.`
                ];
                reportText += `<p style="margin-bottom: 1rem;">${pickRandom(habitOpts)}</p>`;
            }

            const finalAdvices = [
                `<strong>Mi plan táctico:</strong> Te propongo un reto: dedica tus próximos 15 minutos exclusivamente a ejercicios de <strong>${weakestTypeData ? weakestTypeData.name : 'tu módulo actual'}</strong>. ¡Nos vemos en la cima!`,
                `<strong>Siguiente paso recomendado:</strong> Abre el mapa interactivo y busca específicamente el próximo desafío de <strong>${weakestTypeData ? weakestTypeData.name : 'inglés'}</strong>. ¡Es el camino más rápido para subir de nivel!`,
                `<strong>Misión de hoy:</strong> Sigue sumando experiencia. ¡Recuerda que cada racha ganada son puntos reales para el día del examen! Enfócate en <strong>${weakestTypeData ? weakestTypeData.name : 'tus actividades pendientes'}</strong>.`
            ];
            reportText += `<p style="margin-bottom: 0;">${pickRandom(finalAdvices)}</p>`;
        }

        return {
            reportText,
            radarData,
            projectedScore: projectedSaberPro,
            probability: logisticResult.probability,
            logisticResult,
            linearResult,
            gamifiedRank,
            clusterInfo: thisStudentCluster,
            percentiles,
            strengths: bestType ? [bestType.type] : [],
            weaknesses: weakestTypeData ? [weakestTypeData.type] : []
        };
    }
}

module.exports = AIAssistantService;
