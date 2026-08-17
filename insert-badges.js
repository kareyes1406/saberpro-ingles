const { executeQuery } = require('./config/database');

async function insertBadges() {
    console.log('Insertando 10 nuevas medallas...');
    try {
        const badges = [
            { name: 'Estudiante Dedicado', desc: 'Alcanzar 200 de XP total', type: 'milestone', xp: 200 },
            { name: 'Maestro del Vocabulario', desc: 'Alcanzar 300 de XP total', type: 'milestone', xp: 300 },
            { name: 'Racha 14 Días', desc: 'Ingresar 14 días consecutivos', type: 'streak', xp: 0 },
            { name: 'Racha 30 Días', desc: 'Ingresar 30 días consecutivos', type: 'streak', xp: 0 },
            { name: 'Lector Implacable', desc: 'Alcanzar 400 de XP total', type: 'milestone', xp: 400 },
            { name: 'Experto en Gramática', desc: 'Alcanzar 500 de XP total', type: 'milestone', xp: 500 },
            { name: 'Estratega Pragmático', desc: 'Alcanzar 600 de XP total', type: 'milestone', xp: 600 },
            { name: 'Cerebro Bilingüe', desc: 'Alcanzar 800 de XP total', type: 'milestone', xp: 800 },
            { name: 'Leyenda Saber Pro', desc: 'Alcanzar 1000 de XP total', type: 'milestone', xp: 1000 },
            { name: 'Dios del Inglés', desc: 'Alcanzar 1500 de XP total', type: 'milestone', xp: 1500 }
        ];

        for (const b of badges) {
            // Check if exists
            const check = await executeQuery(`SELECT 1 FROM Badges WHERE BadgeName = '${b.name}'`);
            if (check.recordset.length === 0) {
                await executeQuery(`
                    INSERT INTO Badges (BadgeName, Description, BadgeType, XPRequired) 
                    VALUES ('${b.name}', '${b.desc}', '${b.type}', ${b.xp})
                `);
                console.log(`✅ Insertada: ${b.name}`);
            } else {
                console.log(`⚠️ Ya existe: ${b.name}`);
            }
        }
        console.log('Proceso terminado exitosamente.');
    } catch(err) {
        console.error('Error insertando medallas:', err);
    }
    process.exit(0);
}

insertBadges();
