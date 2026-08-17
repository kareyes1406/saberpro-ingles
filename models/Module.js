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
     * Obtiene las preguntas de una actividad (método original)
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
        return Module._groupQuestions(result.recordset);
    }

    /**
     * Obtiene preguntas ALEATORIAS de un tipo específico, excluyendo las ya respondidas.
     * Esto permite que cada estudiante reciba preguntas distintas sin repetición.
     * @param {string} questionType - Tipo de pregunta (e.g. 'part1_notice', 'part3_dialogue')
     * @param {number} limit - Cuántas preguntas seleccionar
     * @param {number} userId - ID del usuario (para excluir preguntas ya respondidas)
     * @param {number} activityId - ID de la actividad actual
     */
    static async getRandomQuestionsByType(questionType, limit, userId, activityId) {
        // Seleccionar preguntas aleatorias del pool
        const query = `
            SELECT Q.*, QO.OptionID, QO.OptionText, QO.IsCorrect, QO.SortOrder as OptionSortOrder
            FROM (
                SELECT TOP(@Limit) * 
                FROM Questions 
                WHERE QuestionType = @QuestionType
                ORDER BY NEWID()
            ) Q
            LEFT JOIN QuestionOptions QO ON Q.QuestionID = QO.QuestionID
            ORDER BY Q.QuestionID, QO.SortOrder
        `;
        const params = [
            { name: 'QuestionType', type: sql.NVarChar, value: questionType },
            { name: 'Limit', type: sql.Int, value: limit }
        ];
        const result = await executeQuery(query, params);
        return Module._groupQuestions(result.recordset);
    }

    /**
     * Obtiene preguntas aleatorias del pool de un tipo, ASOCIADAS a cualquier actividad de ese tipo.
     * Para Boss Battle y otros que mezclan preguntas de múltiples pools.
     * @param {string[]} questionTypes - Array de tipos de pregunta
     * @param {number} limit - Cuántas preguntas seleccionar
     */
    static async getRandomQuestionsFromPools(questionTypes, limit) {
        const typeList = questionTypes.map((_, i) => `@Type${i}`).join(',');
        const query = `
            SELECT Q.*, QO.OptionID, QO.OptionText, QO.IsCorrect, QO.SortOrder as OptionSortOrder
            FROM (
                SELECT TOP(@Limit) * 
                FROM Questions 
                WHERE QuestionType IN (${typeList})
                ORDER BY NEWID()
            ) Q
            LEFT JOIN QuestionOptions QO ON Q.QuestionID = QO.QuestionID
            ORDER BY Q.QuestionID, QO.SortOrder
        `;
        const params = questionTypes.map((t, i) => ({
            name: `Type${i}`, type: sql.NVarChar, value: t
        }));
        params.push({ name: 'Limit', type: sql.Int, value: limit });
        
        const result = await executeQuery(query, params);
        return Module._groupQuestions(result.recordset);
    }

    /**
     * Obtiene preguntas de lectura con su pasaje asociado
     * @param {string} questionType - Tipo de pregunta (e.g. 'part5_reading')
     * @param {number} userId - ID del usuario
     */
    static async getReadingQuestions(questionType, userId) {
        const query = `
            SELECT Q.*, QO.OptionID, QO.OptionText, QO.IsCorrect, QO.SortOrder as OptionSortOrder
            FROM Questions Q
            LEFT JOIN QuestionOptions QO ON Q.QuestionID = QO.QuestionID
            WHERE Q.QuestionType = @QuestionType
            ORDER BY Q.SortOrder ASC, QO.SortOrder ASC
        `;
        const params = [
            { name: 'QuestionType', type: sql.NVarChar, value: questionType }
        ];
        const result = await executeQuery(query, params);
        return Module._groupQuestions(result.recordset);
    }

    /**
     * Obtiene UN texto aleatorio completo con TODAS sus preguntas asociadas.
     * Ideal para Cloze test y Comprensión de Lectura donde las preguntas pertenecen al mismo texto.
     */
    static async getRandomTextWithQuestions(questionType) {
        // 1. Obtener un pasaje aleatorio
        const textQuery = `
            SELECT TOP 1 MediaUrl, ReadingPassage
            FROM Questions
            WHERE QuestionType = @QuestionType
            ORDER BY NEWID()
        `;
        const textResult = await executeQuery(textQuery, [{ name: 'QuestionType', type: sql.NVarChar, value: questionType }]);
        if (!textResult.recordset.length) return null;

        const { MediaUrl, ReadingPassage } = textResult.recordset[0];

        // 2. Obtener todas las preguntas de ese pasaje
        const query = `
            SELECT Q.*, QO.OptionID, QO.OptionText, QO.IsCorrect, QO.SortOrder as OptionSortOrder
            FROM Questions Q
            LEFT JOIN QuestionOptions QO ON Q.QuestionID = QO.QuestionID
            WHERE Q.QuestionType = @QuestionType AND Q.MediaUrl = @MediaUrl
            ORDER BY Q.SortOrder ASC, QO.SortOrder ASC
        `;
        const params = [
            { name: 'QuestionType', type: sql.NVarChar, value: questionType },
            { name: 'MediaUrl', type: sql.NVarChar, value: MediaUrl }
        ];
        const result = await executeQuery(query, params);
        const questions = Module._groupQuestions(result.recordset);
        return { passage: ReadingPassage, title: MediaUrl, questions };
    }

    /**
     * Agrupa las filas planas de la consulta en objetos de pregunta con arrays de opciones.
     * @param {Array} recordset - Filas de la BD con datos de pregunta + opción por fila
     * @returns {Array} Preguntas agrupadas con sus opciones
     * @private
     */
    static _groupQuestions(recordset) {
        const questionsMap = new Map();
        recordset.forEach(row => {
            if (!questionsMap.has(row.QuestionID)) {
                questionsMap.set(row.QuestionID, {
                    QuestionID: row.QuestionID,
                    ActivityID: row.ActivityID,
                    QuestionText: row.QuestionText,
                    QuestionType: row.QuestionType,
                    MediaUrl: row.MediaUrl,
                    Explanation: row.Explanation || null,
                    ReadingPassage: row.ReadingPassage || null,
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
