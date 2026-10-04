/**
 * Helper para realizar peticiones HTTP a la aplicación Express en pruebas
 * Utiliza http nativo de Node y fetch global (Node 18+) para no depender de supertest
 */
const http = require('http');

function createTestServer(app) {
    let server;
    let baseUrl;

    return {
        start: () => new Promise((resolve) => {
            server = http.createServer(app);
            server.listen(0, '127.0.0.1', () => {
                baseUrl = `http://127.0.0.1:${server.address().port}`;
                resolve(baseUrl);
            });
        }),
        stop: () => new Promise((resolve) => {
            if (server) {
                server.close(() => resolve());
            } else {
                resolve();
            }
        }),
        request: async (path, options = {}) => {
            const res = await fetch(`${baseUrl}${path}`, {
                ...options,
                redirect: 'manual'
            });
            const headers = {};
            res.headers.forEach((v, k) => {
                headers[k] = v;
            });
            const text = await res.text();
            return {
                status: res.status,
                statusCode: res.status,
                headers,
                body: text,
                text
            };
        }
    };
}

module.exports = { createTestServer };
