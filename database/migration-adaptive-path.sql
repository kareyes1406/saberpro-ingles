-- Migración: Soporte para Ruta Adaptativa por Nivel MCER
-- Agrega columna EnglishLevel a Users si no existe
-- Crea tabla AdaptiveLearningPaths
-- Pobla DifficultyLevel en Questions basado en QuestionType

-- 1. Agrega columna EnglishLevel a Users si no existe
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'EnglishLevel')
BEGIN
    ALTER TABLE [dbo].[Users] ADD [EnglishLevel] NVARCHAR(5) NULL;
END
GO

-- 2. Crea tabla AdaptiveLearningPaths
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AdaptiveLearningPaths]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AdaptiveLearningPaths] (
        [PathID] INT IDENTITY(1,1) PRIMARY KEY,
        [UserID] INT NOT NULL,
        [Level] NVARCHAR(5) NOT NULL,
        [WeekNumber] INT NOT NULL,
        [PrimaryTypes] NVARCHAR(MAX) NOT NULL,
        [SecondaryTypes] NVARCHAR(MAX) NOT NULL,
        [SecondaryRatio] DECIMAL(3,2) NOT NULL,
        [CreatedAt] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_AdaptiveLearningPaths_Users FOREIGN KEY (UserID) REFERENCES [dbo].[Users](UserID)
    );
END
GO

-- 3. Pobla DifficultyLevel en Questions basado en QuestionType (opcional si la columna ya existe)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Questions]') AND name = 'DifficultyLevel')
BEGIN
    ALTER TABLE [dbo].[Questions] ADD [DifficultyLevel] NVARCHAR(5) NULL;
END
GO

UPDATE [dbo].[Questions]
SET [DifficultyLevel] = CASE 
    WHEN [QuestionType] IN ('part1_notice', 'part2_matching') THEN 'A1'
    WHEN [QuestionType] IN ('part3_dialogue', 'part4_cloze') THEN 'A2'
    WHEN [QuestionType] IN ('part5_reading') THEN 'B1'
    WHEN [QuestionType] IN ('part6_critical') THEN 'B2'
    WHEN [QuestionType] IN ('part7_cloze_advanced') THEN 'C1'
    ELSE 'A1'
END
WHERE [DifficultyLevel] IS NULL;
GO
