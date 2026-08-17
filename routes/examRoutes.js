const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

router.get('/pre-test', examController.showPreTest);
router.post('/submit', examController.submitExam);

module.exports = router;
