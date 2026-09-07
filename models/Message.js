const { executeQuery, sql } = require('../config/database');

class Message {
    static async sendMessage(senderId, receiverId, subject, text, parentId = null) {
        const query = `
            INSERT INTO Messages (SenderID, ReceiverID, Subject, MessageText, ParentMessageID)
            VALUES (@SenderID, @ReceiverID, @Subject, @MessageText, @ParentMessageID)
        `;
        const params = [
            { name: 'SenderID', type: sql.Int, value: senderId },
            { name: 'ReceiverID', type: sql.Int, value: receiverId },
            { name: 'Subject', type: sql.NVarChar, value: subject },
            { name: 'MessageText', type: sql.NVarChar, value: text },
            { name: 'ParentMessageID', type: sql.Int, value: parentId }
        ];
        await executeQuery(query, params);
        return true;
    }

    static async getUserMessages(userId) {
        const query = `
            SELECT m.*, 
                   s.FirstName + ' ' + s.LastName AS SenderName,
                   r.FirstName + ' ' + r.LastName AS ReceiverName
            FROM Messages m
            LEFT JOIN Users s ON m.SenderID = s.UserID
            LEFT JOIN Users r ON m.ReceiverID = r.UserID
            WHERE m.SenderID = @UserID OR m.ReceiverID = @UserID
            ORDER BY m.CreatedAt DESC
        `;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset || [];
    }

    static async getAdminInbox() {
        const query = `
            SELECT m.*, 
                   s.FirstName + ' ' + s.LastName AS SenderName,
                   s.Email AS SenderEmail
            FROM Messages m
            LEFT JOIN Users s ON m.SenderID = s.UserID
            LEFT JOIN Users r ON m.ReceiverID = r.UserID
            LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
            WHERE m.ReceiverID IS NULL OR ro.RoleName = 'admin'
            ORDER BY m.CreatedAt DESC
        `;
        const result = await executeQuery(query);
        return result.recordset || [];
    }

    static async getAdminRecentMessages(limit = 5) {
        const query = `
            SELECT TOP (@Limit) m.*, 
                   s.FirstName + ' ' + s.LastName AS SenderName,
                   s.Email AS SenderEmail
            FROM Messages m
            LEFT JOIN Users s ON m.SenderID = s.UserID
            LEFT JOIN Users r ON m.ReceiverID = r.UserID
            LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
            WHERE m.ReceiverID IS NULL OR ro.RoleName = 'admin'
            ORDER BY m.CreatedAt DESC
        `;
        const params = [{ name: 'Limit', type: sql.Int, value: limit }];
        const result = await executeQuery(query, params);
        return result.recordset || [];
    }

    static async markAsRead(messageId) {
        const query = `UPDATE Messages SET IsRead = 1 WHERE MessageID = @MessageID`;
        const params = [{ name: 'MessageID', type: sql.Int, value: messageId }];
        await executeQuery(query, params);
        return true;
    }

    static async getThread(parentMessageId) {
        const query = `
            SELECT m.*, 
                   s.FirstName + ' ' + s.LastName AS SenderName
            FROM Messages m
            LEFT JOIN Users s ON m.SenderID = s.UserID
            WHERE m.ParentMessageID = @ParentID OR m.MessageID = @ParentID
            ORDER BY m.CreatedAt ASC
        `;
        const params = [{ name: 'ParentID', type: sql.Int, value: parentMessageId }];
        const result = await executeQuery(query, params);
        return result.recordset || [];
    }

    static async getUnreadCount(userId) {
        const query = `SELECT COUNT(*) as UnreadCount FROM Messages WHERE ReceiverID = @UserID AND IsRead = 0`;
        const params = [{ name: 'UserID', type: sql.Int, value: userId }];
        const result = await executeQuery(query, params);
        return result.recordset[0] ? result.recordset[0].UnreadCount : 0;
    }

    static async getAdminUnreadCount() {
        const query = `
            SELECT COUNT(*) as UnreadCount 
            FROM Messages m
            LEFT JOIN Users r ON m.ReceiverID = r.UserID
            LEFT JOIN Roles ro ON r.RoleID = ro.RoleID
            WHERE (m.ReceiverID IS NULL OR ro.RoleName = 'admin') AND m.IsRead = 0
        `;
        const result = await executeQuery(query);
        return result.recordset[0] ? result.recordset[0].UnreadCount : 0;
    }
}

module.exports = Message;
