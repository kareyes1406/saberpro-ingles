const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false
    },
    connectionTimeout: 30000,
    requestTimeout: 15000
};

console.log('🔌 Conectando a:', config.server, '/', config.database);

(async () => {
    try {
        const pool = await sql.connect(config);
        console.log('✅ Conexión exitosa!');
        
        const r1 = await pool.request().query('SELECT COUNT(*) as cnt FROM ModuleWeeks');
        console.log('✅ ModuleWeeks:', r1.recordset[0].cnt);
        
        const r2 = await pool.request().query('SELECT COUNT(*) as cnt FROM Activities');
        console.log('✅ Activities:', r2.recordset[0].cnt);
        
        const r3 = await pool.request().query('SELECT COUNT(*) as cnt FROM Users WHERE RoleID=3');
        console.log('✅ Estudiantes:', r3.recordset[0].cnt);
        
        const r4 = await pool.request().query('SELECT COUNT(*) as cnt FROM UserProgress');
        console.log('✅ UserProgress records:', r4.recordset[0].cnt);
        
        const r5 = await pool.request().query('SELECT COUNT(*) as cnt FROM Questions');
        console.log('✅ Questions:', r5.recordset[0].cnt);
        
        const r6 = await pool.request().query('SELECT WeekNumber, Title, IsBossWeek FROM ModuleWeeks ORDER BY WeekNumber');
        console.log('\n📅 Semanas actuales:');
        r6.recordset.forEach(w => {
            console.log('  Semana ' + w.WeekNumber + ': ' + w.Title + (w.IsBossWeek ? ' (BOSS)' : ''));
        });
        
        const r7 = await pool.request().query('SELECT COUNT(*) as cnt FROM UserExams');
        console.log('\n✅ UserExams:', r7.recordset[0].cnt);

        const r8 = await pool.request().query('SELECT * FROM ActivityTypes');
        console.log('\n📋 ActivityTypes:');
        r8.recordset.forEach(at => {
            console.log('  ID ' + at.ActivityTypeID + ': ' + at.TypeName + ' (' + (at.GameMechanic || 'N/A') + ')');
        });

        await pool.close();
        console.log('\n✅ Todo OK - conexión cerrada');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    process.exit(0);
})();
