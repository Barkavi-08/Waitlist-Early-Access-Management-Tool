// ==========================================================
// Waitlist Routes (Public Endpoints)
// ==========================================================

const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');

// Join the waitlist
router.post('/join', waitlistController.joinWaitlist);

// Check position / status by email or referral code
router.get('/status', waitlistController.getStatus);

// Get high-level stats for landing page counter & preview
router.get('/public-stats', waitlistController.getPublicStats);

module.exports = router;
