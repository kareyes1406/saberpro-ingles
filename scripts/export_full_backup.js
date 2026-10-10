/**
 * scripts/export_full_backup.js
 * Exporta automáticamente toda la información de la base de datos Azure SQL actual
 * tanto a formato JSON como a un script SQL completo con INSERTs y manejo de IDENTITY.
 */
const { executeQuery, sql } = require('../config/database');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'database', 'backup_data');
const SQL_BACKUP_FILE = path.join(__dirname, '..', 'database', 'backup_tesis_complete.sql');

// Tablas en orden adecuado de dependencias
const TABLES_ORDER = [
    'Roles',
    'Modules',
    'ModuleWeeks',
    'ActivityTypes',
    'Activities',
    'Questions',
    'QuestionOptions',
    'Badges',
    'ShopItems',
    'Users',
    'UserGamification',
    'AdaptiveLearningPaths',
    'UserProgress',
    'EvaluationResults',
    'UserBadges',
    'UserExams',
    'UserInventory',
    'Messages',
    'AdminKPISnapshots',
    'AuditLogs'
];

function formatSqlValue(val, colType) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (typeof val === 'number') return val;
    if (val instanceof Date) {
        return `'${val.toISOString().replace('T', ' ').substring(0, 23)}'`;
    }
    // String o Buffer
    const str = String(val).replace(/'/g, "''");
    return `N'${str}'`;
}

async function exportFullBackup() {
    try {
        console.log('--- INICIANDO EXPORTACIÓN COMPLETA DE BASE DE DATOS ---');
        
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        let fullSql = `-- BACKUP COMPLETO SABERPRO TESIS\n`;
        fullSql += `-- Fecha: ${new Date().toISOString()}\n`;
        fullSql += `SET NOCOUNT ON;\n\n`;

        // Desactivar todas las restricciones durante la inserción
        for (const table of TABLES_ORDER) {
            fullSql += `IF OBJECT_ID(N'[dbo].[${table}]', N'U') IS NOT NULL ALTER TABLE [dbo].[${table}] NOCHECK CONSTRAINT ALL;\n`;
        }
        fullSql += `\n`;

        for (const table of TABLES_ORDER) {
            process.stdout.write(`Exportando tabla [${table}]... `);

            // Verificar si la tabla existe en la BD
            const checkTbl = await executeQuery(`SELECT 1 FROM sys.tables WHERE name = @t`, [{ name: 't', type: sql.NVarChar, value: table }]);
            if (checkTbl.recordset.length === 0) {
                console.log('No existe en BD, omitida.');
                continue;
            }

            // Obtener columnas e información de identity
            const colsResult = await executeQuery(`
                SELECT c.name, c.is_identity, t.name AS type_name
                FROM sys.columns c
                INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
                WHERE c.object_id = OBJECT_ID(@t)
                ORDER BY c.column_id
            `, [{ name: 't', type: sql.NVarChar, value: table }]);

            const columns = colsResult.recordset.map(c => c.name);
            const hasIdentity = colsResult.recordset.some(c => c.is_identity);

            // Obtener todos los registros
            const dataResult = await executeQuery(`SELECT * FROM [dbo].[${table}]`);
            const rows = dataResult.recordset;

            // Guardar JSON
            const jsonPath = path.join(BACKUP_DIR, `${table}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');

            console.log(`${rows.length} registros guardados en JSON.`);

            if (rows.length > 0) {
                fullSql += `-- =============================================\n`;
                fullSql += `-- TABLA: ${table} (${rows.length} filas)\n`;
                fullSql += `-- =============================================\n`;

                if (hasIdentity) {
                    fullSql += `SET IDENTITY_INSERT [dbo].[${table}] ON;\n`;
                }

                const colNamesJoined = columns.map(c => `[${c}]`).join(', ');

                // Generar en batches de 50 filas para rendimiento en SQL Server
                const batchSize = 50;
                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);
                    fullSql += `INSERT INTO [dbo].[${table}] (${colNamesJoined}) VALUES\n`;
                    const valuesList = batch.map(row => {
                        const vals = columns.map(col => formatSqlValue(row[col]));
                        return `(${vals.join(', ')})`;
                    });
                    fullSql += valuesList.join(',\n') + ';\n';
                }

                if (hasIdentity) {
                    fullSql += `SET IDENTITY_INSERT [dbo].[${table}] OFF;\n`;
                }
                fullSql += `\n`;
            }
        }

        // Reactivar restricciones
        fullSql += `-- Reactivar restricciones de clave foránea\n`;
        for (const table of TABLES_ORDER) {
            fullSql += `IF OBJECT_ID(N'[dbo].[${table}]', N'U') IS NOT NULL ALTER TABLE [dbo].[${table}] WITH CHECK CHECK CONSTRAINT ALL;\n`;
        }

        fs.writeFileSync(SQL_BACKUP_FILE, fullSql, 'utf8');
        console.log(`\n✅ EXPORTACIÓN EXITOSA.`);
        console.log(`- Archivos JSON individuales: ${BACKUP_DIR}`);
        console.log(`- Archivo SQL maestro de restauración: ${SQL_BACKUP_FILE}`);
        console.log(`  (Tamaño del archivo SQL: ${(fs.statSync(SQL_BACKUP_FILE).size / 1024).toFixed(2)} KB)`);

        process.exit(0);
    } catch (err) {
        console.error('Error exportando:', err);
        process.exit(1);
    }
}

exportFullBackup();
