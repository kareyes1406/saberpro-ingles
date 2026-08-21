-- =========================================================
-- SCRIPT: Habilitar Row-Level Security (RLS) en Azure SQL
-- Objetivo: Restringir que los estudiantes solo puedan ver
--           su propio progreso, puntaje y estadísticas.
-- =========================================================

-- 1. Crear el esquema de seguridad (si no existe)
CREATE SCHEMA Security;
GO

-- 2. Crear la función de predicado (filtrado)
-- Esta función devolverá 1 si el usuario está accediendo a sus propios datos 
-- o si el usuario conectado a la DB es el administrador/owner (dbo).
CREATE FUNCTION Security.fn_user_security_predicate(@UserID int)
    RETURNS TABLE
    WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS fn_security_predicate_result
    -- En la aplicación Express, usamos un solo usuario de BD para la conexión.
    -- Para que RLS funcione desde una app de N capas (middleware), 
    -- se debe usar SESSION_CONTEXT(N'UserId') establecido por el backend.
    WHERE @UserID = CAST(SESSION_CONTEXT(N'UserId') AS int) 
       OR IS_MEMBER('db_owner') = 1; -- Admin ve todo
GO

-- 3. Crear Políticas de Seguridad en tablas sensibles

-- Política para UserProgress (Progreso)
CREATE SECURITY POLICY UserProgressSecurityPolicy
ADD FILTER PREDICATE Security.fn_user_security_predicate(UserID)
ON dbo.UserProgress,
ADD BLOCK PREDICATE Security.fn_user_security_predicate(UserID)
ON dbo.UserProgress
WITH (STATE = ON);
GO

-- Política para UserGamification (XP, Medallas, Nivel)
CREATE SECURITY POLICY GamificationSecurityPolicy
ADD FILTER PREDICATE Security.fn_user_security_predicate(UserID)
ON dbo.UserGamification,
ADD BLOCK PREDICATE Security.fn_user_security_predicate(UserID)
ON dbo.UserGamification
WITH (STATE = ON);
GO

-- =========================================================
-- NOTA PARA EL BACKEND (app.js o database.js):
-- Cuando RLS está activo y se usa pool connection, antes de
-- hacer un query sensible, se debe setear el contexto:
-- 
-- await request.query(`EXEC sp_set_session_context 'UserId', ${req.session.userId};`);
-- const result = await request.query('SELECT * FROM UserProgress');
-- =========================================================
