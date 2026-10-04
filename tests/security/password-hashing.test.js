const bcrypt = require('bcryptjs');

describe('Hashing de Contraseñas', () => {
    const password = 'PasswordSeguro123!';
    
    it('debe producir un hash diferente cada vez debido a la sal aleatoria', async () => {
        const hash1 = await bcrypt.hash(password, 12);
        const hash2 = await bcrypt.hash(password, 12);
        expect(hash1).not.toBe(hash2);
    });

    it('debe verificar correctamente la contraseña correcta con bcrypt.compare', async () => {
        const hash = await bcrypt.hash(password, 12);
        const match = await bcrypt.compare(password, hash);
        expect(match).toBe(true);
    });

    it('debe rechazar una contraseña incorrecta con bcrypt.compare', async () => {
        const hash = await bcrypt.hash(password, 12);
        const match = await bcrypt.compare('PasswordIncorrecto', hash);
        expect(match).toBe(false);
    });

    it('el hash debe empezar con $2a$ o $2b$ (formato de bcrypt)', async () => {
        const hash = await bcrypt.hash(password, 12);
        expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it('el hash debe contener el marcador de 12 rondas', async () => {
        const hash = await bcrypt.hash(password, 12);
        expect(hash).toMatch(/^\$2[ab]\$12\$/);
    });

    it('la contraseña en texto plano NO debe estar contenida en la cadena del hash', async () => {
        const hash = await bcrypt.hash(password, 12);
        expect(hash).not.toContain(password);
    });

    it('el proceso de hash debe tomar un tiempo razonable (no instantáneo, indicando aplicación de rondas)', async () => {
        const start = Date.now();
        await bcrypt.hash(password, 12);
        const duration = Date.now() - start;
        // Dependiendo del equipo puede variar, pero 12 rondas toma un tiempo notable
        expect(duration).toBeGreaterThan(10); 
    });
});
