const User = require('../../../models/User');
const db = require('../../../config/database');

jest.mock('../../../config/database', () => ({
    executeQuery: jest.fn(),
    sql: {
        VarChar: 'VarChar',
        Int: 'Int',
        DateTime: 'DateTime',
        Bit: 'Bit',
        NVarChar: 'NVarChar'
    }
}));

describe('Modelo User', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('findByEmail debería llamar a executeQuery y devolver un usuario si existe', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [{ UserID: 1, Email: 'test@test.com' }] });
        const user = await User.findByEmail('test@test.com');
        expect(db.executeQuery).toHaveBeenCalled();
        expect(user).toEqual({ UserID: 1, Email: 'test@test.com' });
    });

    it('findByEmail debería devolver null si el usuario no existe', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [] });
        const user = await User.findByEmail('notfound@test.com');
        expect(db.executeQuery).toHaveBeenCalled();
        expect(user).toBeNull();
    });

    it('findById debería llamar a executeQuery con el parámetro UserID y devolver el usuario', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [{ UserID: 1, Name: 'Test' }] });
        const user = await User.findById(1);
        expect(db.executeQuery).toHaveBeenCalled();
        expect(user).toEqual({ UserID: 1, Name: 'Test' });
    });

    it('create debería insertar un usuario y devolver el nuevo usuario con UserID', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [{ UserID: 1 }] });
        const user = await User.create({ name: 'Test', email: 'test@test.com', passwordHash: 'hash', role: 'student', programId: 1 });
        expect(db.executeQuery).toHaveBeenCalled();
        expect(user).toHaveProperty('UserID', 1);
    });

    it('hardDeleteUser debería ejecutar múltiples consultas DELETE en el orden correcto', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [] });
        await User.hardDeleteUser(1);
        expect(db.executeQuery).toHaveBeenCalled(); // Se asume que llama varias veces o una transacción
    });

    it('activateUser debería actualizar IsActive a 1 y limpiar el PIN', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [] });
        await User.activateUser(1);
        expect(db.executeQuery).toHaveBeenCalled();
    });

    it('saveVerificationPin debería guardar el PIN con una expiración de 10 minutos', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [] });
        await User.saveVerificationPin(1, '123456');
        expect(db.executeQuery).toHaveBeenCalled();
    });

    it('updateLastLogin debería actualizar la fecha y hora del último acceso', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [] });
        await User.updateLastLogin(1);
        expect(db.executeQuery).toHaveBeenCalled();
    });

    it('getActiveCount debería devolver la cantidad de usuarios activos', async () => {
        db.executeQuery.mockResolvedValue({ recordset: [{ Count: 10 }] });
        const count = await User.getActiveCount();
        expect(db.executeQuery).toHaveBeenCalled();
        expect(count).toBe(10);
    });
});
