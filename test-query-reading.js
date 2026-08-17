const { executeQuery } = require('./config/database');

async function test() {
    try {
        const query = `
            SELECT Q.QuestionID, QO.OptionID, QO.OptionText, QO.IsCorrect 
            FROM Questions Q 
            INNER JOIN QuestionOptions QO ON Q.QuestionID = QO.QuestionID 
            WHERE Q.QuestionType = 'part5_reading'
        `;
        const res = await executeQuery(query);
        const doubleCorrect = [];
        const map = {};
        res.recordset.forEach(row => {
            if (!map[row.QuestionID]) map[row.QuestionID] = 0;
            if (row.IsCorrect) map[row.QuestionID]++;
        });
        
        for (const [qid, count] of Object.entries(map)) {
            if (count > 1) doubleCorrect.push(qid);
        }
        
        console.log("Questions with multiple correct options:", doubleCorrect);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
test();
