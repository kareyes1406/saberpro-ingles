const { executeQuery, sql } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function checkTables() {
    try {
        const query = `
            SELECT t.name AS TableName, SUM(p.rows) AS [RowCount] 
            FROM sys.tables t 
            INNER JOIN sys.partitions p ON t.object_id = p.object_id 
            WHERE p.index_id IN (0, 1) 
            GROUP BY t.name 
            ORDER BY [RowCount] DESC
        `;
        const result = await executeQuery(query);
        console.log('TABLES FOUND:');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error('Error checking tables:', err);
        process.exit(1);
    }
}

checkTables();
