const authController = require('../../../controllers/authController');
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');

jest.mock('../../../models/User');
jest.mock('bcryptjs');
jest.mock('../../../services/emailService', () => ({
    sendVerificationPin: jest.fn().mockResolvedValue(true)
}));
jest.mock('../../../config/database', () => ({
    executeQuery: jest.fn(),
    sql: {}
}));

describe('Controlador de Autenticación (authController)', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = { 
            session: { 
                destroy: jest.fn((cb) => { if(cb) cb(); }),
                regenerate: jest.fn((cb) => { if(cb) cb(); })
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
            send: jest.fn(),
            clearCookie: jest.fn()
        };
    });

    it('showLogin debería renderizar la vista de inicio de sesión', () => {
        authController.showLogin(mockReq, mockRes);
        expect(mockRes.render).toHaveBeenCalledWith('auth/login', expect.any(Object));
    });

    it('processLogin debería validar campos vacíos y rechazar', async () => {
        await authController.processLogin(mockReq, mockRes);
        expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
        expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
    });

    it('processLogin debería fallar con contraseña incorrecta (bcrypt.compare en false)', async () => {
        mockReq.body = { email: 'test@test.com', password: 'wrong' };
        User.findByEmail.mockResolvedValue({ UserID: 1, PasswordHash: 'hash', IsActive: true });
        bcrypt.compare.mockResolvedValue(false);

        await authController.processLogin(mockReq, mockRes);
        expect(mockReq.flash).toHaveBeenCalledWith('error', expect.any(String));
        expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
    });

    it('processLogin debería fallar si el usuario está inactivo', async () => {
        mockReq.body = { email: 'test@test.com', password: 'password' };
        User.findByEmail.mockResolvedValue({ UserID: 1, PasswordHash: 'hash', IsActive: false });
        bcrypt.compare.mockResolvedValue(true);

        await authController.processLogin(mockReq, mockRes);
        expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
    });

    it('processLogin debería establecer la sesión para un inicio de sesión exitoso', async () => {
        mockReq.body = { email: 'test@test.com', password: 'password' };
        User.findByEmail.mockResolvedValue({ UserID: 1, RoleID: 1, IsActive: true, PasswordHash: 'hash', FirstName: 'Juan', LastName: 'Perez', Email: 'test@test.com' });
        User.updateLastLogin.mockResolvedValue();
        bcrypt.compare.mockResolvedValue(true);
        const { executeQuery } = require('../../../config/database');
        executeQuery.mockResolvedValue({ recordset: [{ RoleName: 'student' }] });

        await authController.processLogin(mockReq, mockRes);
        expect(mockReq.session.userId).toBe(1);
        expect(mockRes.redirect).toHaveBeenCalledWith('/student');
    });

    it('processRegister debería validar los requisitos de contraseña', async () => {
        mockReq.body = { firstName: 'Juan', lastName: 'Perez', email: 'test@test.com', password: 'pass', confirmPassword: 'diff' };
        await authController.processRegister(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('processRegister debería registrar un usuario exitosamente con bcrypt.hash(pw, 12)', async () => {
        mockReq.body = { 
            firstName: 'Juan', 
            lastName: 'Perez', 
            email: 'test@test.com', 
            password: 'Password123!', 
            confirmPassword: 'Password123!' 
        };
        User.findByEmail.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashedpass');
        User.create.mockResolvedValue({ UserID: 1 });
        User.saveVerificationPin.mockResolvedValue();
        const { executeQuery } = require('../../../config/database');
        executeQuery.mockResolvedValue({ recordset: [{ RoleID: 1 }] });

        await authController.processRegister(mockReq, mockRes);
        expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
        expect(User.create).toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, requiresPin: true }));
    });

    it('verifyPin debería activar al usuario si el PIN es correcto', async () => {
        mockReq.body = { email: 'test@test.com', pin: '123456' };
        User.findByEmail.mockResolvedValue({ UserID: 1 });
        const { executeQuery } = require('../../../config/database');
        executeQuery.mockResolvedValue({ 
            recordset: [{ VerificationPin: '123456', PinExpiry: new Date(Date.now() + 100000) }] 
        });
        User.activateUser.mockResolvedValue();
        
        await authController.verifyPin(mockReq, mockRes);
        expect(User.activateUser).toHaveBeenCalledWith(1);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('logout debería destruir la sesión y limpiar la cookie de sesión', () => {
        authController.logout(mockReq, mockRes);
        expect(mockRes.clearCookie).toHaveBeenCalledWith('sessionId');
        expect(mockReq.session.destroy).toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
    });
});
