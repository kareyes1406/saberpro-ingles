const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Routes: GET / (roadmap), GET /week/:weekId, GET /profile
router.get('/', studentController.showRoadmap);
router.get('/week/:weekId', studentController.showWeek);
router.get('/profile', studentController.showProfile);
router.put('/profile/update', studentController.updateProfile);

module.exports = router;
