const examController = require('../../../controllers/examController');
const Module = require('../../../models/Module');
const Gamification = require('../../../models/Gamification');
const { executeQuery } = require('../../../config/database');

jest.mock('../../../models/Module', () => ({
    getRandomQuestionsByType: jest.fn(),
    getRandomTextWithQuestions: jest.fn()
}));
jest.mock('../../../models/Gamification', () => ({
    getStudentStats: jest.fn()
}));
jest.mock('../../../config/database', () => ({
    executeQuery: jest.fn().mockResolvedValue({ recordset: [] }),
    sql: {
        Int: 'Int',
        NVarChar: 'NVarChar',
        Decimal: 'Decimal'
    }
}));

describe('Controlador de Exámenes (examController)', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        executeQuery.mockResolvedValue({ recordset: [] });
        mockReq = { 
            session: { 
                userId: 1, 
                user: { UserID: 1, FirstName: 'Juan' }, 
                role: 'student'
            }, 
            body: {}, 
            params: {}, 
            flash: jest.fn() 
        };
        mockRes = { 
            render: jest.fn(), 
            redirect: jest.fn(), 
            status: jest.fn().mockReturnThis(), 
            json: jest.fn(), 
            send: jest.fn() 
        };
    });

    it('showPreTestIntro debería redirigir si el pre-test ya fue completado', async () => {
        executeQuery.mockResolvedValueOnce({ recordset: [{ ExamID: 1 }] });
        await examController.showPreTestIntro(mockReq, mockRes);
        expect(mockRes.redirect).toHaveBeenCalledWith('/student');
    });

    it('showPreTestIntro debería renderizar la introducción si no se ha completado', async () => {
        executeQuery.mockResolvedValueOnce({ recordset: [] }); // No exam yet
        Gamification.getStudentStats.mockResolvedValueOnce({ TotalXP: 100 });
        
        await examController.showPreTestIntro(mockReq, mockRes);
        expect(mockRes.render).toHaveBeenCalledWith('student/exam-intro', expect.objectContaining({
            title: 'Antes de Empezar...'
        }));
    });

    it('showPreTest debería redirigir si ya fue completado, de lo contrario obtiene preguntas aleatorias y almacena respuestas en sesión', async () => {
        executeQuery.mockResolvedValueOnce({ recordset: [] }); // Not completed
        Module.getRandomQuestionsByType
            .mockResolvedValueOnce([{ QuestionID: 1, Options: [{ OptionID: 10, OptionText: 'A', IsCorrect: true }] }])
            .mockResolvedValueOnce([{ QuestionID: 2, Options: [{ OptionID: 20, OptionText: 'B', IsCorrect: true }] }]);
        Module.getRandomTextWithQuestions
            .mockResolvedValueOnce({ title: 'T1', passage: 'P1', questions: [{ QuestionID: 3, Options: [{ OptionID: 30, IsCorrect: true }] }] })
            .mockResolvedValueOnce({ title: 'T2', passage: 'P2', questions: [{ QuestionID: 4, Options: [{ OptionID: 40, IsCorrect: true }] }] });

        await examController.showPreTest(mockReq, mockRes);
        expect(Module.getRandomQuestionsByType).toHaveBeenCalled();
        expect(mockReq.session.examAnswers).toBeDefined();
        expect(mockReq.session.examType).toBe('PRE');
        expect(mockRes.render).toHaveBeenCalledWith('student/exam', expect.objectContaining({
            examType: 'PRE'
        }));
    });

    it('submitExam debería calcular puntajes por competencia correctamente, guardar en base de datos y limpiar la sesión', async () => {
        mockReq.session.examAnswers = { 1: 10, 2: 20 };
        mockReq.session.examType = 'PRE';
        mockReq.body = {
            answers: { 1: 10, 2: 99 }, // 1 correct, 1 wrong
            timeSpent: 120
        };

        // Question types query
        executeQuery
            .mockResolvedValueOnce({ 
                recordset: [
                    { QuestionID: 1, QuestionType: 'part2_matching' },
                    { QuestionID: 2, QuestionType: 'part5_reading' }
                ] 
            })
            // INSERT query
            .mockResolvedValueOnce({ recordset: [] });

        await examController.submitExam(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            totalScore: 50,
            vocabScore: 100,
            readingScore: 0
        }));
        expect(mockReq.session.examAnswers).toBeUndefined();
        expect(mockReq.session.examType).toBeUndefined();
    });
});

