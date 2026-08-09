const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Routes:
// - GET /vocabulary/:activityId
// - POST /vocabulary/submit
// - GET /reading/:activityId
// - POST /reading/submit
// - GET /boss/:activityId
// - POST /boss/submit
// - GET /pragmatics/:activityId
// - POST /pragmatics/submit
// - GET /grammar/:activityId
// - POST /grammar/submit
// - POST /xp/award (AJAX endpoint)
// - GET /progress/:moduleId (AJAX endpoint)

router.get('/vocabulary/:activityId', gameController.showVocabulary);
router.post('/vocabulary/submit', gameController.submitVocabulary);

router.get('/reading/:activityId', gameController.showReading);
router.post('/reading/submit', gameController.submitReading);

router.get('/pragmatics/:activityId', gameController.showPragmatics);
router.post('/pragmatics/submit', gameController.submitPragmatics);

router.get('/grammar/:activityId', gameController.showGrammar);
router.post('/grammar/submit', gameController.submitGrammar);

router.get('/boss/:activityId', gameController.showBossBattle);
router.post('/boss/submit', gameController.submitBossBattle);
router.post('/boss/check-answer', gameController.checkBossAnswer);

router.post('/xp/award', gameController.awardXP);
router.get('/progress/:moduleId', gameController.getModuleProgress);

// Dev cheats
router.post('/cheat/skip-activity', gameController.cheatSkipActivity);
router.post('/cheat/skip-week', gameController.cheatSkipWeek);

module.exports = router;
