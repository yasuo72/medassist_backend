const qrcode = require('qrcode');
const User = require('../models/User');

// @desc    Generate a QR code for the logged-in user's emergency profile
// @route   GET /api/qr/generate
// @access  Private
exports.generateQrCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.emergencyId) {
      return res.status(404).json({ msg: 'Emergency ID not found for this user.' });
    }

    // The URL that the QR code will point to.
    // The base URL should be stored in an environment variable.
    // Example: http://localhost:3000 or your production frontend URL
    const emergencyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/emergency/view/${user.emergencyId}`;

    // Generate QR code as a Data URL (base64)
    const qrCodeDataUrl = await qrcode.toDataURL(emergencyUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.9,
      margin: 1,
    });

    res.json({ qrCodeDataUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get the data payload for writing to an NFC tag
// @route   GET /api/qr/nfc-payload
// @access  Private
exports.getNfcPayload = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.emergencyId) {
      return res.status(404).json({ msg: 'Emergency ID not found for this user.' });
    }

    const emergencyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/emergency/view/${user.emergencyId}`;

    // The payload is the URL itself. The mobile app will handle writing this to the NFC tag.
    res.json({ payload: emergencyUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
