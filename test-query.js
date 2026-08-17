const { executeQuery } = require('./config/database');

async function test() {
    try {
        const res = await executeQuery("SELECT TOP 5 QuestionID, QuestionType, MediaUrl, ReadingPassage FROM Questions WHERE QuestionType='part4_cloze'");
        console.log(res.recordset);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
test();
