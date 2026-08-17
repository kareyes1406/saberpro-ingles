const { executeQuery, poolPromise } = require('../config/database');

async function updateDb() {
    try {
        console.log('Connecting to DB...');
        await poolPromise;
        console.log('Connected. Running schema update...');

        const query = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserExams' AND xtype='U')
        BEGIN
            CREATE TABLE UserExams (
                ExamID INT IDENTITY(1,1) PRIMARY KEY,
                UserID INT NOT NULL,
                ExamType NVARCHAR(10) CHECK (ExamType IN ('PRE', 'POST')),
                TotalScore DECIMAL(5,2),
                VocabularyScore DECIMAL(5,2),
                ReadingScore DECIMAL(5,2),
                PragmaticsScore DECIMAL(5,2),
                GrammarScore DECIMAL(5,2),
                TimeSpentSeconds INT,
                CompletedAt DATETIME DEFAULT GETDATE(),
                CONSTRAINT FK_UserExams_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
                CONSTRAINT UQ_UserExams_User_Type UNIQUE(UserID, ExamType)
            );
            CREATE NONCLUSTERED INDEX IX_UserExams_UserID ON UserExams(UserID);
            PRINT 'UserExams table created.';
        END
        ELSE
        BEGIN
            PRINT 'UserExams table already exists.';
        END
        `;

        await executeQuery(query);
        console.log('Schema update successful.');
        process.exit(0);
    } catch (err) {
        console.error('Schema update failed:', err);
        process.exit(1);
    }
}

updateDb();
