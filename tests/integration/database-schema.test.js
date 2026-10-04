require('dotenv').config();
const { executeQuery, sql, getPool } = require('../../config/database');

describe('Pruebas de Integración - Esquema de Base de Datos', () => {
  afterAll(async () => {
    const pool = await getPool();
    if (pool) {
      await pool.close();
    }
  });

  const checkTableExists = async (tableName) => {
    const result = await executeQuery(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @TableName",
      [{ name: 'TableName', type: sql.NVarChar, value: tableName }]
    );
    return result.recordset.length === 1;
  };

  const getTableColumns = async (tableName) => {
    const result = await executeQuery(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @TableName",
      [{ name: 'TableName', type: sql.NVarChar, value: tableName }]
    );
    return result.recordset.map(r => r.COLUMN_NAME);
  };

  const checkTableAndColumns = async (tableName, columns) => {
    expect(await checkTableExists(tableName)).toBe(true);
    if (columns) {
      const existingCols = await getTableColumns(tableName);
      for (const col of columns) {
        expect(existingCols).toContain(col);
      }
    }
  };

  it('debe existir la tabla Users con sus columnas', async () => {
    await checkTableAndColumns('Users', ['UserID', 'FirstName', 'LastName', 'Email', 'PasswordHash', 'RoleID', 'IsActive', 'VerificationPin', 'PinExpiry', 'LastLoginAt', 'CreatedAt']);
  });

  it('debe existir la tabla Roles con sus columnas', async () => {
    await checkTableAndColumns('Roles', ['RoleID', 'RoleName', 'Description']);
  });

  it('debe existir la tabla Modules', async () => {
    await checkTableAndColumns('Modules', null);
  });

  it('debe existir la tabla ModuleWeeks con sus columnas', async () => {
    await checkTableAndColumns('ModuleWeeks', ['WeekID', 'ModuleID', 'WeekNumber', 'Title']);
  });

  it('debe existir la tabla Activities con sus columnas', async () => {
    await checkTableAndColumns('Activities', ['ActivityID', 'WeekID', 'ActivityTypeID', 'Title', 'SortOrder', 'XPReward', 'CoinReward', 'IsActive']);
  });

  it('debe existir la tabla ActivityTypes con sus columnas', async () => {
    await checkTableAndColumns('ActivityTypes', ['ActivityTypeID', 'TypeName', 'GameMechanic']);
  });

  it('debe existir la tabla Questions con sus columnas', async () => {
    await checkTableAndColumns('Questions', ['QuestionID', 'ActivityID', 'QuestionText', 'QuestionType', 'MediaUrl', 'Explanation', 'ReadingPassage']);
  });

  it('debe existir la tabla QuestionOptions con sus columnas', async () => {
    await checkTableAndColumns('QuestionOptions', ['OptionID', 'QuestionID', 'OptionText', 'IsCorrect']);
  });

  it('debe existir la tabla UserProgress', async () => {
    await checkTableAndColumns('UserProgress', null);
  });

  it('debe existir la tabla UserGamification con sus columnas', async () => {
    await checkTableAndColumns('UserGamification', ['TotalXP', 'Level', 'CurrentStreak', 'LongestStreak', 'TotalCoins', 'CoinsSpent']);
  });

  it('debe existir la tabla UserBadges', async () => {
    await checkTableAndColumns('UserBadges', null);
  });

  it('debe existir la tabla Badges', async () => {
    await checkTableAndColumns('Badges', null);
  });

  it('debe existir la tabla UserExams con sus columnas', async () => {
    await checkTableAndColumns('UserExams', ['UserID', 'ExamType', 'TotalScore', 'VocabularyScore', 'PragmaticsScore', 'ReadingScore', 'GrammarScore']);
  });

  it('debe existir la tabla EvaluationResults', async () => {
    await checkTableAndColumns('EvaluationResults', null);
  });

  it('debe existir la tabla AuditLogs', async () => {
    await checkTableAndColumns('AuditLogs', null);
  });

  it('debe existir la tabla ShopItems', async () => {
    await checkTableAndColumns('ShopItems', null);
  });

  it('debe existir la tabla UserInventory', async () => {
    await checkTableAndColumns('UserInventory', null);
  });

  it('debe existir la tabla Messages', async () => {
    await checkTableAndColumns('Messages', null);
  });

  it('debe haber exactamente 245 preguntas en la tabla Questions', async () => {
    const result = await executeQuery("SELECT COUNT(*) as count FROM Questions");
    expect(result.recordset[0].count).toBe(245);
  });

  it('debe haber al menos 4 semanas en ModuleWeeks', async () => {
    const result = await executeQuery("SELECT COUNT(*) as count FROM ModuleWeeks");
    expect(result.recordset[0].count).toBeGreaterThanOrEqual(4);
  });

  it('debe haber 7 tipos de preguntas distintos (part1 a part7)', async () => {
    const result = await executeQuery("SELECT DISTINCT QuestionType FROM Questions");
    const types = result.recordset.map(r => (r.QuestionType || '').toLowerCase());
    const hasParts = ['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7'].every(pt => types.some(t => t.includes(pt)));
    expect(hasParts).toBe(true);
  });

  it('cada pregunta debe tener al menos 3 opciones', async () => {
    const result = await executeQuery(`
      SELECT q.QuestionID, COUNT(o.OptionID) as OptionCount 
      FROM Questions q
      LEFT JOIN QuestionOptions o ON q.QuestionID = o.QuestionID
      GROUP BY q.QuestionID
      HAVING COUNT(o.OptionID) < 3
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('debe haber al menos 3 roles (student, admin, professor)', async () => {
    const result = await executeQuery("SELECT RoleName FROM Roles");
    const roles = result.recordset.map(r => r.RoleName.toLowerCase());
    expect(roles).toContain('student');
    expect(roles).toContain('admin');
    expect(roles).toContain('professor');
  });

  it('deben existir índices en columnas críticas', async () => {
    const result = await executeQuery(`
      SELECT i.name as IndexName 
      FROM sys.indexes i
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      WHERE t.name = 'Users' AND i.name IS NOT NULL
    `);
    expect(result.recordset.length).toBeGreaterThan(0);
  });
});
