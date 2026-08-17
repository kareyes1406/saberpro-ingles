/**
 * questions/index.js
 * Exporta todas las 245 preguntas organizadas por parte
 */
const part1Notices = require('./part1-notices');
const part2Matching = require('./part2-matching');
const part3Dialogues = require('./part3-dialogues');
const part4ClozeBasic = require('./part4-cloze-basic');
const part5Reading = require('./part5-reading');
const part6Critical = require('./part6-critical');
const part7ClozeAdvanced = require('./part7-cloze-advanced');

module.exports = {
    part1Notices,       // 35 preguntas - Avisos/Señales (A1)
    part2Matching,      // 35 preguntas - Vocabulario Matching (A1)
    part3Dialogues,     // 35 preguntas - Diálogos Cortos (A2)
    part4ClozeBasic,    // 35 preguntas - Cloze Test Básico (A2)
    part5Reading,       // 35 preguntas - Comprensión Lectora (B1)
    part6Critical,      // 35 preguntas - Lectura Crítica (B1-B2)
    part7ClozeAdvanced, // 35 preguntas - Cloze Test Avanzado (B2)
    
    // Utility: get total question count
    getTotalCount() {
        return part1Notices.length +
            (Array.isArray(part2Matching) 
                ? part2Matching.reduce((acc, set) => acc + (set.questions ? set.questions.length : 0), 0)
                : 0) +
            part3Dialogues.length +
            (Array.isArray(part4ClozeBasic)
                ? part4ClozeBasic.reduce((acc, text) => acc + (text.questions ? text.questions.length : 0), 0)
                : 0) +
            (Array.isArray(part5Reading)
                ? part5Reading.reduce((acc, text) => acc + (text.questions ? text.questions.length : 0), 0)
                : 0) +
            (Array.isArray(part6Critical)
                ? part6Critical.reduce((acc, text) => acc + (text.questions ? text.questions.length : 0), 0)
                : 0) +
            (Array.isArray(part7ClozeAdvanced)
                ? part7ClozeAdvanced.reduce((acc, text) => acc + (text.questions ? text.questions.length : 0), 0)
                : 0);
    }
};
