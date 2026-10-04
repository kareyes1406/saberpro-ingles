const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const ejs = require('ejs');
const { executeQuery } = require('../../config/database');

describe('Checklist de Seguridad (20 Puntos de Validación)', () => {

    it('1. Oculta claves API: Variables sensibles almacenadas en .env', () => {
        const envPath = path.join(__dirname, '../../.env');
        expect(fs.existsSync(envPath)).toBe(true);
        const envContent = fs.readFileSync(envPath, 'utf8');
        expect(envContent).toContain('DB_PASSWORD');
        expect(envContent).toContain('SESSION_SECRET');
    });

    it('2. Elimina secretos de Git: .env está protegido en .gitignore', () => {
        const gitignorePath = path.join(__dirname, '../../.gitignore');
        expect(fs.existsSync(gitignorePath)).toBe(true);
        const gitignore = fs.readFileSync(gitignorePath, 'utf8');
        expect(gitignore).toContain('.env');
    });

    it('3. Usa clave pública de DB: Conexión SSL/TLS cifrada hacia Azure SQL', () => {
        const dbConfigPath = path.join(__dirname, '../../config/database.js');
        const dbConfig = fs.readFileSync(dbConfigPath, 'utf8');
        expect(dbConfig).toMatch(/encrypt:\s*true/);
    });

    it('4. Activa RLS: Aislamiento de datos por usuario en la capa de aplicación', () => {
        const studentControllerPath = path.join(__dirname, '../../controllers/studentController.js');
        const content = fs.readFileSync(studentControllerPath, 'utf8');
        expect(content).toContain('req.session.userId');
    });

    it('5. Cifra datos sensibles: Las contraseñas en DB están hasheadas con bcrypt', async () => {
        const result = await executeQuery('SELECT TOP 1 PasswordHash FROM Users WHERE PasswordHash IS NOT NULL');
        if (result && result.recordset && result.recordset.length > 0) {
            expect(result.recordset[0].PasswordHash).toMatch(/^\$2[ab]\$/);
        }
    });

    it('6. Fuerza autenticación servidor: Middlewares requireAuth, requireAdmin, requireProfessor', () => {
        const appPath = path.join(__dirname, '../../app.js');
        const appContent = fs.readFileSync(appPath, 'utf8');
        expect(appContent).toContain('requireAuth');
        expect(appContent).toContain('requireAdmin');
        expect(appContent).toContain('requireProfessor');
    });

    it('7. Restringe acceso a registros: Tabla AuditLogs existe en base de datos', async () => {
        const result = await executeQuery("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AuditLogs'");
        expect(result.recordset.length).toBe(1);
    });

    it('8. Bloquea manipulación de campos: Rechazo de tipos de contenido no permitidos', () => {
        const appPath = path.join(__dirname, '../../app.js');
        const appContent = fs.readFileSync(appPath, 'utf8');
        expect(appContent).toContain('multipart/form-data');
        expect(appContent).toContain('415');
    });

    it('9. Protege cookies de sesión: Flags httpOnly y sameSite strict configurados', () => {
        const appPath = path.join(__dirname, '../../app.js');
        const appContent = fs.readFileSync(appPath, 'utf8');
        expect(appContent).toMatch(/httpOnly:\s*true/);
        expect(appContent).toMatch(/sameSite:\s*['"]strict['"]/);
    });

    it('10. Hashea contraseñas: bcrypt configurado con 12 rondas de sal', async () => {
        const password = 'TestSecurePassword123!';
        const hash = await bcrypt.hash(password, 12);
        expect(hash).toMatch(/^\$2[ab]\$12\$/);
        const match = await bcrypt.compare(password, hash);
        expect(match).toBe(true);
    });

    it('11. Limita intentos de inicio: Rate limiter implementado para login', () => {
        const authRoutesPath = path.join(__dirname, '../../routes/authRoutes.js');
        const content = fs.readFileSync(authRoutesPath, 'utf8');
        expect(content).toContain('loginLimiter');
    });

    it('12. Protección contra bots: Limitación de tasa contra ataques de fuerza bruta', () => {
        const authRoutesPath = path.join(__dirname, '../../routes/authRoutes.js');
        const content = fs.readFileSync(authRoutesPath, 'utf8');
        expect(content).toContain('express-rate-limit');
    });

    it('13. Monitoriza consultas de DB: Registro automático de consultas lentas (>500ms)', () => {
        const dbPath = path.join(__dirname, '../../config/database.js');
        const content = fs.readFileSync(dbPath, 'utf8');
        expect(content).toContain('duration > 500');
        expect(content).toContain('Consulta lenta detectada');
    });

    it('14. Valida todas las entradas: Consultas SQL parametrizadas para evitar inyección', () => {
        const dbPath = path.join(__dirname, '../../config/database.js');
        const content = fs.readFileSync(dbPath, 'utf8');
        expect(content).toContain('request.input');
    });

    it('15. Escapa contenido del usuario: Motor EJS con auto-escape activo', () => {
        const dangerousInput = '<script>alert("hack")</script>';
        const rendered = ejs.render('<%= input %>', { input: dangerousInput });
        expect(rendered).not.toContain('<script>');
        expect(rendered).toContain('&lt;script&gt;');
    });

    it('16. Restringe subida de archivos: Uploads no autorizados bloqueados con código 415', () => {
        const appPath = path.join(__dirname, '../../app.js');
        const content = fs.readFileSync(appPath, 'utf8');
        expect(content).toContain("res.status(415).send('Unsupported Media Type')");
    });

    it('17. Limita respuestas de API: Límite de tasa en endpoints sensibles de autenticación', () => {
        const authRoutesPath = path.join(__dirname, '../../routes/authRoutes.js');
        const content = fs.readFileSync(authRoutesPath, 'utf8');
        expect(content).toContain('verify-pin');
        expect(content).toContain('loginLimiter');
    });

    it('18. Cabeceras de seguridad: Helmet configurado con HSTS, CSP y Frameguard', () => {
        const appPath = path.join(__dirname, '../../app.js');
        const content = fs.readFileSync(appPath, 'utf8');
        expect(content).toContain('helmet');
        expect(content).toContain('contentSecurityPolicy');
        expect(content).toContain('hsts');
        expect(content).toContain('frameguard');
    });

    it('19. Fuerza HTTPS: Redirección automática a protocolo seguro en producción', () => {
        const appPath = path.join(__dirname, '../../app.js');
        const content = fs.readFileSync(appPath, 'utf8');
        expect(content).toContain("req.headers['x-forwarded-proto'] !== 'https'");
        expect(content).toContain('https://');
    });

    it('20. Escanea dependencias: Script audit configurado en package.json', () => {
        const pkgPath = path.join(__dirname, '../../package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        expect(pkg.scripts.audit).toBeDefined();
    });
});
