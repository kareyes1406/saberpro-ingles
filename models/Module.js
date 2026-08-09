/**
 * models/Module.js
 * Modelo de Módulos — Inglés Saber Pro
 */

const { executeQuery, sql } = require('../config/database');

class Module {
    /**
     * Obtiene todos los módulos activos
     */
    static async getAllActive() {
        const query = `SELECT * FROM Modules WHERE IsActive = 1`;
        const result = await executeQuery(query);
        return result.recordset;
    }

    /**
     * Obtiene un módulo por ID
     * @param {number} moduleId
     */
    static async getById(moduleId) {
        const query = `SELECT * FROM Modules WHERE ModuleID = @ModuleID`;
        const params = [{ name: 'ModuleID', type: sql.Int, value: moduleId }];
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    /**
     * Obtiene las semanas de un módulo
     * @param {number} moduleId
     */
    static async getWeeks(moduleId) {
        const query = `SELECT * FROM ModuleWeeks WHERE ModuleID = @ModuleID ORDER BY WeekNumber ASC`;
        const params = [{ name: 'ModuleID', type: sql.Int, value: moduleId }];
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    /**
     * Obtiene las actividades de una semana
     * @param {number} weekId
     */
    static async getWeekActivities(weekId) {
        const query = `
            SELECT A.*, AT.TypeName, AT.GameMechanic 
            FROM Activities A
            INNER JOIN ActivityTypes AT ON A.ActivityTypeID = AT.ActivityTypeID
            WHERE A.WeekID = @WeekID AND A.IsActive = 1
            ORDER BY A.SortOrder ASC
        `;
        const params = [{ name: 'WeekID', type: sql.Int, value: weekId }];
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    /**
     * Obtiene una actividad específica
     * @param {number} activityId
     */
    static async getActivity(activityId) {
        const query = `SELECT * FROM Activities WHERE ActivityID = @ActivityID`;
        const params = [{ name: 'ActivityID', type: sql.Int, value: activityId }];
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    /**
     * Obtiene las preguntas de una actividad
     * @param {number} activityId
     */
    static async getQuestions(activityId) {
        const query = `
            SELECT Q.*, QO.OptionID, QO.OptionText, QO.IsCorrect, QO.SortOrder as OptionSortOrder
            FROM Questions Q
            LEFT JOIN QuestionOptions QO ON Q.QuestionID = QO.QuestionID
            WHERE Q.ActivityID = @ActivityID
            ORDER BY Q.SortOrder ASC, QO.SortOrder ASC
        `;
        const params = [{ name: 'ActivityID', type: sql.Int, value: activityId }];
        const result = await executeQuery(query, params);
        
        const questionsMap = new Map();
        result.recordset.forEach(row => {
            if (!questionsMap.has(row.QuestionID)) {
                questionsMap.set(row.QuestionID, {
                    QuestionID: row.QuestionID,
                    ActivityID: row.ActivityID,
                    QuestionText: row.QuestionText,
                    QuestionType: row.QuestionType,
                    MediaUrl: row.MediaUrl,
                    SortOrder: row.SortOrder,
                    Options: []
                });
            }
            if (row.OptionID) {
                questionsMap.get(row.QuestionID).Options.push({
                    OptionID: row.OptionID,
                    OptionText: row.OptionText,
                    IsCorrect: row.IsCorrect,
                    SortOrder: row.OptionSortOrder
                });
            }
        });
        
        return Array.from(questionsMap.values());
    }
}

module.exports = Module;
