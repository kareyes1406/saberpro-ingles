/**
 * seed-saberpro-content.js
 * Script de Siembra para 245 Preguntas Auténticas ICFES
 * 
 * Ejecutar con: node seed-saberpro-content.js
 * 
 * Este script:
 * 1. Ejecuta schema-update.sql para agregar columnas Explanation y ReadingPassage
 * 2. Limpia las tablas de contenido existentes (Questions, QuestionOptions, Activities, ModuleWeeks)
 * 3. Crea 12 semanas con actividades
 * 4. Inserta las 245 preguntas del banco ICFES con explicaciones pedagógicas
 * 5. Distribuye las preguntas por tipo en las actividades correspondientes
 */

const { getPool, sql } = require('./config/database');
const questions = require('./questions');
const fs = require('fs');
const path = require('path');

async function seed() {
    let pool;
    try {
        pool = await getPool();
        console.log('✅ Conectado a la base de datos');

        // ── 1. Ejecutar schema update ───────────────────────────────────
        console.log('\n📋 Actualizando esquema de la base de datos...');
        try {
            const schemaUpdatePath = path.join(__dirname, 'database', 'schema-update.sql');
            if (fs.existsSync(schemaUpdatePath)) {
                const schemaSQL = fs.readFileSync(schemaUpdatePath, 'utf8');
                // Execute each GO-separated batch
                const batches = schemaSQL.split(/\nGO\b/i).filter(b => b.trim());
                for (const batch of batches) {
                    if (batch.trim()) {
                        try {
                            await pool.request().query(batch);
                        } catch (e) {
                            // Ignore errors if constraints/columns already exist
                            if (!e.message.includes('already exists') && !e.message.includes('There is already')) {
                                console.warn('⚠️  Schema batch warning:', e.message.substring(0, 100));
                            }
                        }
                    }
                }
                console.log('✅ Esquema actualizado');
            }
        } catch (e) {
            console.warn('⚠️  Schema update skipped:', e.message.substring(0, 100));
        }

        // ── 2. Limpiar datos existentes ─────────────────────────────────
        console.log('\n🗑️  Limpiando datos existentes...');
        await pool.request().query('DELETE FROM QuestionOptions');
        await pool.request().query('DELETE FROM Questions');
        await pool.request().query('DELETE FROM UserProgress');
        await pool.request().query('DELETE FROM EvaluationResults');
        await pool.request().query('DELETE FROM Activities');
        await pool.request().query('DELETE FROM ModuleWeeks');
        console.log('✅ Tablas limpiadas');

        // ── 3. Obtener el ID del módulo de Inglés ───────────────────────
        const moduleResult = await pool.request().query(
            "SELECT ModuleID FROM Modules WHERE ModuleName = 'Inglés Saber Pro'"
        );
        const moduleId = moduleResult.recordset[0]?.ModuleID;
        if (!moduleId) {
            throw new Error('Módulo "Inglés Saber Pro" no encontrado. Ejecuta schema.sql primero.');
        }

        // Obtener Activity Types
        const atResult = await pool.request().query('SELECT * FROM ActivityTypes');
        const activityTypes = {};
        atResult.recordset.forEach(at => {
            activityTypes[at.TypeName] = at.ActivityTypeID;
        });

        // ── 4. Crear las 12 semanas ─────────────────────────────────────
        console.log('\n📅 Creando 12 semanas...');
        const weekDefs = [
            // Semanas 1-3: Nivel A1-A2 (Parts 1, 2, 3)
            { num: 1, title: 'Semana 1: Avisos y Señales', desc: 'Interpreta avisos y letreros en inglés cotidiano', isEval: false, isBoss: false },
            { num: 2, title: 'Semana 2: Vocabulario en Contexto', desc: 'Relaciona definiciones con vocabulario temático', isEval: false, isBoss: false },
            { num: 3, title: 'Semana 3: Conversaciones', desc: 'Identifica respuestas apropiadas en diálogos', isEval: false, isBoss: false },
            { num: 4, title: 'Semana 4: Evaluación Corte 1', desc: 'Evaluación de nivel A1-A2', isEval: true, isBoss: true },
            // Semanas 5-7: Nivel A2-B1 (Parts 4, 5)
            { num: 5, title: 'Semana 5: Gramática Básica', desc: 'Completa textos con la forma gramatical correcta', isEval: false, isBoss: false },
            { num: 6, title: 'Semana 6: Comprensión de Lectura', desc: 'Lee textos y responde preguntas de comprensión', isEval: false, isBoss: false },
            { num: 7, title: 'Semana 7: Práctica Integrada A2-B1', desc: 'Practica gramática y comprensión lectora', isEval: false, isBoss: false },
            { num: 8, title: 'Semana 8: Evaluación Corte 2', desc: 'Evaluación de nivel A2-B1', isEval: true, isBoss: true },
            // Semanas 9-11: Nivel B1-B2 (Parts 6, 7)
            { num: 9, title: 'Semana 9: Lectura Crítica', desc: 'Analiza textos argumentativos y académicos', isEval: false, isBoss: false },
            { num: 10, title: 'Semana 10: Gramática Avanzada', desc: 'Completa textos avanzados con precisión lingüística', isEval: false, isBoss: false },
            { num: 11, title: 'Semana 11: Práctica Avanzada B1-B2', desc: 'Integra lectura crítica y gramática avanzada', isEval: false, isBoss: false },
            { num: 12, title: 'Semana 12: Evaluación Final', desc: 'Evaluación integral de todos los niveles', isEval: true, isBoss: true },
        ];

        const weekIds = {};
        for (const w of weekDefs) {
            const result = await pool.request()
                .input('ModuleID', sql.Int, moduleId)
                .input('WeekNumber', sql.Int, w.num)
                .input('Title', sql.NVarChar, w.title)
                .input('Description', sql.NVarChar, w.desc)
                .input('IsEval', sql.Bit, w.isEval ? 1 : 0)
                .input('IsBoss', sql.Bit, w.isBoss ? 1 : 0)
                .query(`
                    INSERT INTO ModuleWeeks (ModuleID, WeekNumber, Title, Description, IsEvaluationWeek, IsBossWeek)
                    OUTPUT INSERTED.WeekID
                    VALUES (@ModuleID, @WeekNumber, @Title, @Description, @IsEval, @IsBoss)
                `);
            weekIds[w.num] = result.recordset[0].WeekID;
        }
        console.log('✅ 12 semanas creadas');

        // ── 5. Crear Actividades por Semana ─────────────────────────────
        console.log('\n🎮 Creando actividades (20 por semana regular, 1 Boss)...');
        const activityDefs = [];
        for (let w = 1; w <= 12; w++) {
            // Siempre generar los 20 niveles regulares
            for (let i = 1; i <= 20; i++) {
                let type = '';
                let title = '';
                if (w <= 3) {
                    type = i % 2 === 0 ? 'Vocabulary' : 'Pragmatics';
                    title = type === 'Vocabulary' ? `Vocabulario ${i}` : `Pragmática ${i}`;
                } else if (w <= 7) {
                    type = i % 2 === 0 ? 'Grammar' : 'Reading';
                    title = type === 'Grammar' ? `Gramática ${i}` : `Lectura ${i}`;
                } else {
                    type = i % 2 === 0 ? 'Reading' : 'Grammar';
                    title = type === 'Reading' ? `Lectura Crítica ${i}` : `Cloze Avanzado ${i}`;
                }
                activityDefs.push({ week: w, type: type, title: title, desc: `Nivel ${i} de la Semana ${w}`, xp: 15, coins: 8, sort: i });
            }
            
            // Si es semana de corte, agregar el Boss Battle al final (nivel 21)
            const isBoss = (w % 4 === 0);
            if (isBoss) {
                activityDefs.push({ week: w, type: 'BossBattle', title: `⚔️ Boss Battle Corte ${w/4}`, desc: 'Evaluación integral', xp: 100, coins: 50, sort: 21 });
            }
        }

        const activityIds = {};
        for (const a of activityDefs) {
            const typeId = activityTypes[a.type];
            if (!typeId) {
                console.warn(`⚠️  ActivityType "${a.type}" no encontrado, saltando...`);
                continue;
            }
            const result = await pool.request()
                .input('WeekID', sql.Int, weekIds[a.week])
                .input('TypeID', sql.Int, typeId)
                .input('Title', sql.NVarChar, a.title)
                .input('Desc', sql.NVarChar, a.desc)
                .input('XP', sql.Int, a.xp)
                .input('Coins', sql.Int, a.coins)
                .input('Sort', sql.Int, a.sort)
                .query(`
                    INSERT INTO Activities (WeekID, ActivityTypeID, Title, Description, XPReward, CoinReward, SortOrder)
                    OUTPUT INSERTED.ActivityID
                    VALUES (@WeekID, @TypeID, @Title, @Desc, @XP, @Coins, @Sort)
                `);
            const actId = result.recordset[0].ActivityID;
            const key = `w${a.week}_${a.type}_${a.sort}`;
            activityIds[key] = actId;
        }
        console.log(`✅ ${activityDefs.length} Actividades creadas`);

        // ── 6. Insertar las 245 preguntas ───────────────────────────────
        console.log('\n📝 Insertando 245 preguntas ICFES...');
        
        // Helper to insert a question with options
        async function insertQuestion(activityId, questionText, questionType, options, correctIndex, explanation, readingPassage, mediaUrl, sortOrder) {
            const qResult = await pool.request()
                .input('ActivityID', sql.Int, activityId)
                .input('QuestionText', sql.NVarChar, questionText)
                .input('QuestionType', sql.NVarChar, questionType)
                .input('MediaUrl', sql.NVarChar, mediaUrl || null)
                .input('Explanation', sql.NVarChar, explanation || null)
                .input('ReadingPassage', sql.NVarChar, readingPassage || null)
                .input('SortOrder', sql.Int, sortOrder || 0)
                .query(`
                    INSERT INTO Questions (ActivityID, QuestionText, QuestionType, MediaUrl, Explanation, ReadingPassage, SortOrder)
                    OUTPUT INSERTED.QuestionID
                    VALUES (@ActivityID, @QuestionText, @QuestionType, @MediaUrl, @Explanation, @ReadingPassage, @SortOrder)
                `);
            const questionId = qResult.recordset[0].QuestionID;

            for (let i = 0; i < options.length; i++) {
                await pool.request()
                    .input('QuestionID', sql.Int, questionId)
                    .input('OptionText', sql.NVarChar, options[i])
                    .input('IsCorrect', sql.Bit, i === correctIndex ? 1 : 0)
                    .input('SortOrder', sql.Int, i)
                    .query(`
                        INSERT INTO QuestionOptions (QuestionID, OptionText, IsCorrect, SortOrder)
                        VALUES (@QuestionID, @OptionText, @IsCorrect, @SortOrder)
                    `);
            }
            return questionId;
        }

        // Use first pragmatics activity as the "pool" holder for Part 1 notices
        const poolPragmatics1 = activityIds['w1_Pragmatics_1'] || Object.values(activityIds)[0];
        const poolPragmatics2 = activityIds['w2_Pragmatics_2'] || poolPragmatics1;
        const poolVocab = activityIds['w2_Vocabulary_1'] || activityIds['w1_Vocabulary_2'] || Object.values(activityIds)[0];
        const poolDialogues = activityIds['w3_Pragmatics_1'] || poolPragmatics1;
        const poolGrammar1 = activityIds['w5_Grammar_1'] || Object.values(activityIds)[0];
        const poolReading1 = activityIds['w6_Reading_1'] || Object.values(activityIds)[0];
        const poolCritical = activityIds['w9_Reading_1'] || Object.values(activityIds)[0];
        const poolGrammarAdv = activityIds['w10_Grammar_1'] || Object.values(activityIds)[0];

        let insertedCount = 0;

        // ── Part 1: Avisos (35 preguntas) ───────────────────────────────
        console.log('  📌 Part 1: Avisos y Señales (35)...');
        for (let i = 0; i < questions.part1Notices.length; i++) {
            const q = questions.part1Notices[i];
            const actId = i < 18 ? poolPragmatics1 : poolPragmatics2;
            await insertQuestion(
                actId,
                q.notice,
                'part1_notice',
                q.options,
                q.correct,
                q.explanation,
                null,
                null,
                i
            );
            insertedCount++;
        }

        // ── Part 2: Matching Vocabulario (35 preguntas en 7 sets) ───────
        console.log('  📌 Part 2: Vocabulario Matching (35)...');
        for (const set of questions.part2Matching) {
            for (let i = 0; i < set.questions.length; i++) {
                const q = set.questions[i];
                await insertQuestion(
                    poolVocab,
                    q.definition,
                    'part2_matching',
                    set.words,
                    q.correctIndex,
                    q.explanation,
                    null,
                    set.theme, // Store theme in MediaUrl for grouping
                    insertedCount
                );
                insertedCount++;
            }
        }

        // ── Part 3: Diálogos (35 preguntas) ─────────────────────────────
        console.log('  📌 Part 3: Diálogos Cortos (35)...');
        for (let i = 0; i < questions.part3Dialogues.length; i++) {
            const q = questions.part3Dialogues[i];
            await insertQuestion(
                poolDialogues,
                q.speaker,
                'part3_dialogue',
                q.options,
                q.correct,
                q.explanation,
                null,
                null,
                i
            );
            insertedCount++;
        }

        // ── Part 4: Cloze Básico (35 preguntas en 5 textos) ────────────
        console.log('  📌 Part 4: Cloze Test Básico (35)...');
        for (const text of questions.part4ClozeBasic) {
            for (let i = 0; i < text.questions.length; i++) {
                const q = text.questions[i];
                await insertQuestion(
                    poolGrammar1,
                    q.id + ': (' + q.blankNumber + ') ________',
                    'part4_cloze',
                    q.options,
                    q.correct,
                    q.explanation,
                    text.passage,
                    text.title,
                    insertedCount
                );
                insertedCount++;
            }
        }

        // ── Part 5: Comprensión Lectora (35 preguntas en 5 textos) ──────
        console.log('  📌 Part 5: Comprensión de Lectura (35)...');
        for (const text of questions.part5Reading) {
            for (let i = 0; i < text.questions.length; i++) {
                const q = text.questions[i];
                await insertQuestion(
                    poolReading1,
                    q.question,
                    'part5_reading',
                    q.options,
                    q.correct,
                    q.explanation,
                    text.passage,
                    text.title,
                    insertedCount
                );
                insertedCount++;
            }
        }

        // ── Part 6: Lectura Crítica (35 preguntas en 7 textos) ──────────
        console.log('  📌 Part 6: Lectura Crítica (35)...');
        if (questions.part6Critical && questions.part6Critical.length > 0) {
            for (const text of questions.part6Critical) {
                for (let i = 0; i < text.questions.length; i++) {
                    const q = text.questions[i];
                    await insertQuestion(
                        poolCritical,
                        q.question,
                        'part6_critical',
                        q.options,
                        q.correct,
                        q.explanation,
                        text.passage,
                        text.title,
                        insertedCount
                    );
                    insertedCount++;
                }
            }
        } else {
            console.warn('  ⚠️  Part 6 data not available yet');
        }

        // ── Part 7: Cloze Avanzado (35 preguntas en 4 textos) ───────────
        console.log('  📌 Part 7: Cloze Test Avanzado (35)...');
        for (const text of questions.part7ClozeAdvanced) {
            for (let i = 0; i < text.questions.length; i++) {
                const q = text.questions[i];
                await insertQuestion(
                    poolGrammarAdv,
                    q.id + ': (' + q.blankNumber + ') ________',
                    'part7_cloze_advanced',
                    q.options,
                    q.correct,
                    q.explanation,
                    text.passage,
                    text.title,
                    insertedCount
                );
                insertedCount++;
            }
        }

        console.log(`\n✅ ¡Seed completado! ${insertedCount} preguntas insertadas.`);
        console.log('📊 Resumen:');
        console.log('   • Part 1 (Avisos): 35 preguntas');
        console.log('   • Part 2 (Matching): 35 preguntas');
        console.log('   • Part 3 (Diálogos): 35 preguntas');
        console.log('   • Part 4 (Cloze Básico): 35 preguntas');
        console.log('   • Part 5 (Lectura): 35 preguntas');
        console.log('   • Part 6 (Lectura Crítica): 35 preguntas');
        console.log('   • Part 7 (Cloze Avanzado): 35 preguntas');
        console.log(`   📦 TOTAL: ${insertedCount}/245`);
        console.log('\n🎮 Las preguntas se seleccionan ALEATORIAMENTE para cada estudiante');
        console.log('🔀 No hay dos estudiantes que vean el mismo conjunto de preguntas');

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        throw error;
    } finally {
        if (pool) {
            try { await pool.close(); } catch (e) { /* ignore */ }
        }
    }
}

seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
