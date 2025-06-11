const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const qrController = require('../controllers/qrController');

// @route   GET /api/qr/generate
// @desc    Generate a QR code for the user's emergency profile
// @access  Private
router.get('/generate', auth, qrController.generateQrCode);

// @route   GET /api/qr/nfc-payload
// @desc    Get the data payload to write to an NFC tag
// @access  Private
router.get('/nfc-payload', auth, qrController.getNfcPayload);

module.exports = router;
