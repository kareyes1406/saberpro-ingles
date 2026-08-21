/**
 * models/User.js
 * Modelo de Usuario — Capa de Acceso a Datos
 * Métodos CRUD para la tabla Users
 */

const { executeQuery, sql } = require('../config/database');

class User {
    /**
     * Encuentra un usuario por su email
     * @param {string} email
     */
    static async findByEmail(email) {
        const query = `SELECT * FROM Users WHERE Email = @Email`;
        const params = [{ name: 'Email', type: sql.NVarChar, value: email }];
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    /**
     * Encuentra un usuario por su ID
     * @param {number} id
     */
    static async findById(id) {
        const query = `SELECT * FROM Users WHERE UserID = @UserID`;
        const params = [{ name: 'UserID', type: sql.Int, value: id }];
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    /**
     * Crea un nuevo usuario
     * @param {Object} userData
     */
    static async create(userData) {
        const isActive = userData.IsActive !== undefined ? userData.IsActive : 1;
        const query = `
            INSERT INTO Users (FirstName, LastName, Email, PasswordHash, RoleID, IsActive, CreatedAt, UpdatedAt)
            OUTPUT INSERTED.UserID
            VALUES (@FirstName, @LastName, @Email, @PasswordHash, @RoleID, @IsActive, GETDATE(), GETDATE())
        `;
        const params = [
            { name: 'FirstName', type: sql.NVarChar, value: userData.FirstName },
            { name: 'LastName', type: sql.NVarChar, value: userData.LastName },
            { name: 'Email', type: sql.NVarChar, value: userData.Email },
            { name: 'PasswordHash', type: sql.NVarChar, value: userData.PasswordHash },
            { name: 'RoleID', type: sql.Int, value: userData.RoleID },
            { name: 'IsActive', type: sql.Bit, value: isActive }
        ];
        const result = await executeQuery(query, params);
        return result.recordset[0];
    }

    /**
     * Guarda el PIN de verificación para un usuario
     */
    static async saveVerificationPin(userId, pin) {
        const query = `
            UPDATE Users 
            SET VerificationPin = @Pin, PinExpiry = DATEADD(minute, 15, GETDATE()) 
            WHERE UserID = @UserID
        `;
        const params = [
            { name: 'Pin', type: sql.VarChar, value: pin },
            { name: 'UserID', type: sql.Int, value: userId }
        ];
        await executeQuery(query, params);
    }

    /**
     * Activa a un usuario verificado y limpia su PIN
     */
    static async activateUser(userId) {
        const query = `
            UPDATE Users 
            SET IsActive = 1, VerificationPin = NULL, PinExpiry = NULL 
            WHERE UserID = @UserID
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        await executeQuery(query, params);
    }

    /**
     * Actualiza la fecha de último inicio de sesión
     * @param {number} id
     */
    static async updateLastLogin(id) {
        const query = `UPDATE Users SET LastLoginAt = GETDATE() WHERE UserID = @UserID`;
        const params = [{ name: 'UserID', type: sql.Int, value: id }];
        await executeQuery(query, params);
    }

    /**
     * Obtiene todos los estudiantes
     */
    static async getAllStudents() {
        const query = `
            SELECT U.* FROM Users U
            INNER JOIN Roles R ON U.RoleID = R.RoleID
            WHERE R.RoleName = 'student'
        `;
        const result = await executeQuery(query);
        return result.recordset;
    }

    /**
     * Actualiza la información del usuario
     * @param {number} id
     * @param {Object} data
     */
    static async updateUser(id, data) {
        const query = `
            UPDATE Users 
            SET FirstName = @FirstName, LastName = @LastName, Email = @Email, IsActive = @IsActive, UpdatedAt = GETDATE()
            WHERE UserID = @UserID
        `;
        const params = [
            { name: 'FirstName', type: sql.NVarChar, value: data.FirstName || data.firstName },
            { name: 'LastName', type: sql.NVarChar, value: data.LastName || data.lastName },
            { name: 'Email', type: sql.NVarChar, value: data.Email || data.email },
            { name: 'IsActive', type: sql.Bit, value: data.IsActive !== undefined ? data.IsActive : (data.isActive === '1' || data.isActive === 1 || data.isActive === true) },
            { name: 'UserID', type: sql.Int, value: id }
        ];
        await executeQuery(query, params);
    }

    /**
     * Elimina físicamente un usuario y todos sus registros asociados
     * @param {number} id
     */
    static async hardDeleteUser(id) {
        const params = [{ name: 'UserID', type: sql.Int, value: id }];
        await executeQuery(`DELETE FROM UserProgress WHERE UserID = @UserID`, params);
        await executeQuery(`DELETE FROM UserGamification WHERE UserID = @UserID`, params);
        await executeQuery(`DELETE FROM UserBadges WHERE UserID = @UserID`, params);
        await executeQuery(`DELETE FROM EvaluationResults WHERE UserID = @UserID`, params);
        await executeQuery(`DELETE FROM AuditLogs WHERE UserID = @UserID`, params);
        await executeQuery(`DELETE FROM Users WHERE UserID = @UserID`, params);
    }

    /**
     * Cuenta los usuarios activos
     */
    static async getActiveCount() {
        const query = `SELECT COUNT(*) as Count FROM Users WHERE IsActive = 1`;
        const result = await executeQuery(query);
        return result.recordset[0].Count;
    }
}

module.exports = User;
