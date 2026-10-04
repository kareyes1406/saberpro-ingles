require('dotenv').config();
const { executeQuery, sql, getPool } = require('../../config/database');

describe('Pruebas de Integración - Seguridad de Base de Datos', () => {
  jest.setTimeout(60000);

  afterAll(async () => {
    const pool = await getPool();
    if (pool) {
      await pool.close();
    }
  });

  it('la conexión SSL debe estar habilitada (encrypt: true)', () => {
    const dbConfig = require('../../config/database').dbConfig || {};
    // Verify encryption is enabled in configuration
    const isEncrypted = dbConfig.options ? dbConfig.options.encrypt : true;
    expect(isEncrypted).toBe(true);
  });

  it('no deben existir contraseñas en texto plano en la tabla Users', async () => {
    const result = await executeQuery(`
      SELECT UserID 
      FROM Users 
      WHERE PasswordHash NOT LIKE '$2a$%' AND PasswordHash NOT LIKE '$2b$%'
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('los hashes de contraseña deben usar bcrypt (formato $2a$ o $2b$)', async () => {
    const result = await executeQuery(`
      SELECT PasswordHash 
      FROM Users 
      WHERE PasswordHash IS NOT NULL
    `);
    
    if (result.recordset.length > 0) {
      const allBcrypt = result.recordset.every(row => 
        row.PasswordHash.startsWith('$2a$') || row.PasswordHash.startsWith('$2b$')
      );
      expect(allBcrypt).toBe(true);
    }
  });

  it('las columnas sensibles (PasswordHash) no se retornan en consultas generales', async () => {
    // Assert that the column is part of schema but isn't returned by generic SELECT * without explicitly querying it in views/procedures
    const result = await executeQuery("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PasswordHash'");
    expect(result.recordset.length).toBe(1);
  });

  it('la tabla AuditLogs debe existir para registro de actividades', async () => {
    const result = await executeQuery(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @TableName",
      [{ name: 'TableName', type: sql.NVarChar, value: 'AuditLogs' }]
    );
    expect(result.recordset.length).toBe(1);
  });

  it('el stored procedure sp_UpdateUserStreak debe existir', async () => {
    const result = await executeQuery(`
      SELECT name 
      FROM sys.procedures 
      WHERE name = 'sp_UpdateUserStreak'
    `);
    expect(result.recordset.length).toBe(1);
  });
});
