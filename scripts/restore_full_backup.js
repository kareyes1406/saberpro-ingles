/**
 * scripts/restore_full_backup.js
 * Restaura automáticamente el esquema y todos los datos respaldados
 * en la nueva base de datos configurada en .env
 */
const { executeQuery, sql } = require('../config/database');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'database', 'backup_data');
const SCHEMA_FILE = path.join(__dirname, '..', 'database', 'schema.sql');
const SCHEMA_UPDATE_FILE = path.join(__dirname, '..', 'database', 'schema-update.sql');
const MIGRATION_ADAPTIVE_FILE = path.join(__dirname, '..', 'database', 'migration-adaptive-path.sql');

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

async function runSqlFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    console.log(`Ejecutando ${path.basename(filePath)}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    // Separar por GO
    const batches = content.split(/^\s*GO\s*$/im);
    for (const batch of batches) {
        const trimmed = batch.trim();
        if (trimmed.length > 0) {
            try {
                await executeQuery(trimmed);
            } catch (err) {
                // Ignorar errores si la tabla u objeto ya existe
                if (!err.message.includes('already exists') && !err.message.includes('Column names in each table must be unique')) {
                    console.warn(`[Aviso en batch]: ${err.message.substring(0, 100)}...`);
                }
            }
        }
    }
}

async function restoreData() {
    try {
        console.log('--- INICIANDO RESTAURACIÓN EN LA NUEVA BASE DE DATOS ---');

        // 1. Asegurar tablas y esquemas
        console.log('1. Creando tablas y estructura base...');
        await runSqlFile(SCHEMA_FILE);
        await runSqlFile(SCHEMA_UPDATE_FILE);
        await runSqlFile(MIGRATION_ADAPTIVE_FILE);

        // Asegurar tablas de Shop y Messages con sus esquemas exactos
        try {
            await executeQuery(`
                IF OBJECT_ID(N'[dbo].[UserInventory]', N'U') IS NOT NULL DROP TABLE [dbo].[UserInventory];
                IF OBJECT_ID(N'[dbo].[ShopItems]', N'U') IS NOT NULL DROP TABLE [dbo].[ShopItems];
                IF OBJECT_ID(N'[dbo].[Messages]', N'U') IS NOT NULL DROP TABLE [dbo].[Messages];

                CREATE TABLE [dbo].[ShopItems] (
                    ItemID INT IDENTITY(1,1) PRIMARY KEY,
                    ItemName NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(500) NOT NULL,
                    IconEmoji NVARCHAR(10) NOT NULL,
                    ItemType NVARCHAR(50) NULL,
                    Price INT NOT NULL,
                    DurationMinutes INT NULL,
                    BoostMultiplier DECIMAL(3,1) DEFAULT 1.0,
                    IsActive BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );

                CREATE TABLE [dbo].[UserInventory] (
                    InventoryID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NULL,
                    ItemID INT NULL,
                    PurchasedAt DATETIME DEFAULT GETDATE(),
                    ExpiresAt DATETIME NULL,
                    IsUsed BIT DEFAULT 0,
                    UsedAt DATETIME NULL,
                    CONSTRAINT FK_UserInventory_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
                    CONSTRAINT FK_UserInventory_ShopItems FOREIGN KEY (ItemID) REFERENCES ShopItems(ItemID)
                );

                CREATE TABLE [dbo].[Messages] (
                    MessageID INT IDENTITY(1,1) PRIMARY KEY,
                    SenderID INT NOT NULL,
                    ReceiverID INT NULL,
                    Subject NVARCHAR(200) NULL,
                    MessageText NVARCHAR(MAX) NOT NULL,
                    IsRead BIT DEFAULT 0,
                    ParentMessageID INT NULL,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderID) REFERENCES Users(UserID)
                );

                IF OBJECT_ID(N'[dbo].[UserExams]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[UserExams] (
                        ExamID INT IDENTITY(1,1) PRIMARY KEY,
                        UserID INT NOT NULL,
                        ExamType NVARCHAR(10) NOT NULL,
                        TotalScore INT NULL,
                        VocabularyScore INT NULL,
                        ReadingScore INT NULL,
                        PragmaticsScore INT NULL,
                        GrammarScore INT NULL,
                        TimeSpentSeconds INT NULL,
                        CompletedAt DATETIME DEFAULT GETDATE(),
                        CONSTRAINT FK_UserExams_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
                    );
                END
            `);
        } catch(e) {
            console.warn('Tablas adicionales:', e.message);
        }

        console.log('2. Insertando datos respaldados...');

        // Desactivar constraints
        for (const table of TABLES_ORDER) {
            try {
                await executeQuery(`IF OBJECT_ID(N'[dbo].[${table}]', N'U') IS NOT NULL ALTER TABLE [dbo].[${table}] NOCHECK CONSTRAINT ALL;`);
            } catch(e) {}
        }

        // Insertar datos desde JSON
        for (const table of TABLES_ORDER) {
            const jsonPath = path.join(BACKUP_DIR, `${table}.json`);
            if (!fs.existsSync(jsonPath)) continue;

            const rows = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            if (rows.length === 0) continue;

            process.stdout.write(`Restaurando [${table}] (${rows.length} registros)... `);

            // Verificar columnas e Identity
            const colsResult = await executeQuery(`
                SELECT c.name, c.is_identity
                FROM sys.columns c
                WHERE c.object_id = OBJECT_ID(@t)
                ORDER BY c.column_id
            `, [{ name: 't', type: sql.NVarChar, value: table }]);

            const columns = colsResult.recordset.map(c => c.name);
            const hasIdentity = colsResult.recordset.some(c => c.is_identity);

            // Limpiar datos existentes por si los scripts de schema insertaron defaults
            try {
                await executeQuery(`DELETE FROM [dbo].[${table}]`);
            } catch(e) {}

            if (hasIdentity) {
                await executeQuery(`SET IDENTITY_INSERT [dbo].[${table}] ON;`);
            }

            const colNamesJoined = columns.map(c => `[${c}]`).join(', ');

            // Insertar por lotes de 40
            const batchSize = 40;
            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const valuesList = batch.map(row => {
                    const vals = columns.map(col => {
                        const val = row[col];
                        if (val === null || val === undefined) return 'NULL';
                        if (typeof val === 'boolean') return val ? 1 : 0;
                        if (typeof val === 'number') return val;
                        return `N'${String(val).replace(/'/g, "''")}'`;
                    });
                    return `(${vals.join(', ')})`;
                });

                const insertQuery = `
                    ${hasIdentity ? `SET IDENTITY_INSERT [dbo].[${table}] ON;` : ''}
                    INSERT INTO [dbo].[${table}] (${colNamesJoined}) VALUES ${valuesList.join(',\n')};
                    ${hasIdentity ? `SET IDENTITY_INSERT [dbo].[${table}] OFF;` : ''}
                `;
                await executeQuery(insertQuery);
            }

            if (hasIdentity) {
                await executeQuery(`SET IDENTITY_INSERT [dbo].[${table}] OFF;`);
            }

            console.log('✓ OK');
        }

        // Reactivar constraints
        console.log('3. Reactivando validaciones e integridad...');
        for (const table of TABLES_ORDER) {
            try {
                await executeQuery(`IF OBJECT_ID(N'[dbo].[${table}]', N'U') IS NOT NULL ALTER TABLE [dbo].[${table}] WITH CHECK CHECK CONSTRAINT ALL;`);
            } catch(e) {}
        }

        console.log('\n🎉 ¡RESTAURACIÓN FINALIZADA CON ÉXITO!');
        process.exit(0);
    } catch (err) {
        console.error('Error restaurando base de datos:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    restoreData();
}

module.exports = { restoreData };
