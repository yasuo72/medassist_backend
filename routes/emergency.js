const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// @route   GET /api/emergency/:emergencyId
// @desc    Get public emergency profile by emergency ID
// @access  Public
router.get('/:emergencyId', emergencyController.getEmergencyProfile);

// @route   POST /api/emergency/verify-biometric
// @desc    Verify biometric data publicly to get emergency profile
// @access  Public
router.post('/verify-biometric', apiKeyAuth, emergencyController.verifyBiometricPublic);

module.exports = router;
