const { executeQuery } = require('../config/database');

async function fixConstraints() {
    try {
        const sql = `
            DECLARE @sql NVARCHAR(MAX) = '';
            SELECT @sql += 'ALTER TABLE Questions DROP CONSTRAINT [' + name + ']; '
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('Questions');

            IF LEN(@sql) > 0 EXEC(@sql);

            ALTER TABLE Questions ADD CONSTRAINT CK_Questions_QuestionType CHECK (QuestionType IN (
                'vocabulary_match',
                'drag_drop',
                'boss_multiple_choice',
                'pragmatics_map',
                'grammar_circuit',
                'part1_notice',
                'part2_matching',
                'part3_dialogue',
                'part4_cloze',
                'part5_reading',
                'part6_critical',
                'part7_cloze_advanced'
            ));
        `;
        await executeQuery(sql);
        console.log('✅ RESTRICCIONES DE QUESTIONS ACTUALIZADAS CORRECTAMENTE.');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing constraints:', err);
        process.exit(1);
    }
}

fixConstraints();
