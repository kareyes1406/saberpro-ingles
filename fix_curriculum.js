const { executeQuery, sql } = require('./config/database');

async function fixCurriculum() {
    try {
        console.log('Fetching all weeks...');
        const weeksRes = await executeQuery('SELECT WeekID FROM ModuleWeeks ORDER BY WeekID');
        const weeks = weeksRes.recordset;

        const types = [1, 2, 4, 5]; // Vocab, Reading, Pragmatics, Grammar

        for (let w of weeks) {
            const weekId = w.WeekID;
            console.log('Fixing Week:', weekId);
            
            const actRes = await executeQuery('SELECT ActivityID FROM Activities WHERE WeekID = @WeekID ORDER BY SortOrder, ActivityID', [{name: 'WeekID', type: sql.Int, value: weekId}]);
            const activities = actRes.recordset;

            for (let i = 0; i < activities.length; i++) {
                const actId = activities[i].ActivityID;
                let newType;
                let newTitle;

                if (i === activities.length - 1) {
                    // Last activity is Boss Battle
                    newType = 3;
                    newTitle = 'Jefe del Corte';
                } else {
                    // Mix types
                    newType = types[i % types.length];
                    // Or perfectly random: newType = types[Math.floor(Math.random() * types.length)];
                    // Let's use round-robin so they are evenly mixed
                    
                    if (newType === 1) newTitle = 'Vocabulario ' + (i + 1);
                    else if (newType === 2) newTitle = 'Lectura ' + (i + 1);
                    else if (newType === 4) newTitle = 'Pragmática ' + (i + 1);
                    else if (newType === 5) newTitle = 'Gramática ' + (i + 1);
                }

                await executeQuery('UPDATE Activities SET ActivityTypeID = @Type, Title = @Title WHERE ActivityID = @ActID', [
                    {name: 'Type', type: sql.Int, value: newType},
                    {name: 'Title', type: sql.NVarChar, value: newTitle},
                    {name: 'ActID', type: sql.Int, value: actId}
                ]);
            }
        }
        
        // Ensure BossBattle week flag is set correctly on ModuleWeeks
        // Wait, the user said 12 bosses. So EVERY week is a BossWeek?
        await executeQuery('UPDATE ModuleWeeks SET IsBossWeek = 1');

        console.log('Curriculum fixed successfully!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixCurriculum();

