const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Routes: GET /dashboard, GET /users, POST /users, PUT /users/:id, DELETE /users/:id, GET /kpis, GET /kpis/data (AJAX JSON endpoint)
router.get('/dashboard', adminController.showDashboard);
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/kpis/data', adminController.getKPIData);
router.get('/profile', adminController.showProfile);
router.get('/students/:id/detail', adminController.showStudentDetail);

module.exports = router;
