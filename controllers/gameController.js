/**
 * controllers/gameController.js
 * Controlador de Mecánicas de Juego
 * Vocabulario (Tycoon), Lectura (D&D), Boss Battle
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

exports.showVocabulary = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        const questions = await Module.getQuestions(activityId);
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        
        // Prepare vocabulary pairs: QuestionText = Spanish, correct option = English
        const pairs = questions.map(q => ({
            QuestionID: q.QuestionID,
            QuestionText: q.QuestionText,
            CorrectOption: q.Options.find(o => o.IsCorrect) || q.Options[0]
        }));
        
        // Shuffle the English options for display
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
        
        // Find total questions for this activity to calculate score
        const questions = await Module.getQuestions(parseInt(activityId));
        const totalQ = questions.length;
        const matchedPairs = parseInt(req.body.matchedPairs || 0);
        
        const score = totalQ > 0 ? Math.round((matchedPairs / totalQ) * 100) : 100;
        const passed = score >= 60;
        
        // Check if user already completed this submodule successfully
        const alreadyCompleted = await isAlreadyCompleted(userId, parseInt(activityId));
        
        // Record progress (always save attempts)
        await Progress.recordCompletion({
            userId, activityId: parseInt(activityId),
            isCompleted: passed, score,
            timeSpentSeconds: timeSpent || 0, attemptNumber: 1
        });
        
        let xpEarned = 0;
        let coinsEarned = 0;
        
        // ONLY award XP and coins on the FIRST successful completion
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

exports.showReading = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        const questions = await Module.getQuestions(activityId);
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        
        const textBlocks = [];
        if (questions.length > 0) {
            const q = questions[0];
            q.Options.forEach(opt => {
                textBlocks.push({
                    OptionID: opt.OptionID,
                    OptionText: opt.OptionText,
                    SortOrder: opt.SortOrder
                });
            });
        }
        
        const shuffledBlocks = shuffleArray(textBlocks);
        
        res.render('student/reading', {
            title: 'Línea de Ensamblaje Lógico',
            cssFile: 'reading.css',
            jsFile: 'reading.js',
            activity,
            shuffledBlocks,
            studentStats,
            user: req.session.user
        });
    } catch (error) {
        console.error('Reading Error:', error);
        res.status(500).send('Error cargando lectura lógica');
    }
};

exports.submitReading = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { activityId, arrangement, timeSpent } = req.body;
        
        const activity = await Module.getActivity(parseInt(activityId));
        if (!activity) return res.status(400).json({ error: 'Actividad no encontrada' });
        
        const questions = await Module.getQuestions(parseInt(activityId));
        let correctCount = 0;
        let totalBlocks = 0;
        
        if (questions.length > 0 && arrangement) {
            const correctOrder = questions[0].Options.sort((a, b) => a.SortOrder - b.SortOrder);
            totalBlocks = correctOrder.length;
            
            arrangement.forEach((optId, index) => {
                if (correctOrder[index] && correctOrder[index].OptionID === parseInt(optId)) {
                    correctCount++;
                }
            });
        }
        
        const score = totalBlocks > 0 ? Math.round((correctCount / totalBlocks) * 100) : 0;
        const passed = score >= 60;
        
        // Check if user already completed this submodule successfully
        const alreadyCompleted = await isAlreadyCompleted(userId, parseInt(activityId));
        
        await Progress.recordCompletion({
            userId, activityId: parseInt(activityId),
            isCompleted: passed, score,
            timeSpentSeconds: timeSpent || 0, attemptNumber: 1
        });
        
        let xpEarned = 0;
        
        // ONLY award XP on first completion
        if (passed && !alreadyCompleted) {
            xpEarned = Math.round((score / 100) * activity.XPReward);
            await Gamification.addXP(userId, xpEarned, parseInt(activityId));
        }
        
        await Gamification.updateStreak(userId);
        await Gamification.checkAndAwardBadges(userId);
        
        res.json({ success: true, xpEarned, score, correctCount, totalBlocks, passed, alreadyCompleted });
    } catch (error) {
        console.error('Submit Reading Error:', error);
        res.status(500).json({ error: 'Error al verificar ensamblaje' });
    }
};

exports.showPragmatics = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        const questions = await Module.getQuestions(activityId);
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        
        // Shuffle the options so they aren't pre-matched
        let allOptions = [];
        questions.forEach(q => {
            q.Options.forEach(o => {
                allOptions.push({
                    OptionID: o.OptionID,
                    OptionText: o.OptionText,
                    IsCorrect: o.IsCorrect
                });
            });
        });
        const shuffledOptions = shuffleArray(allOptions);
        
        res.render('student/pragmatics', {
            title: 'El Coordinador Urbano',
            cssFile: 'pragmatics.css',
            jsFile: 'pragmatics.js',
            activity,
            questions,
            shuffledOptions,
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
        const { activityId, matches, timeSpent } = req.body;
        
        const activity = await Module.getActivity(parseInt(activityId));
        if (!activity) return res.status(400).json({ error: 'Actividad no encontrada' });
        
        const questions = await Module.getQuestions(parseInt(activityId));
        const totalQ = questions.length;
        let correctCount = 0;
        
        if (matches && typeof matches === 'object') {
            Object.entries(matches).forEach(([qId, optId]) => {
                const question = questions.find(q => q.QuestionID === parseInt(qId));
                if (question) {
                    const correctOpt = question.Options.find(o => o.IsCorrect);
                    if (correctOpt && correctOpt.OptionID === parseInt(optId)) {
                        correctCount++;
                    }
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
        
        res.json({ success: true, xpEarned, coinsEarned, score, passed, correctCount, totalQ, alreadyCompleted });
    } catch (error) {
        console.error('Submit Pragmatics Error:', error);
        res.status(500).json({ error: 'Error al enviar respuestas de pragmática' });
    }
};

exports.showGrammar = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        const questions = await Module.getQuestions(activityId);
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        
        const clientQuestions = questions.map(q => {
            return {
                QuestionID: q.QuestionID,
                QuestionText: q.QuestionText,
                Options: shuffleArray(q.Options.map(o => ({
                    OptionID: o.OptionID,
                    OptionText: o.OptionText
                })))
            };
        });
        
        res.render('student/grammar', {
            title: 'Circuitos y Ensamblaje',
            cssFile: 'grammar.css',
            jsFile: 'grammar.js',
            activity,
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
        
        const questions = await Module.getQuestions(parseInt(activityId));
        const totalQ = questions.length;
        let correctCount = 0;
        
        const results = [];
        
        if (answers && typeof answers === 'object') {
            Object.entries(answers).forEach(([qId, optId]) => {
                const question = questions.find(q => q.QuestionID === parseInt(qId));
                let isCorrect = false;
                if (question) {
                    const correctOpt = question.Options.find(o => o.IsCorrect);
                    if (correctOpt && correctOpt.OptionID === parseInt(optId)) {
                        correctCount++;
                        isCorrect = true;
                    }
                }
                results.push({ questionId: qId, isCorrect });
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
        
        res.json({ success: true, xpEarned, coinsEarned, score, passed, correctCount, totalQ, results, alreadyCompleted });
    } catch (error) {
        console.error('Submit Grammar Error:', error);
        res.status(500).json({ error: 'Error al enviar respuestas de gramática' });
    }
};

exports.showBossBattle = async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const userId = req.session.userId;
        
        const activity = await Module.getActivity(activityId);
        if (!activity) return res.redirect('/student');
        
        const questions = await Module.getQuestions(activityId);
        const studentStats = await Gamification.getStudentStats(userId) || { TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0 };
        const student = req.session.user;
        
        const weekResult = await executeQuery(
            'SELECT WeekNumber FROM ModuleWeeks MW INNER JOIN Activities A ON MW.WeekID = A.WeekID WHERE A.ActivityID = @ActivityID',
            [{ name: 'ActivityID', type: sql.Int, value: activityId }]
        );
        const cutNumber = weekResult.recordset.length > 0 ? Math.ceil(weekResult.recordset[0].WeekNumber / 4) : 1;
        
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
        if (passed && !alreadyCompleted) {
            xpEarned = activity.XPReward * 2; // double reward for boss battle first time
            await Gamification.addXP(userId, xpEarned, parseInt(activityId));
            await Gamification.awardBadge(userId, 4); // Badge ID 4: 'Asesino de Jefes'
        }
        
        await Gamification.updateStreak(userId);
        await Gamification.checkAndAwardBadges(userId);
        
        delete req.session.bossAnswers;
        
        res.json({ success: true, passed, score, correctCount, totalQuestions, xpEarned, alreadyCompleted });
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
