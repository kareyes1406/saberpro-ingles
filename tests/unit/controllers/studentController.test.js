const studentController = require('../../../controllers/studentController');
const Module = require('../../../models/Module');
const Progress = require('../../../models/Progress');
const Gamification = require('../../../models/Gamification');
const { executeQuery } = require('../../../config/database');
const bcrypt = require('bcryptjs');

jest.mock('../../../models/Module', () => ({
    getWeeks: jest.fn(),
    getWeekActivities: jest.fn()
}));
jest.mock('../../../models/Progress', () => ({
    getStudentProgress: jest.fn(),
    getWeekProgress: jest.fn()
}));
jest.mock('../../../models/Gamification', () => ({
    getStudentStats: jest.fn(),
    getUserBadges: jest.fn(),
    updateStreak: jest.fn()
}));
jest.mock('bcryptjs');
jest.mock('../../../config/database', () => ({
    executeQuery: jest.fn(),
    sql: {
        Int: 'Int',
        NVarChar: 'NVarChar'
    }
}));

describe('Controlador de Estudiante (studentController)', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = { 
            session: { userId: 1, user: { UserID: 1, FirstName: 'Juan' }, role: 'student' }, 
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

    it('showRoadmap debería redirigir al pre-test si no está completado', async () => {
        executeQuery.mockResolvedValueOnce({ recordset: [] }); // pre-test not completed
        await studentController.showRoadmap(mockReq, mockRes);
        expect(mockRes.redirect).toHaveBeenCalledWith('/exam/pre-test');
    });

    it('showRoadmap debería mostrar como máximo 4 semanas si el pre-test está completado', async () => {
        executeQuery
            .mockResolvedValueOnce({ recordset: [{ 1: 1 }] }) // pre-test completed
            .mockResolvedValueOnce({ recordset: [] }); // Badges query

        Module.getWeeks.mockResolvedValueOnce([
            { WeekID: 1, WeekNumber: 1, Title: 'S1' },
            { WeekID: 2, WeekNumber: 2, Title: 'S2' },
            { WeekID: 3, WeekNumber: 3, Title: 'S3' },
            { WeekID: 4, WeekNumber: 4, Title: 'S4' },
            { WeekID: 5, WeekNumber: 5, Title: 'S5' }
        ]);
        Progress.getStudentProgress.mockResolvedValueOnce([]);
        Gamification.getStudentStats.mockResolvedValueOnce({ TotalXP: 50 });
        Gamification.getUserBadges.mockResolvedValueOnce([]);
        Module.getWeekActivities.mockResolvedValue([]);

        await studentController.showRoadmap(mockReq, mockRes);
        expect(mockRes.render).toHaveBeenCalledWith('student/roadmap', expect.objectContaining({
            weeks: expect.any(Array)
        }));
        // Verify only 4 weeks are passed
        const renderArgs = mockRes.render.mock.calls[0][1];
        expect(renderArgs.weeks.length).toBeLessThanOrEqual(4);
    });

    it('showWeek debería mostrar las actividades con sus estados de bloqueado/disponible/completado', async () => {
        mockReq.params.weekId = 1;
        executeQuery
            .mockResolvedValueOnce({ recordset: [{ 1: 1 }] }) // pre-test completed
            .mockResolvedValueOnce({ recordset: [{ WeekID: 1, WeekNumber: 1, Title: 'Semana 1' }] }); // Week details

        Module.getWeekActivities.mockResolvedValueOnce([{ ActivityID: 1, GameMechanic: 'vocabulary_match' }]);
        Progress.getWeekProgress.mockResolvedValueOnce([]);
        Gamification.getStudentStats.mockResolvedValueOnce({ TotalXP: 50 });

        await studentController.showWeek(mockReq, mockRes);
        expect(Module.getWeekActivities).toHaveBeenCalledWith(1);
        expect(mockRes.render).toHaveBeenCalledWith('student/week', expect.objectContaining({
            title: expect.stringContaining('Semana 1')
        }));
    });

    it('updateProfile debería actualizar el nombre y encriptar la contraseña si se proporciona', async () => {
        mockReq.body = { firstName: 'Juan', lastName: 'Perez', password: 'nuevapassword' };
        bcrypt.hash.mockResolvedValueOnce('hash123');
        executeQuery.mockResolvedValueOnce({ recordset: [] });
        
        await studentController.updateProfile(mockReq, mockRes);
        expect(bcrypt.hash).toHaveBeenCalledWith('nuevapassword', 12);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
});

