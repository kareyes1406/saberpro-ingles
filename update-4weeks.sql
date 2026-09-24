-- 1. Actualizar los nombres y configuración de las 4 primeras semanas
UPDATE ModuleWeeks 
SET Title = 'Semana 1: Avisos, Vocabulario y Conversaciones (A1-A2)', 
    Description = 'Interpreta avisos en inglés cotidiano, relaciona vocabulario y diálogos', 
    IsEvaluationWeek = 0, 
    IsBossWeek = 0 
WHERE WeekNumber = 1;

UPDATE ModuleWeeks 
SET Title = 'Semana 2: Gramática Básica y Lectura (A2-B1)', 
    Description = 'Completa textos con gramática correcta y lee textos descriptivos', 
    IsEvaluationWeek = 0, 
    IsBossWeek = 0 
WHERE WeekNumber = 2;

UPDATE ModuleWeeks 
SET Title = 'Semana 3: Lectura Crítica y Gramática Avanzada (B1-B2)', 
    Description = 'Analiza textos argumentativos y completa textos con precisión', 
    IsEvaluationWeek = 0, 
    IsBossWeek = 0 
WHERE WeekNumber = 3;

UPDATE ModuleWeeks 
SET Title = 'Semana 4: Repaso General', 
    Description = 'Repaso integral de todos los niveles. Preparación final', 
    IsEvaluationWeek = 1, 
    IsBossWeek = 1 
WHERE WeekNumber = 4;

-- 2. Renombrar "Pragmática" a "Avisos y Diálogos" (Semanas 1 y 2)
UPDATE Activities 
SET Title = REPLACE(Title, 'Pragmática', 'Avisos y Diálogos') 
WHERE Title LIKE 'Pragmática%' AND WeekID IN (SELECT WeekID FROM ModuleWeeks WHERE WeekNumber IN (1,2));

-- 3. Renombrar "Pragmática" a "Contexto y Respuesta" (Semana 3)
UPDATE Activities 
SET Title = REPLACE(Title, 'Pragmática', 'Contexto y Respuesta') 
WHERE Title LIKE 'Pragmática%' AND WeekID IN (SELECT WeekID FROM ModuleWeeks WHERE WeekNumber = 3);

-- 4. Cualquier otra Pragmática restante (Semana 4+)
UPDATE Activities 
SET Title = REPLACE(Title, 'Pragmática', 'Práctica Interactiva') 
WHERE Title LIKE 'Pragmática%';

-- 5. Convertir la Actividad 20 de las primeras 4 semanas en el Boss Battle
UPDATE Activities 
SET ActivityTypeID = (SELECT ActivityTypeID FROM ActivityTypes WHERE TypeName = 'BossBattle'),
    Title = '⚔️ Boss Battle Semanal', 
    Description = 'Evaluación integral de la semana', 
    XPReward = 100, 
    CoinReward = 50 
WHERE SortOrder = 20 AND WeekID IN (SELECT WeekID FROM ModuleWeeks WHERE WeekNumber IN (1, 2, 3, 4));

-- 6. Limpiar actividades 21 que hayan quedado sueltas en las primeras 4 semanas (Opcional pero recomendado para limpieza)
DELETE FROM UserProgress WHERE ActivityID IN (SELECT ActivityID FROM Activities WHERE SortOrder = 21 AND WeekID IN (SELECT WeekID FROM ModuleWeeks WHERE WeekNumber IN (1, 2, 3, 4)));
DELETE FROM Activities WHERE SortOrder = 21 AND WeekID IN (SELECT WeekID FROM ModuleWeeks WHERE WeekNumber IN (1, 2, 3, 4));
