const Module = require('../models/Module');
const Gamification = require('../models/Gamification');
const { executeQuery, sql } = require('../config/database');

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

exports.showPreTest = async (req, res) => {
    try {
        const userId = req.session.userId;

        // Check if user already took the pre-test
        const existingQuery = `SELECT * FROM UserExams WHERE UserID = @UserID AND ExamType = 'PRE'`;
        const existingResult = await executeQuery(existingQuery, [{ name: 'UserID', type: sql.Int, value: userId }]);
        
        if (existingResult.recordset.length > 0) {
            return res.redirect('/student'); // Already completed
        }

        // Fetch Pragmatics and Vocabulary
        const qPrag = await Module.getRandomQuestionsByType('part1_notice', 3, userId, 0);
        const qVocab = await Module.getRandomQuestionsByType('part2_matching', 3, userId, 0);
        const singleQuestions = shuffleArray([...qPrag, ...qVocab]);

        // Fetch 1 full Reading text and 1 full Grammar text
        const readingData = await Module.getRandomTextWithQuestions('part5_reading');
        const clozeData = await Module.getRandomTextWithQuestions('part4_cloze');

        const correctAnswers = {};
        let totalCount = 0;

        // Process Single Questions
        const processedSingles = singleQuestions.map(q => {
            const correctOpt = q.Options.find(o => o.IsCorrect);
            if (correctOpt) correctAnswers[q.QuestionID] = correctOpt.OptionID;
            totalCount++;
            return {
                ...q,
                Options: shuffleArray(q.Options.map(o => ({ OptionID: o.OptionID, OptionText: o.OptionText })))
            };
        });

        // Process Reading
        let processedReading = null;
        if (readingData) {
            processedReading = {
                title: readingData.title,
                passage: readingData.passage,
                questions: readingData.questions.map(q => {
                    const correctOpt = q.Options.find(o => o.IsCorrect);
                    if (correctOpt) correctAnswers[q.QuestionID] = correctOpt.OptionID;
                    totalCount++;
                    return {
                        ...q,
                        Options: shuffleArray(q.Options.map(o => ({ OptionID: o.OptionID, OptionText: o.OptionText })))
                    };
                })
            };
        }

        // Process Grammar (Cloze)
        let processedCloze = null;
        if (clozeData) {
            processedCloze = {
                title: clozeData.title,
                passage: clozeData.passage,
                questions: clozeData.questions.map(q => {
                    const correctOpt = q.Options.find(o => o.IsCorrect);
                    if (correctOpt) correctAnswers[q.QuestionID] = correctOpt.OptionID;
                    totalCount++;
                    return {
                        ...q,
                        Options: q.Options.map(o => ({ OptionID: o.OptionID, OptionText: o.OptionText })) // Not shuffled for dropdown ease
                    };
                })
            };
        }

        req.session.examAnswers = correctAnswers;
        req.session.examType = 'PRE';

        res.render('student/exam', {
            title: 'Pre-Test Diagnóstico',
            cssFile: 'exam.css',
            jsFile: 'exam.js',
            singleQuestions: processedSingles,
            readingData: processedReading,
            clozeData: processedCloze,
            totalQuestions: totalCount,
            examType: 'PRE',
            user: req.session.user
        });
    } catch (error) {
        console.error('Show Pre-Test Error:', error);
        res.status(500).send('Error cargando el examen diagnóstico.');
    }
};

exports.submitExam = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { answers, timeSpent } = req.body;
        const correctAnswers = req.session.examAnswers || {};
        const examType = req.session.examType || 'PRE';

        if (Object.keys(correctAnswers).length === 0) {
            return res.status(400).json({ error: 'Sesión de examen expirada' });
        }

        let vocabCorrect = 0, pragCorrect = 0, readingCorrect = 0, grammarCorrect = 0;
        let vocabTotal = 0, pragTotal = 0, readingTotal = 0, grammarTotal = 0;

        // Note: we need the original QuestionTypes to classify the scores.
        // We can infer them by keeping them in session or re-querying.
        // For simplicity, re-query the question types from DB for the answered questions.
        const qIds = Object.keys(correctAnswers).join(',');
        const qTypesResult = await executeQuery(`SELECT QuestionID, QuestionType FROM Questions WHERE QuestionID IN (${qIds})`);
        
        const qTypeMap = {};
        qTypesResult.recordset.forEach(row => {
            qTypeMap[row.QuestionID] = row.QuestionType;
        });

        if (answers && typeof answers === 'object') {
            Object.entries(correctAnswers).forEach(([qId, correctOptId]) => {
                const userOptId = parseInt(answers[qId]);
                const isCorrect = correctOptId === userOptId;
                const type = qTypeMap[qId];

                if (type && type.includes('part2')) { vocabTotal++; if(isCorrect) vocabCorrect++; }
                else if (type && (type.includes('part5') || type.includes('part6'))) { readingTotal++; if(isCorrect) readingCorrect++; }
                else if (type && (type.includes('part1') || type.includes('part3'))) { pragTotal++; if(isCorrect) pragCorrect++; }
                else if (type && (type.includes('part4') || type.includes('part7'))) { grammarTotal++; if(isCorrect) grammarCorrect++; }
                else { grammarTotal++; if(isCorrect) grammarCorrect++; } // fallback
            });
        }

        const calcScore = (c, t) => t > 0 ? Math.round((c / t) * 100) : 0;

        const totalC = vocabCorrect + pragCorrect + readingCorrect + grammarCorrect;
        const totalT = vocabTotal + pragTotal + readingTotal + grammarTotal;

        const totalScore = calcScore(totalC, totalT);
        const vocabScore = calcScore(vocabCorrect, vocabTotal);
        const pragScore = calcScore(pragCorrect, pragTotal);
        const readingScore = calcScore(readingCorrect, readingTotal);
        const grammarScore = calcScore(grammarCorrect, grammarTotal);

        // Save to UserExams
        const insertQuery = `
            INSERT INTO UserExams (UserID, ExamType, TotalScore, VocabularyScore, PragmaticsScore, ReadingScore, GrammarScore, TimeSpentSeconds)
            VALUES (@UserID, @ExamType, @TotalScore, @VocabScore, @PragScore, @ReadingScore, @GrammarScore, @TimeSpent)
        `;
        const params = [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'ExamType', type: sql.NVarChar, value: examType },
            { name: 'TotalScore', type: sql.Decimal, value: totalScore },
            { name: 'VocabScore', type: sql.Decimal, value: vocabScore },
            { name: 'PragScore', type: sql.Decimal, value: pragScore },
            { name: 'ReadingScore', type: sql.Decimal, value: readingScore },
            { name: 'GrammarScore', type: sql.Decimal, value: grammarScore },
            { name: 'TimeSpent', type: sql.Int, value: timeSpent || 0 }
        ];

        await executeQuery(insertQuery, params);

        delete req.session.examAnswers;
        delete req.session.examType;

        res.json({ success: true, totalScore, vocabScore, pragScore, readingScore, grammarScore });

    } catch (error) {
        console.error('Submit Exam Error:', error);
        res.status(500).json({ error: 'Error al enviar examen' });
    }
};
