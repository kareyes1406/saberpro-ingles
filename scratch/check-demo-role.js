const { executeQuery, sql } = require('../config/database');

async function run() {
    // Check all roles first
    const roles = await executeQuery('SELECT RoleID, RoleName FROM Roles ORDER BY RoleID');
    console.log('Roles en la BD:', roles.recordset);

    // Find the student role ID
    const studentRole = roles.recordset.find(r => r.RoleName.toLowerCase().includes('student') || r.RoleName.toLowerCase().includes('estudiante'));
    console.log('Rol estudiante encontrado:', studentRole);

    if (studentRole) {
        await executeQuery(
            'UPDATE Users SET RoleID = @RoleID WHERE Email = @Email',
            [
                { name: 'RoleID', type: sql.Int, value: studentRole.RoleID },
                { name: 'Email', type: sql.NVarChar, value: 'demo@saberpro.edu.co' }
            ]
        );
        console.log(`✅ Usuario demo actualizado a RoleID ${studentRole.RoleID} (${studentRole.RoleName})`);
    } else {
        console.log('⚠️  No se encontró rol de estudiante. Roles disponibles:', roles.recordset);
    }

    process.exit();
}
run().catch(e => { console.error(e.message); process.exit(1); });
