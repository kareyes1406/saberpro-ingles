/**
 * create-completed-user.js
 * Crea un usuario de demostración con todos los 240 sub-módulos completados.
 * Usuario: demo@saberpro.edu.co / DemoSaberPro2026!
 */
const bcrypt = require('bcryptjs');
const { executeQuery, sql } = require('./config/database');

async function run() {
    try {
        console.log("=== CREANDO USUARIO CON PROGRESO COMPLETO ===");

        const email = 'demo@saberpro.edu.co';
        const password = 'DemoSaberPro2026!';
        const firstName = 'Demo';
        const lastName = 'Completado';

        // 1. Delete existing demo user if exists
        const existing = await executeQuery(
            `SELECT UserID FROM Users WHERE Email = @Email`,
            [{ name: 'Email', type: sql.NVarChar, value: email }]
        );
        if (existing.recordset.length > 0) {
            const uid = existing.recordset[0].UserID;
            await executeQuery(`DELETE FROM UserBadges WHERE UserID = @UID`, [{ name: 'UID', type: sql.Int, value: uid }]);
            await executeQuery(`DELETE FROM UserGamification WHERE UserID = @UID`, [{ name: 'UID', type: sql.Int, value: uid }]);
            await executeQuery(`DELETE FROM EvaluationResults WHERE UserID = @UID`, [{ name: 'UID', type: sql.Int, value: uid }]);
            await executeQuery(`DELETE FROM UserProgress WHERE UserID = @UID`, [{ name: 'UID', type: sql.Int, value: uid }]);
            await executeQuery(`DELETE FROM Users WHERE UserID = @UID`, [{ name: 'UID', type: sql.Int, value: uid }]);
            console.log("Usuario demo existente eliminado.");
        }

        // 2. Create user (roleId 2 = student)
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const userRes = await executeQuery(`
            INSERT INTO Users (FirstName, LastName, Email, PasswordHash, RoleID, IsActive)
            OUTPUT INSERTED.UserID
            VALUES (@FirstName, @LastName, @Email, @Hash, 1, 1)
        `, [
            { name: 'FirstName', type: sql.NVarChar, value: firstName },
            { name: 'LastName', type: sql.NVarChar, value: lastName },
            { name: 'Email', type: sql.NVarChar, value: email },
            { name: 'Hash', type: sql.NVarChar, value: hash }
        ]);
        const userId = userRes.recordset[0].UserID;
        console.log(`Usuario creado con ID: ${userId}`);

        // 3. Get all activities
        const actRes = await executeQuery(`SELECT ActivityID, XPReward, CoinReward FROM Activities ORDER BY ActivityID`);
        const activities = actRes.recordset;
        console.log(`Marcando ${activities.length} actividades como completadas...`);

        let totalXP = 0;
        let totalCoins = 0;

        for (const act of activities) {
            await executeQuery(`
                INSERT INTO UserProgress (UserID, ActivityID, IsCompleted, Score, TimeSpentSeconds, CompletedAt, AttemptNumber)
                VALUES (@UserID, @ActivityID, 1, 100.00, 120, GETDATE(), 1)
            `, [
                { name: 'UserID', type: sql.Int, value: userId },
                { name: 'ActivityID', type: sql.Int, value: act.ActivityID }
            ]);
            totalXP += act.XPReward || 0;
            totalCoins += act.CoinReward || 0;
        }

        // 4. Set gamification stats
        const level = Math.floor(totalXP / 500) + 1;
        await executeQuery(`
            INSERT INTO UserGamification (UserID, TotalXP, Level, CurrentStreak, LongestStreak, TotalCoins, CoinsSpent, LastActivityDate)
            VALUES (@UserID, @TotalXP, @Level, 12, 12, @TotalCoins, 0, GETDATE())
        `, [
            { name: 'UserID', type: sql.Int, value: userId },
            { name: 'TotalXP', type: sql.Int, value: totalXP },
            { name: 'Level', type: sql.Int, value: level },
            { name: 'TotalCoins', type: sql.Int, value: totalCoins }
        ]);

        // 5. Award all badges available
        const badgeRes = await executeQuery(`SELECT BadgeID FROM Badges`);
        for (const badge of badgeRes.recordset) {
            await executeQuery(`
                INSERT INTO UserBadges (UserID, BadgeID, EarnedAt, IsDisplayed)
                VALUES (@UserID, @BadgeID, GETDATE(), 1)
            `, [
                { name: 'UserID', type: sql.Int, value: userId },
                { name: 'BadgeID', type: sql.Int, value: badge.BadgeID }
            ]);
        }

        console.log(`\n========================================`);
        console.log(`✅ USUARIO DEMO CREADO CON ÉXITO`);
        console.log(`========================================`);
        console.log(`📧 Email:    ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`🏆 Total XP: ${totalXP}`);
        console.log(`🎖️  Nivel:    ${level}`);
        console.log(`🪙 Monedas:  ${totalCoins}`);
        console.log(`✅ Actividades completadas: ${activities.length}/240`);
        console.log(`========================================\n`);

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        process.exit();
    }
}

run();
