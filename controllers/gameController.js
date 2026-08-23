/**
 * controllers/gameController.js
 * Controlador de Mecánicas de Juego
 * Adaptado para 245 preguntas ICFES con aleatorización
 */
const Module = require('../models/Module');
const Progress = require('../models/Progress');
const Gamification = require('../models/Gamification');
const Evaluation = require('../models/Evaluation');
const { executeQuery, sql } = require('../config/database');

// Helper to shuffle array
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Helper to check if an activity was already completed successfully
async function isAlreadyCompleted(userId, activityId) {
    try {
        const result = await executeQuery(`
            SELECT COUNT(*) as count 
            FROM UserProgress 
            WHERE UserID = @UserID AND ActivityID = @ActivityID AND IsCompleted = 1
        `, [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'ActivityID', type: sql.Int, value: activityId }
        ]);
        return result.recordset[0].count > 0;
    } catch (e) {
        console.error('isAlreadyCompleted check error:', e);
        throw new Error('Database check failed');
    }
}

/**
 * Determina el tipo de pregunta a usar según la semana y el tipo de actividad
 */
function getQuestionTypeForActivity(weekNumber, activityType) {
    // Semanas 1-3: Nivel A1-A2 (Parts 1, 2, 3)
    // Semanas 5-7: Nivel A2-B1 (Parts 4, 5)
    // Semanas 9-11: Nivel B1-B2 (Parts 6, 7)
    
    if (activityType === 'Vocabulary') {
        return 'part2_matching';
    } else if (activityType === 'Pragmatics') {
        if (weekNumber <= 3) return 'part1_notice';
        if (weekNumber <= 7) return 'part3_dialogue';
        return 'part1_notice'; // fallback
    } else if (activityType === 'Reading') {
        if (weekNumber <= 7) return 'part5_reading';
        return 'part6_critical';
    } else if (activityType === 'Grammar') {
        if (weekNumber <= 7) return 'part4_cloze';
        return 'part7_cloze_advanced';
    }
    return 'part1_notice';
}

// ── VOCABULARIO (Part 2: Matching) ──────────────────────────────────
exports.showVocabulary = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        // Obtener preguntas del pool de vocabulario aleatoriamente
        const questions = await Module.getRandomQuestionsByType('part2_matching', 5, userId, activityId);
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        
        // Prepare vocabulary pairs: QuestionText = Definition, correct option = Word
        const pairs = questions.map(q => ({
            QuestionID: q.QuestionID,
            QuestionText: q.QuestionText,
            Explanation: q.Explanation,
            CorrectOption: q.Options.find(o => o.IsCorrect) || q.Options[0]
        }));
        
        // Shuffle the options for display
        const shuffledOptions = shuffleArray(pairs.map(p => ({
            OptionID: p.CorrectOption ? p.CorrectOption.OptionID : 0,
            OptionText: p.CorrectOption ? p.CorrectOption.OptionText : '',
            questionId: p.QuestionID
        })));
        
        res.render('student/vocabulary', {
            title: 'Magnate de las Palabras',
            cssFile: 'vocabulary.css',
            jsFile: 'vocabulary.js',
            activity,
            questions: pairs,
            shuffledOptions,
            studentStats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Vocabulary Error:', error);
        res.status(500).send('Error cargando el juego de vocabulario');
    }
};

exports.submitVocabulary = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { activityId, matches, timeSpent } = req.body;
        
        const activity = await Module.getActivity(parseInt(activityId));
        if (!activity) return res.status(400).json({ error: 'Actividad no encontrada' });
        
        const matchedPairs = parseInt(req.body.matchedPairs || 0);
        const totalQ = parseInt(req.body.totalQuestions || 5);
        
        const score = totalQ > 0 ? Math.round((matchedPairs / totalQ) * 100) : 100;
        const passed = score >= 60;
        
        const alreadyCompleted = await isAlreadyCompleted(userId, parseInt(activityId));
        
        await Progress.recordCompletion({
            userId, activityId: parseInt(activityId),
            isCompleted: passed, score,
            timeSpentSeconds: timeSpent || 0, attemptNumber: 1
        });
        
        let xpEarned = 0;
        let coinsEarned = 0;
        
        if (passed && !alreadyCompleted) {
            xpEarned = Math.round((score / 100) * activity.XPReward);
            coinsEarned = Math.round((score / 100) * activity.CoinReward);
            await Gamification.addXP(userId, xpEarned, parseInt(activityId));
            await Gamification.addCoins(userId, coinsEarned);
        }
        
        await Gamification.updateStreak(userId);
        await Gamification.checkAndAwardBadges(userId);
        
        res.json({ success: true, xpEarned, coinsEarned, score, passed, alreadyCompleted });
    } catch (error) {
        console.error('Submit Vocabulary Error:', error);
        res.status(500).json({ error: 'Error al enviar respuestas' });
    }
};

// ── LECTURA (Parts 5 y 6: Comprensión) ──────────────────────────────
exports.showReading = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        // Determinar la semana para saber qué tipo de lectura usar
        const weekResult = await executeQuery(
            'SELECT WeekNumber FROM ModuleWeeks MW INNER JOIN Activities A ON MW.WeekID = A.WeekID WHERE A.ActivityID = @ActivityID',
            [{ name: 'ActivityID', type: sql.Int, value: activityId }]
        );
        const weekNumber = weekResult.recordset.length > 0 ? weekResult.recordset[0].WeekNumber : 1;
        
        // Seleccionar tipo de lectura según la semana
        const questionType = weekNumber <= 7 ? 'part5_reading' : 'part6_critical';
        
        // Obtener todas las preguntas de lectura de ese tipo
        const allQuestions = await Module.getReadingQuestions(questionType, userId);
        
        // Agrupar por ReadingPassage para obtener un texto completo con sus preguntas
        const passageGroups = {};
        allQuestions.forEach(q => {
            const passageKey = q.ReadingPassage || q.MediaUrl || 'default';
            if (!passageGroups[passageKey]) {
                passageGroups[passageKey] = {
                    passage: q.ReadingPassage,
                    title: q.MediaUrl, // MediaUrl stores the reading title
                    questions: []
                };
            }
            passageGroups[passageKey].questions.push(q);
        });
        
        // Seleccionar UN pasaje aleatorio
        const passageKeys = Object.keys(passageGroups);
        const randomPassageKey = passageKeys[Math.floor(Math.random() * passageKeys.length)];
        const selectedGroup = passageGroups[randomPassageKey] || { passage: '', title: '', questions: [] };
        
        // Tomar un subconjunto aleatorio de preguntas de ese pasaje (5-7)
        const selectedQuestions = shuffleArray(selectedGroup.questions).slice(0, 7);
        
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        
        // Guardar respuestas correctas en sesión para verificación segura
        const correctAnswers = {};
        const clientQuestions = selectedQuestions.map(q => {
            const correctOpt = q.Options.find(o => o.IsCorrect);
            if (correctOpt) correctAnswers[q.QuestionID] = correctOpt.OptionID;
            return {
                QuestionID: q.QuestionID,
                QuestionText: q.QuestionText,
                QuestionType: q.QuestionType,
                Explanation: q.Explanation,
                Options: q.Options.map(o => ({
                    OptionID: o.OptionID,
                    OptionText: o.OptionText
                }))
            };
        });
        
        req.session.readingAnswers = correctAnswers;
        
        res.render('student/reading', {
            title: questionType === 'part6_critical' ? 'Lectura Crítica' : 'Comprensión de Lectura',
            cssFile: 'reading.css',
            jsFile: 'reading.js',
            activity,
            passage: selectedGroup.passage || '',
            passageTitle: selectedGroup.title || '',
            questions: clientQuestions,
            studentStats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Reading Error:', error);
        res.status(500).send('Error cargando lectura');
    }
};

exports.submitReading = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { activityId, answers, timeSpent } = req.body;
        
        const activity = await Module.getActivity(parseInt(activityId));
        if (!activity) return res.status(400).json({ error: 'Actividad no encontrada' });
        
        const correctAnswers = req.session.readingAnswers || {};
        const totalQuestions = Object.keys(correctAnswers).length;
        let correctCount = 0;
        
        if (answers && typeof answers === 'object') {
            Object.entries(answers).forEach(([qId, optId]) => {
                if (correctAnswers[qId] === parseInt(optId)) {
                    correctCount++;
                }
            });
        }
        
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = score >= 60;
        
        const alreadyCompleted = await isAlreadyCompleted(userId, parseInt(activityId));
        
        await Progress.recordCompletion({
            userId, activityId: parseInt(activityId),
            isCompleted: passed, score,
            timeSpentSeconds: timeSpent || 0, attemptNumber: 1
        });
        
        let xpEarned = 0;
        let coinsEarned = 0;
        
        if (passed && !alreadyCompleted) {
            xpEarned = Math.round((score / 100) * activity.XPReward);
            coinsEarned = Math.round((score / 100) * activity.CoinReward);
            await Gamification.addXP(userId, xpEarned, parseInt(activityId));
            await Gamification.addCoins(userId, coinsEarned);
        }
        
        await Gamification.updateStreak(userId);
        await Gamification.checkAndAwardBadges(userId);
        
        if (passed) {
            delete req.session.readingAnswers;
        }
        
        res.json({ success: true, xpEarned, coinsEarned, score, passed, correctCount, totalQuestions, alreadyCompleted });
    } catch (error) {
        console.error('Submit Reading Error:', error);
        res.status(500).json({ error: 'Error al verificar lectura' });
    }
};

// ── PRAGMÁTICA (Parts 1 y 3: Avisos y Diálogos) ────────────────────
exports.showPragmatics = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        // Determinar la semana para saber qué tipo usar
        const weekResult = await executeQuery(
            'SELECT WeekNumber FROM ModuleWeeks MW INNER JOIN Activities A ON MW.WeekID = A.WeekID WHERE A.ActivityID = @ActivityID',
            [{ name: 'ActivityID', type: sql.Int, value: activityId }]
        );
        const weekNumber = weekResult.recordset.length > 0 ? weekResult.recordset[0].WeekNumber : 1;
        
        // Semanas 1-3: Avisos (Part 1), Semanas 5-7: Diálogos (Part 3)
        const questionType = weekNumber <= 4 ? 'part1_notice' : 'part3_dialogue';
        
        // Obtener 5 preguntas aleatorias del pool
        const questions = await Module.getRandomQuestionsByType(questionType, 5, userId, activityId);
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        
        // Guardar respuestas correctas en sesión
        const correctAnswers = {};
        
        // Recolectar opciones incorrectas de todas las preguntas para usar como distractores extra
        const allWrongOptions = [
            "In a library", "At a train station", "In a hospital", "At a restaurant", 
            "In a museum", "At a post office", "In a supermarket", "At a hotel",
            "In a police station", "At an airport", "In a park", "At a school",
            "Yes, please.", "No, thanks.", "I don't know.", "Maybe later.",
            "That's a good idea.", "I'm sorry.", "Excuse me.", "You're welcome.",
            "I agree.", "I disagree.", "It's too expensive.", "I'll take it."
        ];
        
        questions.forEach(q => {
            q.Options.forEach(o => {
                if (!o.IsCorrect) allWrongOptions.push(o.OptionText);
            });
        });
        
        const clientQuestions = questions.map(q => {
            const correctOpt = q.Options.find(o => o.IsCorrect);
            if (correctOpt) correctAnswers[q.QuestionID] = correctOpt.OptionID;
            
            // Crear copia de opciones con la info necesaria
            let opts = q.Options.map(o => ({
                OptionID: o.OptionID,
                OptionText: o.OptionText,
                IsCorrect: o.IsCorrect
            }));
            
            // Asegurar que siempre haya 4 opciones
            while (opts.length < 4) {
                // Buscar un distractor que no se repita con las opciones existentes
                const existingTexts = opts.map(o => o.OptionText.toLowerCase());
                const availableDistractors = allWrongOptions.filter(t => 
                    !existingTexts.includes(t.toLowerCase())
                );
                if (availableDistractors.length > 0) {
                    const randomDistractor = availableDistractors[Math.floor(Math.random() * availableDistractors.length)];
                    opts.push({
                        OptionID: -(opts.length + 1) * q.QuestionID, // ID negativo único
                        OptionText: randomDistractor,
                        IsCorrect: false
                    });
                } else {
                    // Si no hay distractores, usar uno genérico para que no se quede bloqueado
                    opts.push({
                        OptionID: -(opts.length + 1) * q.QuestionID,
                        OptionText: 'No aplica',
                        IsCorrect: false
                    });
                }
            }
            
            // Mezclar (shuffle) las opciones para que la correcta no siempre sea la A
            for (let i = opts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [opts[i], opts[j]] = [opts[j], opts[i]];
            }
            
            return {
                QuestionID: q.QuestionID,
                QuestionText: q.QuestionText,
                QuestionType: q.QuestionType,
                Explanation: q.Explanation,
                Options: opts
            };
        });
        
        req.session.pragmaticsAnswers = correctAnswers;
        
        res.render('student/pragmatics', {
            title: questionType === 'part1_notice' ? 'Avisos y Señales' : 'Conversaciones',
            cssFile: 'pragmatics.css',
            jsFile: 'pragmatics.js',
            activity,
            questions: clientQuestions,
            studentStats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Pragmatics Error:', error);
        res.status(500).send('Error cargando módulo de pragmática');
    }
};

exports.submitPragmatics = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { activityId, matches, matchedPairs, timeSpent } = req.body;
        
        const activity = await Module.getActivity(parseInt(activityId));
        if (!activity) return res.status(400).json({ error: 'Actividad no encontrada' });
        
        const correctAnswers = req.session.pragmaticsAnswers || {};
        const totalQ = Object.keys(correctAnswers).length || 5;
        let correctCount = parseInt(matchedPairs || 0);
        
        // Si se envían matches individuales, verificar contra sesión
        if (matches && typeof matches === 'object' && !matchedPairs) {
            correctCount = 0;
            Object.entries(matches).forEach(([qId, optId]) => {
                if (correctAnswers[qId] === parseInt(optId)) {
                    correctCount++;
                }
            });
        }
        
        const score = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 100;
        const passed = score >= 60;
        
        const alreadyCompleted = await isAlreadyCompleted(userId, parseInt(activityId));
        
        await Progress.recordCompletion({
            userId, activityId: parseInt(activityId),
            isCompleted: passed, score,
            timeSpentSeconds: timeSpent || 0, attemptNumber: 1
        });
        
        let xpEarned = 0;
        let coinsEarned = 0;
        if (passed && !alreadyCompleted) {
            xpEarned = Math.round((score / 100) * activity.XPReward);
            coinsEarned = Math.round((score / 100) * activity.CoinReward);
            await Gamification.addXP(userId, xpEarned, parseInt(activityId));
            await Gamification.addCoins(userId, coinsEarned);
        }
        
        await Gamification.updateStreak(userId);
        await Gamification.checkAndAwardBadges(userId);
        
        if (passed) {
            delete req.session.pragmaticsAnswers;
        }
        
        res.json({ success: true, xpEarned, coinsEarned, score, passed, correctCount, totalQ, alreadyCompleted });
    } catch (error) {
        console.error('Submit Pragmatics Error:', error);
        res.status(500).json({ error: 'Error al enviar respuestas de pragmática' });
    }
};

// ── GRAMÁTICA (Parts 4 y 7: Cloze Tests) ────────────────────────────
exports.showGrammar = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        // Determinar la semana
        const weekResult = await executeQuery(
            'SELECT WeekNumber FROM ModuleWeeks MW INNER JOIN Activities A ON MW.WeekID = A.WeekID WHERE A.ActivityID = @ActivityID',
            [{ name: 'ActivityID', type: sql.Int, value: activityId }]
        );
        const weekNumber = weekResult.recordset.length > 0 ? weekResult.recordset[0].WeekNumber : 1;
        
        // Semanas 1-7: Cloze básico (Part 4), Semanas 8+: Cloze avanzado (Part 7)
        const questionType = weekNumber <= 7 ? 'part4_cloze' : 'part7_cloze_advanced';
        
        // Obtener un texto completo con sus preguntas
        const textData = await Module.getRandomTextWithQuestions(questionType);
        if (!textData) return res.status(404).send('No questions found');
        
        const questions = textData.questions;
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        
        const correctAnswers = {};
        const clientQuestions = questions.map(q => {
            const correctOpt = q.Options.find(o => o.IsCorrect);
            if (correctOpt) correctAnswers[q.QuestionID] = correctOpt.OptionID;
            
            return {
                QuestionID: q.QuestionID,
                QuestionText: q.QuestionText,
                QuestionType: q.QuestionType,
                Explanation: q.Explanation,
                Options: shuffleArray(q.Options.map(o => ({
                    OptionID: o.OptionID,
                    OptionText: o.OptionText
                })))
            };
        });
        
        req.session.grammarAnswers = correctAnswers;
        
        res.render('student/grammar', {
            title: questionType === 'part7_cloze_advanced' ? 'Gramática Avanzada' : 'Circuitos y Ensamblaje',
            cssFile: 'grammar.css',
            jsFile: 'grammar.js',
            activity,
            passage: textData.passage,
            passageTitle: textData.title,
            questions: clientQuestions,
            studentStats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Grammar Error:', error);
        res.status(500).send('Error cargando módulo de gramática');
    }
};

exports.submitGrammar = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { activityId, answers, timeSpent } = req.body;
        
        const activity = await Module.getActivity(parseInt(activityId));
        if (!activity) return res.status(400).json({ error: 'Actividad no encontrada' });
        
        const correctAnswers = req.session.grammarAnswers || {};
        const totalQ = Object.keys(correctAnswers).length;
        let correctCount = 0;
        
        const results = [];
        
        if (answers && typeof answers === 'object') {
            Object.entries(answers).forEach(([qId, optId]) => {
                const isCorrect = correctAnswers[qId] === parseInt(optId);
                if (isCorrect) {
                    correctCount++;
                }
                results.push({ questionId: qId, isCorrect });
            });
        }
        
        const score = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
        const passed = score >= 60;
        
        const alreadyCompleted = await isAlreadyCompleted(userId, parseInt(activityId));
        
        await Progress.recordCompletion({
            userId, activityId: parseInt(activityId),
            isCompleted: passed, score,
            timeSpentSeconds: timeSpent || 0, attemptNumber: 1
        });
        
        let xpEarned = 0;
        let coinsEarned = 0;
        if (passed && !alreadyCompleted) {
            xpEarned = Math.round((score / 100) * activity.XPReward);
            coinsEarned = Math.round((score / 100) * activity.CoinReward);
            await Gamification.addXP(userId, xpEarned, parseInt(activityId));
            await Gamification.addCoins(userId, coinsEarned);
        }
        
        await Gamification.updateStreak(userId);
        await Gamification.checkAndAwardBadges(userId);
        
        if (passed) {
            delete req.session.grammarAnswers;
        }
        
        res.json({ success: true, xpEarned, coinsEarned, score, passed, correctCount, totalQ, results, alreadyCompleted });
    } catch (error) {
        console.error('Submit Grammar Error:', error);
        res.status(500).json({ error: 'Error al enviar respuestas de gramática' });
    }
};

// ── BOSS BATTLE (Evaluaciones de Corte) ─────────────────────────────
exports.showBossBattle = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        const student = req.session.user;
        
        const weekResult = await executeQuery(
            'SELECT WeekNumber FROM ModuleWeeks MW INNER JOIN Activities A ON MW.WeekID = A.WeekID WHERE A.ActivityID = @ActivityID',
            [{ name: 'ActivityID', type: sql.Int, value: activityId }]
        );
        const weekNumber = weekResult.recordset.length > 0 ? weekResult.recordset[0].WeekNumber : 4;
        const cutNumber = Math.ceil(weekNumber / 4);
        
        // Seleccionar preguntas aleatorias según el corte
        let questionTypes = [];
        if (cutNumber === 1) {
            // Corte 1: Parts 1, 2, 3 (A1-A2)
            questionTypes = ['part1_notice', 'part2_matching', 'part3_dialogue'];
        } else if (cutNumber === 2) {
            // Corte 2: Parts 4, 5 (A2-B1)
            questionTypes = ['part4_cloze', 'part5_reading'];
        } else {
            // Corte 3: Parts 6, 7 (B1-B2) - Evaluación integral
            questionTypes = ['part6_critical', 'part7_cloze_advanced'];
        }
        
        const questions = await Module.getRandomQuestionsFromPools(questionTypes, 15);
        
        // Map correct answers in session for security verification
        const correctAnswers = {};
        const clientQuestions = questions.map(q => {
            const correctOpt = q.Options.find(o => o.IsCorrect);
            if (correctOpt) {
                correctAnswers[q.QuestionID] = correctOpt.OptionID;
            }
            
            return {
                QuestionID: q.QuestionID,
                QuestionText: q.QuestionText,
                QuestionType: q.QuestionType,
                Explanation: q.Explanation,
                Options: shuffleArray(q.Options.map(o => ({
                    OptionID: o.OptionID,
                    OptionText: o.OptionText
                })))
            };
        });
        
        req.session.bossAnswers = correctAnswers;
        
        res.render('student/boss-battle', {
            title: 'Boss Battle',
            cssFile: 'boss-battle.css',
            jsFile: 'boss-battle.js',
            activity,
            questions: clientQuestions,
            student,
            cutNumber,
            studentStats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Boss Battle Error:', error);
        res.status(500).send('Error cargando Boss Battle');
    }
};

exports.checkBossAnswer = async (req, res) => {
    try {
        const { questionId, optionId } = req.body;
        const correctAnswers = req.session.bossAnswers || {};
        const isCorrect = correctAnswers[questionId] === parseInt(optionId);
        res.json({ isCorrect });
    } catch (error) {
        console.error('Check Boss Answer Error:', error);
        res.status(500).json({ error: 'Error al verificar respuesta' });
    }
};

exports.submitBossBattle = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { activityId, answers, timeSpent, playerHP, bossHP } = req.body;
        
        const activity = await Module.getActivity(parseInt(activityId));
        if (!activity) return res.status(400).json({ error: 'Actividad no encontrada' });
        
        const correctAnswers = req.session.bossAnswers || {};
        let correctCount = 0;
        const totalQuestions = Object.keys(correctAnswers).length;
        
        if (answers && typeof answers === 'object') {
            Object.entries(answers).forEach(([qId, optId]) => {
                if (correctAnswers[qId] === parseInt(optId)) {
                    correctCount++;
                }
            });
        }
        
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = score >= 75;
        
        const alreadyCompleted = await isAlreadyCompleted(userId, parseInt(activityId));
        
        // Save evaluation result
        await Evaluation.saveResult({
            userId, activityId: parseInt(activityId),
            totalScore: score, totalQuestions, correctAnswers: correctCount,
            bossHpDealt: 100 - (bossHP || 0),
            studentHpLost: 100 - (playerHP || 0),
            passed
        });
        
        // Record progress
        await Progress.recordCompletion({
            userId, activityId: parseInt(activityId),
            isCompleted: passed, score,
            timeSpentSeconds: timeSpent || 0, attemptNumber: 1
        });
        
        let xpEarned = 0;
        let coinsEarned = 0;
        if (passed && !alreadyCompleted) {
            xpEarned = activity.XPReward * 2; // double reward for boss battle first time
            coinsEarned = activity.CoinReward * 2;
            await Gamification.addXP(userId, xpEarned, parseInt(activityId));
            await Gamification.addCoins(userId, coinsEarned);
            await Gamification.awardBadge(userId, 4); // Badge ID 4: 'Asesino de Jefes'
        }
        
        await Gamification.updateStreak(userId);
        await Gamification.checkAndAwardBadges(userId);
        
        delete req.session.bossAnswers;
        
        res.json({ success: true, passed, score, correctCount, totalQuestions, xpEarned, coinsEarned, alreadyCompleted });
    } catch (error) {
        console.error('Submit Boss Battle Error:', error);
        res.status(500).json({ error: 'Error al procesar batalla' });
    }
};

exports.awardXP = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { xp, activityId } = req.body;
        await Gamification.addXP(userId, xp || 0, activityId || 0);
        const stats = await Gamification.getStudentStats(userId);
        res.json({ success: true, totalXP: stats.TotalXP, level: stats.Level });
    } catch (error) {
        console.error('Award XP Error:', error);
        res.status(500).json({ error: 'Error al otorgar XP' });
    }
};

exports.getModuleProgress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const moduleId = parseInt(req.params.moduleId);
        const progress = await Progress.getStudentProgress(userId, moduleId);
        const stats = await Gamification.getStudentStats(userId);
        res.json({ moduleId, progress, stats });
    } catch (error) {
        console.error('Get Progress Error:', error);
        res.status(500).json({ error: 'Error al obtener progreso' });
    }
};

// DEV CHEATS: Skip activity or skip entire week
exports.cheatSkipActivity = async (req, res) => {
    try {
        const userId = req.session.userId;
        const activityId = parseInt(req.body.activityId);
        
        await Progress.recordCompletion({
            userId, activityId,
            isCompleted: true, score: 100,
            timeSpentSeconds: 5, attemptNumber: 1
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Cheat Skip Activity Error:', error);
        res.status(500).json({ error: 'Error al saltar actividad' });
    }
};

exports.cheatSkipWeek = async (req, res) => {
    try {
        const userId = req.session.userId;
        const weekId = parseInt(req.body.weekId);
        
        const activities = await Module.getWeekActivities(weekId);
        for (const act of activities) {
            await Progress.recordCompletion({
                userId, activityId: act.ActivityID,
                isCompleted: true, score: 100,
                timeSpentSeconds: 5, attemptNumber: 1
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Cheat Skip Week Error:', error);
        res.status(500).json({ error: 'Error al saltar semana' });
    }
};
