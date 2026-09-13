// ==========================================================
// Admin Routes (Protected Endpoints)
// ==========================================================

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateAdmin = require('../middleware/authMiddleware');

// Public admin login
router.post('/login', adminController.login);

// Protected routes (require valid JWT bearer token)
router.use(authenticateAdmin);

// Dashboard statistics
router.get('/stats', adminController.getStats);

// Waitlist users management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.post('/users/batch-grant', adminController.batchGrantAccess);
router.delete('/users/:id', adminController.deleteUser);

// Waitlist export
router.get('/export/csv', adminController.exportCsv);

// Email logs / outbox
router.get('/emails', adminController.getEmailLogs);

module.exports = router;
