const Module = require('../../../models/Module');
const db = require('../../../config/database');

jest.mock('../../../config/database', () => ({
    executeQuery: jest.fn(),
    sql: {
        Int: 'Int',
        VarChar: 'VarChar'
    }
}));

describe('Modelo Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getWeeks debería devolver las semanas ordenadas por WeekNumber', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [{ WeekID: 1, WeekNumber: 1 }, { WeekID: 2, WeekNumber: 2 }] });
        const weeks = await Module.getWeeks(1);
        expect(db.executeQuery).toHaveBeenCalled();
        expect(weeks).toHaveLength(2);
        expect(weeks[0].WeekNumber).toBe(1);
    });

    it('getWeekActivities debería devolver las actividades con sus tipos', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [{ ActivityID: 1, Type: 'grammar' }] });
        const activities = await Module.getWeekActivities(1);
        expect(db.executeQuery).toHaveBeenCalled();
        expect(activities).toHaveLength(1);
    });

    it('getRandomQuestionsByType debería devolver preguntas agrupadas por tipo', async () => {
        const mockData = [
            { QuestionID: 1, QuestionText: 'Q1', OptionID: 1, OptionText: 'A', IsCorrect: true },
            { QuestionID: 1, QuestionText: 'Q1', OptionID: 2, OptionText: 'B', IsCorrect: false }
        ];
        db.executeQuery.mockResolvedValue({ recordset: mockData });
        
        const questions = await Module.getRandomQuestionsByType('grammar', 10, 1, 1);
        expect(db.executeQuery).toHaveBeenCalled();
        expect(questions).toHaveLength(1);
        expect(questions[0].Options).toHaveLength(2);
    });

    it('_groupQuestions debería agrupar correctamente filas planas en objetos de preguntas con un arreglo de opciones', () => {
        const input = [
            { QuestionID: 1, QuestionText: 'Q1', OptionID: 1, OptionText: 'A', IsCorrect: true },
            { QuestionID: 1, QuestionText: 'Q1', OptionID: 2, OptionText: 'B', IsCorrect: false }
        ];
        
        const output = Module._groupQuestions(input);
        
        expect(output).toHaveLength(1);
        expect(output[0]).toMatchObject({
            QuestionID: 1,
            QuestionText: 'Q1',
            Options: [
                { OptionID: 1, OptionText: 'A', IsCorrect: true },
                { OptionID: 2, OptionText: 'B', IsCorrect: false }
            ]
        });
    });

    it('getRandomTextWithQuestions debería devolver un pasaje de texto con sus preguntas', async () => {
        db.executeQuery
            .mockResolvedValueOnce({ recordset: [{ MediaUrl: 'Title', ReadingPassage: 'Content' }] })
            .mockResolvedValueOnce({ recordset: [{ QuestionID: 1, QuestionText: 'Q1', OptionID: 1, OptionText: 'A', IsCorrect: true }] });
        
        const passage = await Module.getRandomTextWithQuestions('part5_reading');
        expect(db.executeQuery).toHaveBeenCalled();
        expect(passage).toHaveProperty('title', 'Title');
        expect(passage).toHaveProperty('passage', 'Content');
        expect(passage.questions).toHaveLength(1);
    });
});
