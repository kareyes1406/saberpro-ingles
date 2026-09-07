const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// Pre-test flow: intro (UDECIA explains) → start (actual exam)
router.get('/pre-test', examController.showPreTestIntro);
router.get('/pre-test/start', examController.showPreTest);
router.post('/submit', examController.submitExam);

module.exports = router;
