const qrcode = require('qrcode');
const User = require('../models/User');

// @desc    Generate a QR code for the logged-in user's emergency profile
// @route   GET /api/qr/generate
// @access  Private
const crypto = require('crypto');

exports.generateQrCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate or get existing emergency ID
    if (!user.emergencyId) {
      // Generate a unique emergency ID using crypto
      const emergencyId = crypto.randomUUID();
      user.emergencyId = emergencyId;
      await user.save();
    }

    // Get user's medical profile data
    const medicalProfile = {
      emergencyId: user.emergencyId,
      bloodGroup: user.bloodGroup || 'Not specified',
      allergies: user.allergies || [],
      medicalConditions: user.medicalConditions || [],
      currentMedications: user.currentMedications || [],
      emergencyContacts: user.emergencyContacts || [],
      date: user.date
    };

    // Create a structured data object for QR code
    const qrData = {
      type: 'MEDICAL_PROFILE',
      version: '1.0',
      data: medicalProfile,
      emergencyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/emergency/view/${user.emergencyId}`
    };

    // Convert to JSON string and encode
    const qrContent = JSON.stringify(qrData);

    // Generate QR code with medical data
    const qrCodeDataUrl = await qrcode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.9,
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    res.json({ 
      qrCodeDataUrl,
      qrContent, // For debugging
      emergencyUrl: qrData.emergencyUrl,
      emergencyId: user.emergencyId
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ 
      error: 'Failed to generate QR code',
      details: err.message 
    });
  }
};

// Helper function to verify QR code content
exports.verifyQrCode = async (req, res) => {
  try {
    const { qrContent } = req.body;
    
    if (!qrContent) {
      return res.status(400).json({ msg: 'QR content is required' });
    }

    // Parse the QR code content
    const qrData = JSON.parse(qrContent);
    
    // Verify the QR code type and version
    if (qrData.type !== 'MEDICAL_PROFILE' || qrData.version !== '1.0') {
      return res.status(400).json({ msg: 'Invalid QR code format' });
    }

    // Get the emergency profile
    const user = await User.findOne({ emergencyId: qrData.data.emergencyId });
    if (!user) {
      return res.status(404).json({ msg: 'Emergency profile not found' });
    }

    // Return the user's medical profile
    res.json({
      ...qrData.data,
      emergencyUrl: qrData.emergencyUrl
    });
  } catch (err) {
    console.error('Error verifying QR code:', err);
    res.status(500).json({ 
      error: 'Failed to verify QR code',
      details: err.message 
    });
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
