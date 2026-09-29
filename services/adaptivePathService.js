const { executeQuery, sql } = require('../config/database');

class AdaptivePathService {
  /**
   * Clasifica un puntaje total en un nivel MCER
   * @param {number} totalScore - Puntaje de 0 a 100
   * @returns {string} Nivel MCER
   */
  static classifyLevel(totalScore) {
    if (totalScore <= 25) return 'A1';
    if (totalScore <= 45) return 'A2';
    if (totalScore <= 65) return 'B1';
    if (totalScore <= 85) return 'B2';
    return 'C1';
  }

  /**
   * Obtiene la descripción de un nivel
   * @param {string} level - Nivel MCER
   * @returns {Object} Descripción del nivel
   */
  static getLevelDescription(level) {
    const descriptions = {
      'A1': { level: 'A1', name: 'Principiante', description: 'Comprende y utiliza expresiones cotidianas de uso muy frecuente.', icon: '🌱', color: '#4ade80' },
      'A2': { level: 'A2', name: 'Elemental', description: 'Comprende frases y expresiones de uso frecuente relacionadas con áreas de experiencia.', icon: '🪴', color: '#3b82f6' },
      'B1': { level: 'B1', name: 'Intermedio', description: 'Comprende los puntos principales de textos claros y en lengua estándar.', icon: '🌿', color: '#eab308' },
      'B2': { level: 'B2', name: 'Intermedio Alto', description: 'Entiende las ideas principales de textos complejos que traten de temas tanto concretos como abstractos.', icon: '🌳', color: '#f97316' },
      'C1': { level: 'C1', name: 'Avanzado', description: 'Comprende una amplia variedad de textos extensos y con cierto nivel de exigencia.', icon: '🌲', color: '#ef4444' }
    };
    return descriptions[level] || descriptions['A1'];
  }

  /**
   * Obtiene los tipos de preguntas para un nivel y semana
   * @param {string} level - Nivel MCER
   * @param {number} weekNumber - Número de semana (1-4)
   * @returns {Object} Tipos de preguntas y ratio
   */
  static getQuestionTypesForLevel(level, weekNumber) {
    const mappings = {
      'A1': { primary: ['part1_notice', 'part2_matching'], secondary: ['part3_dialogue', 'part4_cloze'] },
      'A2': { primary: ['part3_dialogue', 'part4_cloze'], secondary: ['part5_reading'] },
      'B1': { primary: ['part4_cloze', 'part5_reading', 'part6_critical'], secondary: ['part7_cloze_advanced'] },
      'B2': { primary: ['part5_reading', 'part6_critical', 'part7_cloze_advanced'], secondary: [] },
      'C1': { primary: ['part6_critical', 'part7_cloze_advanced'], secondary: [] }
    };

    const ratios = { 1: 0.0, 2: 0.2, 3: 0.4, 4: 0.5 };
    const ratio = ratios[weekNumber] !== undefined ? ratios[weekNumber] : 0.0;
    
    const mapping = mappings[level] || mappings['A1'];
    
    return {
      primary: mapping.primary,
      secondary: mapping.secondary,
      ratio: ratio
    };
  }

  /**
   * Genera y almacena la ruta adaptativa
   * @param {number} userId - ID del usuario
   * @param {number} totalScore - Puntaje total
   * @returns {Object} Datos de la ruta
   */
  static async generateAdaptivePath(userId, totalScore) {
    const level = this.classifyLevel(totalScore);
    
    // Actualizar nivel del usuario
    await executeQuery(
      'UPDATE Users SET EnglishLevel = @level WHERE UserID = @userId',
      [
        { name: 'level', type: sql.NVarChar, value: level },
        { name: 'userId', type: sql.Int, value: userId }
      ]
    );

    const pathData = [];
    
    // Generar datos por semana
    for (let week = 1; week <= 4; week++) {
      const config = this.getQuestionTypesForLevel(level, week);
      pathData.push({
        week,
        primary: config.primary,
        secondary: config.secondary,
        ratio: config.ratio
      });
      
      // Guardar en DB
      await executeQuery(
        `IF NOT EXISTS (SELECT 1 FROM AdaptiveLearningPaths WHERE UserID = @userId AND WeekNumber = @week)
         BEGIN
           INSERT INTO AdaptiveLearningPaths (UserID, Level, WeekNumber, PrimaryTypes, SecondaryTypes, SecondaryRatio)
           VALUES (@userId, @level, @week, @primary, @secondary, @ratio)
         END
         ELSE
         BEGIN
           UPDATE AdaptiveLearningPaths 
           SET Level = @level, PrimaryTypes = @primary, SecondaryTypes = @secondary, SecondaryRatio = @ratio
           WHERE UserID = @userId AND WeekNumber = @week
         END`,
        [
          { name: 'userId', type: sql.Int, value: userId },
          { name: 'level', type: sql.NVarChar, value: level },
          { name: 'week', type: sql.Int, value: week },
          { name: 'primary', type: sql.NVarChar, value: JSON.stringify(config.primary) },
          { name: 'secondary', type: sql.NVarChar, value: JSON.stringify(config.secondary) },
          { name: 'ratio', type: typeof sql.Decimal === 'function' ? sql.Decimal(3, 2) : sql.Decimal, value: config.ratio }
        ]
      );
    }
    
    return { level, pathData };
  }

  /**
   * Obtiene el nivel del estudiante
   * @param {number} userId - ID del usuario
   * @returns {string|null} Nivel MCER
   */
  static async getStudentLevel(userId) {
    const result = await executeQuery(
      'SELECT EnglishLevel FROM Users WHERE UserID = @userId',
      [{ name: 'userId', type: sql.Int, value: userId }]
    );
    if (result && result.recordset && result.recordset.length > 0) {
      return result.recordset[0].EnglishLevel;
    }
    return null;
  }

  /**
   * Obtiene los tipos permitidos de DB
   * @param {number} userId - ID del usuario
   * @param {number} weekNumber - Número de semana
   * @returns {Object} Configuración
   */
  static async getAllowedQuestionTypes(userId, weekNumber) {
    const result = await executeQuery(
      'SELECT PrimaryTypes, SecondaryTypes, SecondaryRatio FROM AdaptiveLearningPaths WHERE UserID = @userId AND WeekNumber = @week',
      [
        { name: 'userId', type: sql.Int, value: userId },
        { name: 'week', type: sql.Int, value: weekNumber }
      ]
    );

    if (result && result.recordset && result.recordset.length > 0) {
      const row = result.recordset[0];
      return {
        primary: JSON.parse(row.PrimaryTypes),
        secondary: JSON.parse(row.SecondaryTypes),
        ratio: row.SecondaryRatio
      };
    }

    // Por defecto todas si no hay ruta
    return {
      primary: ['part1_notice', 'part2_matching', 'part3_dialogue', 'part4_cloze', 'part5_reading', 'part6_critical', 'part7_cloze_advanced'],
      secondary: [],
      ratio: 0
    };
  }

  /**
   * Obtiene array plano de preguntas
   * @param {string} level - Nivel MCER
   * @param {number} weekNumber - Número de semana
   * @returns {string[]} Array plano
   */
  static getAllQuestionTypesFlat(level, weekNumber) {
    const config = this.getQuestionTypesForLevel(level, weekNumber);
    if (config.ratio > 0 && config.secondary.length > 0) {
      return [...config.primary, ...config.secondary];
    }
    return [...config.primary];
  }
}

module.exports = AdaptivePathService;
