/**
 * migrate-4weeks.js
 * Script para actualizar de forma segura el currículum de 12 semanas a 4 semanas.
 * Se ejecuta con: node migrate-4weeks.js
 */

const { getPool, sql } = require('./config/database');

async function runMigration() {
    let pool;
    try {
        pool = await getPool();
        console.log('✅ Conectado a la base de datos');

        // Empezar una transacción para hacer rollback si algo falla
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        console.log('🔄 Transacción iniciada');

        try {
            // 1. Obtener el ModuleID para 'Inglés Saber Pro'
            const moduleResult = await transaction.request().query("SELECT ModuleID FROM Modules WHERE ModuleName = 'Inglés Saber Pro'");
            const moduleId = moduleResult.recordset[0]?.ModuleID;
            
            if (!moduleId) throw new Error('No se encontró el módulo principal');

            // 2. Obtener los IDs de las semanas actuales
            const weeksResult = await transaction.request()
                .input('ModuleID', sql.Int, moduleId)
                .query('SELECT WeekID, WeekNumber FROM ModuleWeeks WHERE ModuleID = @ModuleID ORDER BY WeekNumber');
            
            const weeks = weeksResult.recordset;
            if (weeks.length === 0) throw new Error('No se encontraron semanas en la base de datos');

            console.log(`Encontradas ${weeks.length} semanas`);

            // 3. Actualizar la información de las primeras 4 semanas
            const newWeekTitles = [
                { num: 1, title: 'Semana 1: Avisos, Vocabulario y Conversaciones (A1-A2)', desc: 'Interpreta avisos en inglés cotidiano, relaciona vocabulario y diálogos', isEval: false, isBoss: false },
                { num: 2, title: 'Semana 2: Gramática Básica y Lectura (A2-B1)', desc: 'Completa textos con gramática correcta y lee textos descriptivos', isEval: false, isBoss: false },
                { num: 3, title: 'Semana 3: Lectura Crítica y Gramática Avanzada (B1-B2)', desc: 'Analiza textos argumentativos y completa textos con precisión', isEval: false, isBoss: false },
                { num: 4, title: 'Semana 4: Repaso General', desc: 'Repaso integral de todos los niveles. Preparación final', isEval: true, isBoss: true }
            ];

            for (let i = 0; i < 4; i++) {
                if (weeks[i]) {
                    const data = newWeekTitles[i];
                    await transaction.request()
                        .input('Title', sql.NVarChar, data.title)
                        .input('Description', sql.NVarChar, data.desc)
                        .input('IsEval', sql.Bit, data.isEval ? 1 : 0)
                        .input('IsBoss', sql.Bit, data.isBoss ? 1 : 0)
                        .input('WeekID', sql.Int, weeks[i].WeekID)
                        .query('UPDATE ModuleWeeks SET Title = @Title, Description = @Description, IsEvaluationWeek = @IsEval, IsBossWeek = @IsBoss WHERE WeekID = @WeekID');
                    console.log(`✅ Semana ${i+1} actualizada a: ${data.title}`);
                }
            }

            // 4. Modificar el título de las actividades Pragmáticas
            // Cambiar "Pragmática" a "Avisos y Diálogos" en semanas 1-2, y a "Contexto y Respuesta" en semana 3
            await transaction.request().query("UPDATE Activities SET Title = REPLACE(Title, 'Pragmática', 'Avisos y Diálogos') WHERE Title LIKE 'Pragmática%' AND WeekID IN (SELECT WeekID FROM ModuleWeeks WHERE WeekNumber IN (1,2))");
            await transaction.request().query("UPDATE Activities SET Title = REPLACE(Title, 'Pragmática', 'Contexto y Respuesta') WHERE Title LIKE 'Pragmática%' AND WeekID IN (SELECT WeekID FROM ModuleWeeks WHERE WeekNumber = 3)");
            await transaction.request().query("UPDATE Activities SET Title = REPLACE(Title, 'Pragmática', 'Práctica Interactiva') WHERE Title LIKE 'Pragmática%'");
            
            // 5. Arreglar las batallas de jefe:
            // Asegurar que la actividad Boss en las semanas 1,2,3,4 tenga SortOrder = 20 y sean del tipo BossBattle
            // Pero en nuestra lógica original, estaban en las semanas 4,8,12 (Sort=21). 
            // Para simplificar, nos aseguramos que en las 4 semanas activas, la actividad de SortOrder=20 sea el Boss, o creamos una si no existe.
            
            // Primero, aseguramos que las actividades regulares de cada semana lleguen a 19, 
            // y la 20 sea el Boss (si actualmente hay 20 regulares, la 20 pasa a ser Boss)
            
            const atResult = await transaction.request().query("SELECT ActivityTypeID FROM ActivityTypes WHERE TypeName = 'BossBattle'");
            const bossTypeId = atResult.recordset[0].ActivityTypeID;

            for (let i = 0; i < 4; i++) {
                if (weeks[i]) {
                    const weekId = weeks[i].WeekID;
                    
                    // Buscar si ya hay un Boss en esa semana (puede estar como Sort=21)
                    const bossCheck = await transaction.request()
                        .input('WeekID', sql.Int, weekId)
                        .input('BossType', sql.Int, bossTypeId)
                        .query('SELECT ActivityID, SortOrder FROM Activities WHERE WeekID = @WeekID AND ActivityTypeID = @BossType');
                        
                    if (bossCheck.recordset.length > 0) {
                        // Ya hay boss, forzar SortOrder = 20 y mover la actividad regular que estaba en 20 a 19 (o ignorarla)
                        const bossId = bossCheck.recordset[0].ActivityID;
                        // Borramos cualquier actividad normal que tuviera SortOrder 20 (y su progreso por si acaso)
                        await transaction.request().input('WeekID', sql.Int, weekId).query('DELETE FROM UserProgress WHERE ActivityID IN (SELECT ActivityID FROM Activities WHERE WeekID = @WeekID AND SortOrder = 20 AND ActivityTypeID != '+bossTypeId+')');
                        await transaction.request().input('WeekID', sql.Int, weekId).query('DELETE FROM Activities WHERE WeekID = @WeekID AND SortOrder = 20 AND ActivityTypeID != '+bossTypeId);
                        // Movemos el Boss a SortOrder 20
                        await transaction.request().input('BossID', sql.Int, bossId).query('UPDATE Activities SET SortOrder = 20 WHERE ActivityID = @BossID');
                    } else {
                        // Transformar la actividad normal 20 en un Boss
                        await transaction.request()
                            .input('WeekID', sql.Int, weekId)
                            .input('BossType', sql.Int, bossTypeId)
                            .query("UPDATE Activities SET ActivityTypeID = @BossType, Title = '⚔️ Boss Battle Semanal', Description = 'Evaluación integral de la semana', XPReward = 100, CoinReward = 50 WHERE WeekID = @WeekID AND SortOrder = 20");
                    }
                    console.log(`✅ Boss configurado para la Semana ${i+1}`);
                }
            }

            // Opcional: No vamos a eliminar las semanas 5-12, 
            // ya que el código ahora filtra internamente `weeks.slice(0, 4)`.
            // Dejar los datos intactos es mucho más seguro para no romper restricciones de FK ni UserProgress.

            await transaction.commit();
            console.log('✅ Migración exitosa. La base de datos ha sido actualizada a 4 semanas.');

        } catch (err) {
            console.error('❌ Error durante la migración, haciendo rollback...', err.message);
            await transaction.rollback();
        }

    } catch (e) {
        console.error('❌ Error de conexión:', e.message);
    } finally {
        if (pool) {
            try { await pool.close(); } catch (e) {}
        }
    }
}

runMigration().then(() => process.exit(0)).catch(() => process.exit(1));
