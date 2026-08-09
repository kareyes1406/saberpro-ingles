const { executeQuery } = require('../config/database');

async function updateDB() {
    try {
        console.log('Buscando y eliminando restricción CHECK antigua en Questions...');
        const query = `
            DECLARE @ConstraintName nvarchar(200)
            SELECT @ConstraintName = Name 
            FROM sys.check_constraints
            WHERE parent_object_id = object_id('Questions') 
            AND col_name(parent_object_id, parent_column_id) = 'QuestionType'

            IF @ConstraintName IS NOT NULL
            BEGIN
                EXEC('ALTER TABLE Questions DROP CONSTRAINT ' + @ConstraintName)
            END

            ALTER TABLE Questions ADD CONSTRAINT CHK_QuestionType_New CHECK (QuestionType IN ('vocabulary_match','drag_drop','boss_multiple_choice','pragmatics_map','grammar_circuit'))
        `;
        await executeQuery(query);
        console.log('Restricción actualizada.');

        console.log('Agregando ActivityTypes...');
        await executeQuery(`
            IF NOT EXISTS (SELECT 1 FROM ActivityTypes WHERE TypeName = 'Pragmatics')
            BEGIN
                INSERT INTO ActivityTypes (TypeName, Description, GameMechanic) VALUES ('Pragmatics', 'El Coordinador Urbano (Situacional)', 'pragmatics_map');
            END
            IF NOT EXISTS (SELECT 1 FROM ActivityTypes WHERE TypeName = 'Grammar')
            BEGIN
                INSERT INTO ActivityTypes (TypeName, Description, GameMechanic) VALUES ('Grammar', 'Circuitos y Ensamblaje (Gramática)', 'grammar_circuit');
            END
        `);
        console.log('ActivityTypes actualizados.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
updateDB();
