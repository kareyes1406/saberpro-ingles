const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const { createTestServer } = require('../helpers/requestHelper');

describe('Protección de Autenticación y Autorización', () => {
    let app, testServer;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
            name: 'sessionId'
        }));

        const requireAuth = (req, res, next) => {
            if (req.session && req.session.userId) return next();
            res.redirect('/auth/login');
        };

        const requireAdmin = (req, res, next) => {
            if (req.session && req.session.userId && req.session.role === 'admin') return next();
            res.redirect('/auth/login');
        };

        const requireProfessor = (req, res, next) => {
            if (req.session && req.session.userId && req.session.role === 'professor') return next();
            res.redirect('/auth/login');
        };

        const loginLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 5,
            message: 'Demasiados intentos'
        });

        app.get('/student', requireAuth, (req, res) => res.send('OK'));
        app.get('/admin/dashboard', requireAdmin, (req, res) => res.send('OK'));
        app.get('/professor/dashboard', requireProfessor, (req, res) => res.send('OK'));
        app.post('/auth/login', loginLimiter, (req, res) => res.status(401).send('Invalid'));
        app.post('/auth/logout', (req, res) => {
            res.clearCookie('sessionId');
            req.session.destroy(() => res.redirect('/auth/login'));
        });

        testServer = createTestServer(app);
        await testServer.start();
    });

    afterAll(async () => {
        if (testServer) await testServer.stop();
    });

    it('GET /student sin sesión debe redirigir a /auth/login', async () => {
        const response = await testServer.request('/student');
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/auth/login');
    });

    it('GET /admin/dashboard sin sesión debe redirigir a /auth/login', async () => {
        const response = await testServer.request('/admin/dashboard');
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/auth/login');
    });

    it('GET /professor/dashboard sin sesión debe redirigir a /auth/login', async () => {
        const response = await testServer.request('/professor/dashboard');
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/auth/login');
    });

    it('POST /auth/logout debe limpiar cookie y redirigir', async () => {
        const response = await testServer.request('/auth/logout', { method: 'POST' });
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/auth/login');
    });

    it('El limitador de tasa en /auth/login debe bloquear tras 5 intentos (HTTP 429)', async () => {
        let rateLimitHit = false;
        for (let i = 0; i < 7; i++) {
            const res = await testServer.request('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
            });
            if (res.status === 429) {
                rateLimitHit = true;
                break;
            }
        }
        expect(rateLimitHit).toBe(true);
    });
});
