const Progress = require('../models/Progress');
const Gamification = require('../models/Gamification');
const Evaluation = require('../models/Evaluation');
const { executeQuery, sql } = require('../config/database');

class AIAssistantService {
    /**
     * Generates a personalized diagnostic report for the student.
     * @param {number} userId 
     * @returns {Object} { reportText, radarData, strengths, weaknesses }
     */
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
        const radarData = []; // Order: Vocab, Reading, Pragmatics, Grammar
        
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
                // Fallback to pre-test scores if no modules completed yet
                let preScore = 0;
                if (type === 'Vocabulary') preScore = preTest.VocabularyScore;
                if (type === 'Reading') preScore = preTest.ReadingScore;
                if (type === 'Pragmatics') preScore = preTest.PragmaticsScore;
                if (type === 'Grammar') preScore = preTest.GrammarScore;
                
                currentAverages[type] = { score: preScore, attempts: 1, time: 0 };
                radarData.push(Math.round(preScore));
            }
        });

        // 5. Calculate Projected Saber Pro Score
        // Base score is out of 300. Pre-test gives a baseline.
        const averageCurrentScore = (radarData[0] + radarData[1] + radarData[2] + radarData[3]) / 4;
        const projectedSaberPro = Math.round((averageCurrentScore / 100) * 300);

        // 6. Identify Strengths and Weaknesses
        const strengths = [];
        const weaknesses = [];
        let rushingDetected = false;

        Object.entries(currentAverages).forEach(([type, metrics]) => {
            if (metrics.score >= 80) strengths.push(type);
            else if (metrics.score < 60) weaknesses.push(type);

            if (metrics.attempts > 2) weaknesses.push(`${type}_Retries`);
            if (metrics.time > 0 && metrics.time < 15 && type === 'Reading') rushingDetected = true;
        });

        // 7. Generate Personalized Report (Heuristic AI Logic)
        let reportText = `¡Hola! Soy tu asistente de aprendizaje. Según mi análisis, tienes un puntaje proyectado de **${projectedSaberPro} / 300** en la prueba Saber Pro. `;

        if (progress.length === 0) {
            reportText += "He revisado tu prueba diagnóstica y he configurado tu perfil. ¡Empieza a completar módulos para que pueda rastrear tu evolución!";
        } else {
            if (strengths.length > 0) {
                const s = strengths.map(t => t === 'Reading' ? 'Comprensión Lectora' : t === 'Vocabulary' ? 'Vocabulario' : t === 'Pragmatics' ? 'Pragmática' : 'Gramática').join(' y ');
                reportText += `He notado que eres muy fuerte en **${s}**, ¡sigue así! `;
            }

            if (weaknesses.length > 0) {
                if (weaknesses.includes('Reading')) reportText += "Sin embargo, tu comprensión lectora necesita refuerzo. Intenta leer el texto completo antes de mirar las preguntas. ";
                if (weaknesses.includes('Grammar')) reportText += "La gramática te está costando un poco. Repasa los tiempos verbales y las preposiciones. ";
                if (weaknesses.includes('Vocabulary')) reportText += "Te sugiero practicar más vocabulario. Juega más rondas de emparejamiento. ";
                
                if (weaknesses.some(w => w.includes('_Retries'))) {
                    reportText += "He detectado que estás repitiendo algunos módulos varias veces antes de pasarlos. Tómate tu tiempo, no te apresures a enviar las respuestas. ";
                }
            } else if (strengths.length > 0) {
                reportText += "No he detectado debilidades graves. Tienes un perfil muy equilibrado.";
            }

            if (rushingDetected) {
                reportText += "\n\n⚠️ **Alerta de Adivinanza:** Mis sensores indican que estás respondiendo los textos de lectura demasiado rápido (en menos de 15 segundos). Recuerda que en la prueba real el tiempo es tu aliado, ¡no respondas al azar!";
            }
        }

        return {
            reportText,
            radarData,
            projectedScore: projectedSaberPro,
            strengths,
            weaknesses
        };
    }
}

module.exports = AIAssistantService;
