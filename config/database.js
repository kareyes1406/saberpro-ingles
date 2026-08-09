/**
 * config/database.js
 * Módulo de configuración y conexión a Azure SQL Server
 * Patrón: Singleton Pool para reutilización de conexiones
 *
 * Variables de entorno requeridas en .env:
 * DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD, DB_PORT
 * DB_POOL_MIN, DB_POOL_MAX, DB_POOL_IDLE
 *
 * NOTA Azure Free Tier: mantener DB_POOL_MAX <= 5 para no
 * exceder los límites de vCore-seconds del tier gratuito.
 */

require('dotenv').config();
const sql = require('mssql');

const config = {
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server:   process.env.DB_SERVER,
    port:     parseInt(process.env.DB_PORT   || '1433',  10),
    // ── Pool: valores leídos desde .env para control fino ──────────────
    pool: {
        max:              parseInt(process.env.DB_POOL_MAX  || '5',     10),
        min:              parseInt(process.env.DB_POOL_MIN  || '0',     10),
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE || '30000', 10)
    },
    // ── Opciones requeridas por Azure SQL (mssql v12 compatible) ────────
    options: {
        encrypt:               true,   // Obligatorio en Azure SQL
        trustServerCertificate: false, // Usar certificado de Azure (producción)
        enableArithAbort:      true,   // Recomendado para SQL Server moderno
        connectTimeout:        30000,  // ms — timeout de conexión
        requestTimeout:        30000   // ms — timeout de query
    }
};

let pool = null;

async function getPool() {
    if (!pool) {
        try {
            pool = await sql.connect(config);
            console.log('Connected to Azure SQL Server successfully.');
        } catch (err) {
            console.error('Database connection failed:', err);
            throw err;
        }
    }
    return pool;
}

/**
 * Helper para ejecutar queries parametrizadas
 * @param {string} query - Query SQL con variables @param
 * @param {Array} params - Array de objetos { name, type, value }
 */
async function executeQuery(query, params = []) {
    try {
        const pool = await getPool();
        const request = pool.request();
        
        params.forEach(p => {
            if (p.type) {
                request.input(p.name, p.type, p.value);
            } else {
                request.input(p.name, p.value);
            }
        });
        
        const result = await request.query(query);
        return result;
    } catch (err) {
        console.error('SQL Execution Error:', err, query);
        throw err;
    }
}

async function testConnection() {
    try {
        await getPool();
        const result = await executeQuery('SELECT 1 as result');
        return result.recordset[0].result === 1;
    } catch (err) {
        return false;
    }
}

module.exports = {
    getPool,
    executeQuery,
    testConnection,
    sql
};
