/**
 * models/Progress.js  
 * Modelo de Progreso — Seguimiento de actividades del estudiante
 */

const { executeQuery, sql } = require('../config/database');

class Progress {
    /**
     * Obtiene el progreso de un estudiante en un módulo
     * @param {number} userId
     * @param {number} moduleId
     */
    static async getStudentProgress(userId, moduleId) {
        const query = `
            SELECT UP.*, A.Title, A.WeekID 
            FROM UserProgress UP
            INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
            INNER JOIN ModuleWeeks MW ON A.WeekID = MW.WeekID
            WHERE UP.UserID = @UserID AND MW.ModuleID = @ModuleID
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'ModuleID', type: sql.Int, value: moduleId }
        ];
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    /**
     * Obtiene el progreso de una semana específica
     * @param {number} userId
     * @param {number} weekId
     */
    static async getWeekProgress(userId, weekId) {
        const query = `
            SELECT UP.*, A.Title 
            FROM UserProgress UP
            INNER JOIN Activities A ON UP.ActivityID = A.ActivityID
            WHERE UP.UserID = @UserID AND A.WeekID = @WeekID
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'WeekID', type: sql.Int, value: weekId }
        ];
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    /**
     * Registra la finalización de una actividad
     * @param {Object} progressData
     */
    static async recordCompletion(progressData) {
        const query = `
            INSERT INTO UserProgress (UserID, ActivityID, IsCompleted, Score, TimeSpentSeconds, CompletedAt, AttemptNumber)
            VALUES (@UserID, @ActivityID, @IsCompleted, @Score, @TimeSpentSeconds, GETDATE(), @AttemptNumber)
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: progressData.userId },
            { name: 'ActivityID', type: sql.Int, value: progressData.activityId },
            { name: 'IsCompleted', type: sql.Bit, value: progressData.isCompleted },
            { name: 'Score', type: sql.Decimal, value: progressData.score },
            { name: 'TimeSpentSeconds', type: sql.Int, value: progressData.timeSpentSeconds },
            { name: 'AttemptNumber', type: sql.Int, value: progressData.attemptNumber }
        ];
        await executeQuery(query, params);
    }

    /**
     * Obtiene estadísticas de finalización
     * @param {number} userId
     */
    static async getCompletionStats(userId) {
        const query = `
            SELECT 
                COUNT(*) as TotalActivities,
                SUM(CASE WHEN IsCompleted = 1 THEN 1 ELSE 0 END) as CompletedActivities,
                AVG(Score) as AverageScore
            FROM UserProgress
            WHERE UserID = @UserID
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset[0];
    }

    /**
     * Obtiene intentos de una actividad
     * @param {number} userId
     * @param {number} activityId
     */
    static async getActivityAttempts(userId, activityId) {
        const query = `
            SELECT COUNT(*) as Attempts 
            FROM UserProgress 
            WHERE UserID = @UserID AND ActivityID = @ActivityID
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'ActivityID', type: sql.Int, value: activityId }
        ];
        const result = await executeQuery(query, params);
        return result.recordset[0].Attempts;
    }
}

module.exports = Progress;
