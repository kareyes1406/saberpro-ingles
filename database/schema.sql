-- database/schema.sql
-- Script de DDL para la plataforma Gamificada SaberPro
-- Este script crea las tablas en el orden correcto, incluyendo las relaciones y datos por defecto.

-- 1. Roles
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 2. Users
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    RoleID INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    LastLoginAt DATETIME,
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);
CREATE NONCLUSTERED INDEX IX_Users_Email ON Users(Email);
CREATE NONCLUSTERED INDEX IX_Users_CreatedAt ON Users(CreatedAt);

-- 3. Modules (escalable: Inglés, Razonamiento Cuantitativo, etc.)
CREATE TABLE Modules (
    ModuleID INT IDENTITY(1,1) PRIMARY KEY,
    ModuleName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    IconUrl NVARCHAR(255),
    ColorHex NVARCHAR(7),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 4. ModuleWeeks (12 weeks per module)
CREATE TABLE ModuleWeeks (
    WeekID INT IDENTITY(1,1) PRIMARY KEY,
    ModuleID INT NOT NULL,
    WeekNumber INT NOT NULL CHECK (WeekNumber BETWEEN 1 AND 12),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    IsEvaluationWeek BIT DEFAULT 0,
    IsBossWeek BIT DEFAULT 0, -- weeks 4,8,12
    UnlockXPRequired INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_ModuleWeeks_Modules FOREIGN KEY (ModuleID) REFERENCES Modules(ModuleID)
);
CREATE NONCLUSTERED INDEX IX_ModuleWeeks_ModuleID ON ModuleWeeks(ModuleID);

-- 5. ActivityTypes (Vocabulary, Reading, BossBattle, etc.)
CREATE TABLE ActivityTypes (
    ActivityTypeID INT IDENTITY(1,1) PRIMARY KEY,
    TypeName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    GameMechanic NVARCHAR(100)
);

-- 6. Activities (exercises within each week)
CREATE TABLE Activities (
    ActivityID INT IDENTITY(1,1) PRIMARY KEY,
    WeekID INT NOT NULL,
    ActivityTypeID INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    XPReward INT DEFAULT 10,
    CoinReward INT DEFAULT 5,
    DifficultyLevel INT DEFAULT 1,
    IsActive BIT DEFAULT 1,
    SortOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Activities_ModuleWeeks FOREIGN KEY (WeekID) REFERENCES ModuleWeeks(WeekID),
    CONSTRAINT FK_Activities_ActivityTypes FOREIGN KEY (ActivityTypeID) REFERENCES ActivityTypes(ActivityTypeID)
);
CREATE NONCLUSTERED INDEX IX_Activities_WeekID ON Activities(WeekID);

-- 7. Questions (not hardcoded - all content from DB)
CREATE TABLE Questions (
    QuestionID INT IDENTITY(1,1) PRIMARY KEY,
    ActivityID INT NOT NULL,
    QuestionText NVARCHAR(MAX) NOT NULL,
    QuestionType NVARCHAR(50) CHECK (QuestionType IN ('vocabulary_match','drag_drop','boss_multiple_choice','pragmatics_map','grammar_circuit')),
    MediaUrl NVARCHAR(255),
    SortOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Questions_Activities FOREIGN KEY (ActivityID) REFERENCES Activities(ActivityID)
);
CREATE NONCLUSTERED INDEX IX_Questions_ActivityID ON Questions(ActivityID);

-- 8. QuestionOptions
CREATE TABLE QuestionOptions (
    OptionID INT IDENTITY(1,1) PRIMARY KEY,
    QuestionID INT NOT NULL,
    OptionText NVARCHAR(MAX) NOT NULL,
    IsCorrect BIT NOT NULL,
    SortOrder INT DEFAULT 0,
    CONSTRAINT FK_QuestionOptions_Questions FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
);
CREATE NONCLUSTERED INDEX IX_QuestionOptions_QuestionID ON QuestionOptions(QuestionID);

-- 9. UserProgress (activity completions)
CREATE TABLE UserProgress (
    ProgressID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ActivityID INT NOT NULL,
    IsCompleted BIT DEFAULT 0,
    Score DECIMAL(5,2),
    TimeSpentSeconds INT,
    CompletedAt DATETIME,
    AttemptNumber INT DEFAULT 1,
    CONSTRAINT FK_UserProgress_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_UserProgress_Activities FOREIGN KEY (ActivityID) REFERENCES Activities(ActivityID)
);
CREATE NONCLUSTERED INDEX IX_UserProgress_UserID ON UserProgress(UserID);
CREATE NONCLUSTERED INDEX IX_UserProgress_ActivityID ON UserProgress(ActivityID);

-- 10. UserGamification
CREATE TABLE UserGamification (
    GamificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    TotalXP INT DEFAULT 0,
    Level INT DEFAULT 1,
    CurrentStreak INT DEFAULT 0,
    LongestStreak INT DEFAULT 0,
    LastActivityDate DATE,
    TotalCoins INT DEFAULT 0,
    CoinsSpent INT DEFAULT 0,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_UserGamification_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
CREATE NONCLUSTERED INDEX IX_UserGamification_UserID ON UserGamification(UserID);

-- 11. Badges
CREATE TABLE Badges (
    BadgeID INT IDENTITY(1,1) PRIMARY KEY,
    BadgeName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    IconUrl NVARCHAR(255),
    BadgeType NVARCHAR(50) CHECK (BadgeType IN ('milestone','streak','module','boss')),
    XPRequired INT DEFAULT 0,
    SpecialCondition NVARCHAR(500)
);

-- 12. UserBadges
CREATE TABLE UserBadges (
    UserBadgeID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    BadgeID INT NOT NULL,
    EarnedAt DATETIME DEFAULT GETDATE(),
    IsDisplayed BIT DEFAULT 1,
    CONSTRAINT FK_UserBadges_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_UserBadges_Badges FOREIGN KEY (BadgeID) REFERENCES Badges(BadgeID)
);
CREATE NONCLUSTERED INDEX IX_UserBadges_UserID ON UserBadges(UserID);

-- 13. EvaluationResults (Boss Battle results)
CREATE TABLE EvaluationResults (
    ResultID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ActivityID INT NOT NULL,
    TotalScore DECIMAL(5,2),
    TotalQuestions INT,
    CorrectAnswers INT,
    BossHPDealt INT,
    StudentHPLost INT,
    Passed BIT,
    CompletedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_EvaluationResults_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_EvaluationResults_Activities FOREIGN KEY (ActivityID) REFERENCES Activities(ActivityID)
);
CREATE NONCLUSTERED INDEX IX_EvaluationResults_UserID ON EvaluationResults(UserID);

-- 14. AuditLogs
CREATE TABLE AuditLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    TableName NVARCHAR(100) NOT NULL,
    Action NVARCHAR(10) CHECK (Action IN ('INSERT','UPDATE','DELETE')),
    RecordID INT,
    OldValues NVARCHAR(MAX),
    NewValues NVARCHAR(MAX),
    IPAddress NVARCHAR(50),
    UserAgent NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- 15. AdminKPISnapshots
CREATE TABLE AdminKPISnapshots (
    SnapshotID INT IDENTITY(1,1) PRIMARY KEY,
    ModuleID INT NOT NULL,
    WeekID INT NULL,
    SnapshotDate DATE,
    TotalActiveUsers INT,
    CompletionRate DECIMAL(5,2),
    AbandonRate DECIMAL(5,2),
    AvgTimePerEvaluation DECIMAL(8,2),
    AvgScorePerModule DECIMAL(5,2),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_AdminKPI_Modules FOREIGN KEY (ModuleID) REFERENCES Modules(ModuleID),
    CONSTRAINT FK_AdminKPI_ModuleWeeks FOREIGN KEY (WeekID) REFERENCES ModuleWeeks(WeekID)
);

-- Default Data Inserts

-- Roles
INSERT INTO Roles (RoleName, Description) VALUES ('student', 'Estudiante de la plataforma');
INSERT INTO Roles (RoleName, Description) VALUES ('admin', 'Administrador de la plataforma');

-- Modules
INSERT INTO Modules (ModuleName, Description, IconUrl, ColorHex) VALUES ('Inglés Saber Pro', 'Módulo de preparación para prueba de Inglés Saber Pro', '/icons/english.png', '#1A73E8');

-- Activity Types
INSERT INTO ActivityTypes (TypeName, Description, GameMechanic) VALUES ('Vocabulary', 'Actividades de vocabulario', 'vocabulary_match');
INSERT INTO ActivityTypes (TypeName, Description, GameMechanic) VALUES ('Reading', 'Comprensión de lectura', 'drag_drop');
INSERT INTO ActivityTypes (TypeName, Description, GameMechanic) VALUES ('BossBattle', 'Evaluación final', 'boss_multiple_choice');
INSERT INTO ActivityTypes (TypeName, Description, GameMechanic) VALUES ('Pragmatics', 'El Coordinador Urbano (Situacional)', 'pragmatics_map');
INSERT INTO ActivityTypes (TypeName, Description, GameMechanic) VALUES ('Grammar', 'Circuitos y Ensamblaje (Gramática)', 'grammar_circuit');

-- Badges (5 initial badges)
INSERT INTO Badges (BadgeName, Description, BadgeType, XPRequired) VALUES ('Primeros Pasos', 'Completar la primera actividad', 'milestone', 10);
INSERT INTO Badges (BadgeName, Description, BadgeType, XPRequired) VALUES ('Racha 3 Días', 'Ingresar 3 días consecutivos', 'streak', 50);
INSERT INTO Badges (BadgeName, Description, BadgeType, XPRequired) VALUES ('Racha 7 Días', 'Ingresar 7 días consecutivos', 'streak', 150);
INSERT INTO Badges (BadgeName, Description, BadgeType, XPRequired) VALUES ('Asesino de Jefes', 'Derrotar al primer jefe', 'boss', 100);
INSERT INTO Badges (BadgeName, Description, BadgeType, XPRequired) VALUES ('Lector Veloz', 'Completar lectura rápidamente', 'milestone', 80);

GO

-- Stored Procedure: sp_UpdateUserStreak
CREATE PROCEDURE sp_UpdateUserStreak
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @LastDate DATE;
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @CurrentStreak INT;
    DECLARE @LongestStreak INT;

    SELECT @LastDate = LastActivityDate, 
           @CurrentStreak = CurrentStreak, 
           @LongestStreak = LongestStreak
    FROM UserGamification
    WHERE UserID = @UserID;

    IF @LastDate IS NULL OR DATEDIFF(day, @LastDate, @Today) > 1
    BEGIN
        SET @CurrentStreak = 1;
    END
    ELSE IF DATEDIFF(day, @LastDate, @Today) = 1
    BEGIN
        SET @CurrentStreak = @CurrentStreak + 1;
        IF @CurrentStreak > @LongestStreak
            SET @LongestStreak = @CurrentStreak;
    END

    UPDATE UserGamification
    SET CurrentStreak = @CurrentStreak,
        LongestStreak = @LongestStreak,
        LastActivityDate = @Today,
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
END
GO

-- Stored Procedure: sp_GetStudentDashboardKPIs
CREATE PROCEDURE sp_GetStudentDashboardKPIs
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM Users WHERE IsActive = 1 AND RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'student')) AS TotalActiveStudents,
        (SELECT AVG(Score) FROM UserProgress WHERE IsCompleted = 1) AS AverageScore,
        (SELECT AVG(TotalScore) FROM EvaluationResults) AS AverageEvaluationScore,
        (SELECT SUM(TotalXP) FROM UserGamification) AS PlatformTotalXP
END
GO
