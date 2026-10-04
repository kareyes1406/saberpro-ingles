const AdaptivePathService = require('../../../services/adaptivePathService');
const db = require('../../../config/database');

jest.mock('../../../config/database', () => ({
  executeQuery: jest.fn(),
  sql: {
    NVarChar: jest.fn(),
    Int: jest.fn(),
    Decimal: jest.fn()
  }
}));

describe('AdaptivePathService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('classifyLevel', () => {
    it('debería clasificar 0 como A1', () => expect(AdaptivePathService.classifyLevel(0)).toBe('A1'));
    it('debería clasificar 25 como A1', () => expect(AdaptivePathService.classifyLevel(25)).toBe('A1'));
    it('debería clasificar 26 como A2', () => expect(AdaptivePathService.classifyLevel(26)).toBe('A2'));
    it('debería clasificar 45 como A2', () => expect(AdaptivePathService.classifyLevel(45)).toBe('A2'));
    it('debería clasificar 46 como B1', () => expect(AdaptivePathService.classifyLevel(46)).toBe('B1'));
    it('debería clasificar 65 como B1', () => expect(AdaptivePathService.classifyLevel(65)).toBe('B1'));
    it('debería clasificar 66 como B2', () => expect(AdaptivePathService.classifyLevel(66)).toBe('B2'));
    it('debería clasificar 85 como B2', () => expect(AdaptivePathService.classifyLevel(85)).toBe('B2'));
    it('debería clasificar 86 como C1', () => expect(AdaptivePathService.classifyLevel(86)).toBe('C1'));
    it('debería clasificar 100 como C1', () => expect(AdaptivePathService.classifyLevel(100)).toBe('C1'));
  });

  describe('getLevelDescription', () => {
    it('debería retornar datos correctos para A1', () => {
      const desc = AdaptivePathService.getLevelDescription('A1');
      expect(desc.name).toBe('Principiante');
      expect(desc.color).toBeDefined();
    });
    it('debería retornar datos correctos para C1', () => {
      const desc = AdaptivePathService.getLevelDescription('C1');
      expect(desc.name).toBe('Avanzado');
      expect(desc.color).toBeDefined();
    });
  });

  describe('getQuestionTypesForLevel', () => {
    it('A1 semana 1: ratio 0', () => {
      const config = AdaptivePathService.getQuestionTypesForLevel('A1', 1);
      expect(config.primary).toEqual(['part1_notice', 'part2_matching']);
      expect(config.secondary).toEqual(['part3_dialogue', 'part4_cloze']);
      expect(config.ratio).toBe(0.0);
    });
    
    it('A1 semana 4: ratio 0.5', () => {
      const config = AdaptivePathService.getQuestionTypesForLevel('A1', 4);
      expect(config.ratio).toBe(0.5);
    });

    it('B1 semana 1', () => {
      const config = AdaptivePathService.getQuestionTypesForLevel('B1', 1);
      expect(config.primary).toEqual(['part4_cloze', 'part5_reading', 'part6_critical']);
      expect(config.ratio).toBe(0.0);
    });

    it('B1 semana 3', () => {
      const config = AdaptivePathService.getQuestionTypesForLevel('B1', 3);
      expect(config.secondary).toEqual(['part7_cloze_advanced']);
      expect(config.ratio).toBe(0.4);
    });

    it('B2 semana 1', () => {
      const config = AdaptivePathService.getQuestionTypesForLevel('B2', 1);
      expect(config.primary).toEqual(['part5_reading', 'part6_critical', 'part7_cloze_advanced']);
      expect(config.secondary).toEqual([]);
    });

    it('C1', () => {
      const config = AdaptivePathService.getQuestionTypesForLevel('C1', 2);
      expect(config.primary).toEqual(['part6_critical', 'part7_cloze_advanced']);
      expect(config.secondary).toEqual([]);
    });
  });

  describe('getAllQuestionTypesFlat', () => {
    it('A1 semana 1 solo primarias', () => {
      const types = AdaptivePathService.getAllQuestionTypesFlat('A1', 1);
      expect(types).toEqual(['part1_notice', 'part2_matching']);
    });
    
    it('B1 semana 3 primarias y secundarias', () => {
      const types = AdaptivePathService.getAllQuestionTypesFlat('B1', 3);
      expect(types).toEqual(['part4_cloze', 'part5_reading', 'part6_critical', 'part7_cloze_advanced']);
    });
    
    it('B1 semana 1 no incluye A1', () => {
      const types = AdaptivePathService.getAllQuestionTypesFlat('B1', 1);
      expect(types).not.toContain('part1_notice');
    });
    
    it('A1 nunca incluye C1', () => {
      const types1 = AdaptivePathService.getAllQuestionTypesFlat('A1', 1);
      const types4 = AdaptivePathService.getAllQuestionTypesFlat('A1', 4);
      expect(types1).not.toContain('part7_cloze_advanced');
      expect(types4).not.toContain('part7_cloze_advanced');
    });
  });

  describe('getStudentLevel', () => {
    it('retorna nivel si existe', async () => {
      db.executeQuery.mockResolvedValueOnce({ recordset: [{ EnglishLevel: 'B2' }] });
      const level = await AdaptivePathService.getStudentLevel(1);
      expect(level).toBe('B2');
    });

    it('retorna null si no existe', async () => {
      db.executeQuery.mockResolvedValueOnce({ recordset: [] });
      const level = await AdaptivePathService.getStudentLevel(1);
      expect(level).toBeNull();
    });
  });

  describe('generateAdaptivePath', () => {
    it('guarda en BD correctamente', async () => {
      db.executeQuery.mockResolvedValue({});
      const result = await AdaptivePathService.generateAdaptivePath(1, 50); // B1
      expect(result.level).toBe('B1');
      expect(result.pathData.length).toBe(4);
      expect(db.executeQuery).toHaveBeenCalledTimes(5); // 1 update user, 4 weeks
    });
  });
});
