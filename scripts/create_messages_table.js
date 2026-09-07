require('dotenv').config();
const { executeQuery } = require('../config/database');

async function createMessagesTable() {
    try {
        const query = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Messages' AND xtype='U')
            BEGIN
                CREATE TABLE Messages (
                    MessageID INT IDENTITY(1,1) PRIMARY KEY,
                    SenderID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
                    ReceiverID INT NULL FOREIGN KEY REFERENCES Users(UserID),
                    Subject NVARCHAR(200),
                    MessageText NVARCHAR(MAX) NOT NULL,
                    IsRead BIT DEFAULT 0,
                    ParentMessageID INT NULL FOREIGN KEY REFERENCES Messages(MessageID),
                    CreatedAt DATETIME DEFAULT GETDATE()
                );

                CREATE INDEX IX_Messages_SenderID ON Messages(SenderID);
                CREATE INDEX IX_Messages_ReceiverID ON Messages(ReceiverID);
            END
        `;
        await executeQuery(query);
        console.log('Messages table created successfully.');
    } catch (error) {
        console.error('Error creating messages table:', error);
    }
}

createMessagesTable();
