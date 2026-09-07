const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');

router.get('/dashboard', professorController.showDashboard);
router.get('/students/:id/detail', professorController.showStudentDetail);
router.get('/kpis/data', professorController.getKPIData);

module.exports = router;
