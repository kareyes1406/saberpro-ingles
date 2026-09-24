const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// Pre-test flow: intro (UDECIA explains) → start (actual exam)
router.get('/pre-test', examController.showPreTestIntro);
router.get('/pre-test/start', examController.showPreTest);

// Post-test flow: intro → start
router.get('/post-test', examController.showPostTestIntro);
router.get('/post-test/start', examController.showPostTest);

router.post('/submit', examController.submitExam);

module.exports = router;
