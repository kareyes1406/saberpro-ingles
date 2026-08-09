/**
 * models/Gamification.js
 * Modelo de Gamificación — XP, Streaks, Monedas, Medallas
 */

const { executeQuery, sql } = require('../config/database');

class Gamification {
    /**
     * Obtiene estadísticas del estudiante
     * @param {number} userId
     */
    static async getStudentStats(userId) {
        const query = `SELECT * FROM UserGamification WHERE UserID = @UserID`;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset[0];
    }

    /**
     * Añade experiencia y recalcula nivel
     * @param {number} userId
     * @param {number} xpAmount
     * @param {number} activityId
     */
    static async addXP(userId, xpAmount, activityId) {
        const query = `
            UPDATE UserGamification
            SET TotalXP = ISNULL(TotalXP, 0) + @XPAmount, UpdatedAt = GETDATE()
            WHERE UserID = @UserID;
            
            -- Lógica de subida de nivel
            UPDATE UserGamification
            SET Level = (ISNULL(TotalXP, 0) / 100) + 1
            WHERE UserID = @UserID;
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'XPAmount', type: sql.Int, value: xpAmount }
        ];
        await executeQuery(query, params);
    }

    /**
     * Actualiza racha mediante Stored Procedure
     * @param {number} userId
     */
    static async updateStreak(userId) {
        const query = `EXEC sp_UpdateUserStreak @UserID = @UserID`;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        await executeQuery(query, params);
    }

    /**
     * Añade monedas
     * @param {number} userId
     * @param {number} amount
     */
    static async addCoins(userId, amount) {
        const query = `
            UPDATE UserGamification 
            SET TotalCoins = ISNULL(TotalCoins, 0) + @Amount, UpdatedAt = GETDATE()
            WHERE UserID = @UserID
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'Amount', type: sql.Int, value: amount }
        ];
        await executeQuery(query, params);
    }

    /**
     * Obtiene las medallas del usuario
     * @param {number} userId
     */
    static async getUserBadges(userId) {
        const query = `
            SELECT B.*, UB.EarnedAt, UB.IsDisplayed
            FROM UserBadges UB
            INNER JOIN Badges B ON UB.BadgeID = B.BadgeID
            WHERE UB.UserID = @UserID
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    /**
     * Otorga una medalla a un usuario
     * @param {number} userId
     * @param {number} badgeId
     */
    static async awardBadge(userId, badgeId) {
        const query = `
            IF NOT EXISTS (SELECT 1 FROM UserBadges WHERE UserID = @UserID AND BadgeID = @BadgeID)
            BEGIN
                INSERT INTO UserBadges (UserID, BadgeID, EarnedAt)
                VALUES (@UserID, @BadgeID, GETDATE())
            END
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'BadgeID', type: sql.Int, value: badgeId }
        ];
        await executeQuery(query, params);
    }

    /**
     * Verifica y otorga medallas según el progreso del usuario
     * @param {number} userId
     */
    static async checkAndAwardBadges(userId) {
        const stats = await this.getStudentStats(userId);
        if (!stats) return;

        if (stats.CurrentStreak >= 3) {
            const query = `
                INSERT INTO UserBadges (UserID, BadgeID)
                SELECT @UserID, BadgeID FROM Badges WHERE BadgeName = 'Racha 3 Días'
                AND NOT EXISTS (
                    SELECT 1 FROM UserBadges WHERE UserID = @UserID AND BadgeID = Badges.BadgeID
                )
            `;
            await executeQuery(query, [{ name: 'UserID', type: sql.Int, value: userId }]);
        }
    }

    /**
     * Obtiene la tabla de líderes
     * @param {number} moduleId
     * @param {number} limit
     */
    static async getLeaderboard(moduleId, limit = 10) {
        const query = `
            SELECT TOP (@Limit) U.FirstName, U.LastName, UG.TotalXP, UG.Level
            FROM UserGamification UG
            INNER JOIN Users U ON UG.UserID = U.UserID
            ORDER BY UG.TotalXP DESC
        `;
        const params = [{ name: 'Limit', type: sql.Int, value: limit }];
        const result = await executeQuery(query, params);
        return result.recordset;
    }
}

module.exports = Gamification;
