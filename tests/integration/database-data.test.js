require('dotenv').config();
const { executeQuery, getPool } = require('../../config/database');

describe('Pruebas de Integración - Integridad de Datos', () => {
  afterAll(async () => {
    const pool = await getPool();
    if (pool) {
      await pool.close();
    }
  });

  it('todas las preguntas deben tener opciones asociadas', async () => {
    const result = await executeQuery(`
      SELECT q.QuestionID 
      FROM Questions q
      LEFT JOIN QuestionOptions o ON q.QuestionID = o.QuestionID
      WHERE o.OptionID IS NULL
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('cada pregunta de tipo "part1_notice" debe tener exactamente 3 opciones', async () => {
    const result = await executeQuery(`
      SELECT q.QuestionID, COUNT(o.OptionID) as OptionCount 
      FROM Questions q
      JOIN QuestionOptions o ON q.QuestionID = o.QuestionID
      WHERE q.QuestionType = 'part1_notice'
      GROUP BY q.QuestionID
      HAVING COUNT(o.OptionID) != 3
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('cada pregunta de tipo "part6_critical" debe tener exactamente 4 opciones', async () => {
    const result = await executeQuery(`
      SELECT q.QuestionID, COUNT(o.OptionID) as OptionCount 
      FROM Questions q
      JOIN QuestionOptions o ON q.QuestionID = o.QuestionID
      WHERE q.QuestionType = 'part6_critical'
      GROUP BY q.QuestionID
      HAVING COUNT(o.OptionID) != 4
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('las preguntas de lectura (part5, part6) deben tener ReadingPassage no nulo', async () => {
    const result = await executeQuery(`
      SELECT QuestionID 
      FROM Questions 
      WHERE (QuestionType LIKE 'part5%' OR QuestionType LIKE 'part6%')
      AND ReadingPassage IS NULL
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('las preguntas cloze (part4, part7) deben tener ReadingPassage no nulo', async () => {
    const result = await executeQuery(`
      SELECT QuestionID 
      FROM Questions 
      WHERE (QuestionType LIKE 'part4%' OR QuestionType LIKE 'part7%')
      AND ReadingPassage IS NULL
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('cada set de opciones debe tener exactamente 1 opción correcta (IsCorrect=1)', async () => {
    const result = await executeQuery(`
      SELECT QuestionID, SUM(CAST(IsCorrect AS INT)) as CorrectCount 
      FROM QuestionOptions
      GROUP BY QuestionID
      HAVING SUM(CAST(IsCorrect AS INT)) != 1
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('todas las semanas deben tener actividades asignadas', async () => {
    const result = await executeQuery(`
      SELECT w.WeekID 
      FROM ModuleWeeks w
      LEFT JOIN Activities a ON w.WeekID = a.WeekID
      WHERE a.ActivityID IS NULL
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('los ShopItems deben tener precios positivos', async () => {
    const result = await executeQuery(`
      SELECT ItemID 
      FROM ShopItems 
      WHERE Price <= 0 OR Price IS NULL
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('las contraseñas de usuarios deben estar hasheadas (empiezan con $2a$ o $2b$)', async () => {
    const result = await executeQuery(`
      SELECT UserID 
      FROM Users 
      WHERE PasswordHash NOT LIKE '$2a$%' AND PasswordHash NOT LIKE '$2b$%'
    `);
    expect(result.recordset.length).toBe(0);
  });

  it('no debe haber usuarios con PasswordHash en texto plano', async () => {
    const result = await executeQuery(`
      SELECT UserID 
      FROM Users 
      WHERE LEN(PasswordHash) < 50
    `);
    expect(result.recordset.length).toBe(0);
  });
});
