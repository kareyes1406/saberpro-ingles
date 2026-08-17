-- database/schema-update.sql
-- Script para agregar columnas necesarias para las 245 preguntas ICFES
-- Ejecutar DESPUÉS de schema.sql

-- 1. Agregar columna Explanation a Questions
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Questions') AND name = 'Explanation')
BEGIN
    ALTER TABLE Questions ADD Explanation NVARCHAR(MAX) NULL;
END
GO

-- 2. Agregar columna ReadingPassage a Questions (para textos de lectura/cloze)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Questions') AND name = 'ReadingPassage')
BEGIN
    ALTER TABLE Questions ADD ReadingPassage NVARCHAR(MAX) NULL;
END
GO

-- 3. Ampliar el CHECK constraint de QuestionType para los nuevos tipos
-- Primero eliminar el constraint existente
IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('Questions') AND name LIKE '%QuestionType%')
BEGIN
    DECLARE @ConstraintName NVARCHAR(200);
    SELECT @ConstraintName = name FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('Questions') AND name LIKE '%QuestionType%';
    
    IF @ConstraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE Questions DROP CONSTRAINT [' + @ConstraintName + ']');
    END
END
GO

-- Agregar nuevo CHECK constraint con todos los tipos
ALTER TABLE Questions ADD CONSTRAINT CK_Questions_QuestionType
CHECK (QuestionType IN (
    'vocabulary_match',
    'drag_drop',
    'boss_multiple_choice',
    'pragmatics_map',
    'grammar_circuit',
    'part1_notice',
    'part2_matching',
    'part3_dialogue',
    'part4_cloze',
    'part5_reading',
    'part6_critical',
    'part7_cloze_advanced'
));
GO

-- 4. Crear índice para QuestionType (usado por consultas aleatorias)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Questions') AND name = 'IX_Questions_QuestionType')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Questions_QuestionType ON Questions(QuestionType);
END
GO

PRINT 'Schema update completado exitosamente.';
GO
