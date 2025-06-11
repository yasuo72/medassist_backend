const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const alertController = require('../controllers/alertController');

// @route   POST /api/alert/crash
// @desc    Trigger a crash detection alert
// @access  Private
router.post('/crash', auth, alertController.triggerCrashAlert);

module.exports = router;
