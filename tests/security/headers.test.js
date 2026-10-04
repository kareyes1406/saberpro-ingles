const express = require('express');
const helmet = require('helmet');
const { createTestServer } = require('../helpers/requestHelper');

describe('Cabeceras de Seguridad (Security Headers)', () => {
    let testServer;

    beforeAll(async () => {
        const app = express();
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            },
            frameguard: { action: 'deny' },
            hidePoweredBy: true
        }));
        app.get('/', (req, res) => res.send('OK'));

        testServer = createTestServer(app);
        await testServer.start();
    });

    afterAll(async () => {
        if (testServer) {
            await testServer.stop();
        }
    });

    it('debe tener las cabeceras configuradas por helmet', async () => {
        const response = await testServer.request('/');
        
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['strict-transport-security']).toBeDefined();
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['x-powered-by']).toBeUndefined();
    });
});
