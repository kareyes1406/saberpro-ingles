/**
 * models/Evaluation.js
 * Modelo de Evaluaciones — Boss Battles y Cortes
 */

const { executeQuery, sql } = require('../config/database');

class Evaluation {
    /**
     * Guarda el resultado de una evaluación (Boss Battle)
     * @param {Object} resultData
     */
    static async saveResult(resultData) {
        const query = `
            INSERT INTO EvaluationResults (UserID, ActivityID, TotalScore, TotalQuestions, CorrectAnswers, BossHPDealt, StudentHPLost, Passed, CompletedAt)
            VALUES (@UserID, @ActivityID, @TotalScore, @TotalQuestions, @CorrectAnswers, @BossHPDealt, @StudentHPLost, @Passed, GETDATE())
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: resultData.userId },
            { name: 'ActivityID', type: sql.Int, value: resultData.activityId },
            { name: 'TotalScore', type: sql.Decimal, value: resultData.totalScore },
            { name: 'TotalQuestions', type: sql.Int, value: resultData.totalQuestions },
            { name: 'CorrectAnswers', type: sql.Int, value: resultData.correctAnswers },
            { name: 'BossHPDealt', type: sql.Int, value: resultData.bossHpDealt },
            { name: 'StudentHPLost', type: sql.Int, value: resultData.studentHpLost },
            { name: 'Passed', type: sql.Bit, value: resultData.passed }
        ];
        await executeQuery(query, params);
    }

    /**
     * Obtiene los resultados de un estudiante
     * @param {number} userId
     */
    static async getStudentResults(userId) {
        const query = `
            SELECT ER.*, A.Title
            FROM EvaluationResults ER
            INNER JOIN Activities A ON ER.ActivityID = A.ActivityID
            WHERE ER.UserID = @UserID
            ORDER BY ER.CompletedAt DESC
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    /**
     * Obtiene los resultados de una semana Boss Battle
     * @param {number} weekId
     */
    static async getBossWeekResults(weekId) {
        const query = `
            SELECT ER.*, U.FirstName, U.LastName
            FROM EvaluationResults ER
            INNER JOIN Activities A ON ER.ActivityID = A.ActivityID
            INNER JOIN Users U ON ER.UserID = U.UserID
            WHERE A.WeekID = @WeekID
        `;
        const params = [{ name: 'WeekID', type: sql.Int, value: weekId }];
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    /**
     * Calcula KPIs de una evaluación para el dashboard
     * @param {number} moduleId
     * @param {number} weekId
     */
    static async calculateKPIs(moduleId, weekId) {
        const query = `
            SELECT 
                COUNT(*) as TotalAttempts,
                SUM(CASE WHEN ER.Passed = 1 THEN 1 ELSE 0 END) as TotalPassed,
                AVG(ER.TotalScore) as AvgScore
            FROM EvaluationResults ER
            INNER JOIN Activities A ON ER.ActivityID = A.ActivityID
            INNER JOIN ModuleWeeks MW ON A.WeekID = MW.WeekID
            WHERE MW.ModuleID = @ModuleID AND (@WeekID IS NULL OR A.WeekID = @WeekID)
        `;
        const params = [
            { name: 'ModuleID', type: sql.Int, value: moduleId },
            { name: 'WeekID', type: sql.Int, value: weekId }
        ];
        const result = await executeQuery(query, params);
        return result.recordset[0];
    }

    /**
     * Obtiene el puntaje promedio de un módulo
     * @param {number} moduleId
     */
    static async getAverageScore(moduleId) {
        const query = `
            SELECT AVG(ER.TotalScore) as ModuleAvgScore
            FROM EvaluationResults ER
            INNER JOIN Activities A ON ER.ActivityID = A.ActivityID
            INNER JOIN ModuleWeeks MW ON A.WeekID = MW.WeekID
            WHERE MW.ModuleID = @ModuleID
        `;
        const params = [{ name: 'ModuleID', type: sql.Int, value: moduleId }];
        const result = await executeQuery(query, params);
        return result.recordset[0].ModuleAvgScore;
    }
}

module.exports = Evaluation;
