const qrcode = require('qrcode');
const User = require('../models/User');

// @desc    Generate a QR code for the logged-in user's emergency profile
// @route   GET /api/qr/generate
// @access  Private
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Helper function to ensure emergency ID exists
async function ensureEmergencyId(user) {
  try {
    if (user.emergencyId) {
      console.log(`Existing emergency ID found: ${user.emergencyId}`);
      // Verify the ID exists in the database
      const existingUser = await User.findOne({ emergencyId: user.emergencyId });
      if (!existingUser) {
        console.log('Existing emergency ID not found in database, generating new one');
        user.emergencyId = null;
      } else {
        return user.emergencyId;
      }
    }
    
    // Generate a unique emergency ID
    let emergencyId = uuidv4();
    console.log(`Generated new emergency ID: ${emergencyId}`);
    
    // Ensure the ID is unique
    let attempts = 0;
    const maxAttempts = 10;
    let isUnique = false;
    
    while (!isUnique && attempts < maxAttempts) {
      attempts++;
      const existing = await User.findOne({ emergencyId });
      if (!existing) {
        isUnique = true;
      } else {
        emergencyId = uuidv4();
        console.log(`Generated new emergency ID (attempt ${attempts}): ${emergencyId}`);
      }
    }
    
    if (!isUnique) {
      throw new Error('Failed to generate unique emergency ID after multiple attempts');
    }
    
    // Update user with emergency ID
    user.emergencyId = emergencyId;
    
    // Save with retry mechanism
    let saveAttempts = 0;
    const maxSaveAttempts = 3;
    let saveSuccess = false;
    
    while (!saveSuccess && saveAttempts < maxSaveAttempts) {
      try {
        await user.save();
        saveSuccess = true;
        console.log(`Emergency ID saved successfully: ${emergencyId}`);
      } catch (saveErr) {
        saveAttempts++;
        console.error(`Save attempt ${saveAttempts} failed:`, saveErr);
        if (saveAttempts >= maxSaveAttempts) {
          throw new Error(`Failed to save user after ${maxSaveAttempts} attempts: ${saveErr.message}`);
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempts));
      }
    }
    
    // Verify the ID was saved
    const savedUser = await User.findById(user._id);
    if (!savedUser || !savedUser.emergencyId) {
      throw new Error('Emergency ID not saved in database');
    }
    
    return emergencyId;
  } catch (err) {
    console.error('Error in ensureEmergencyId:', err);
    throw err;
  }
}

exports.generateQrCode = async (req, res) => {
  try {
    console.log('QR code generation started');
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('User not found for ID:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }

    // Ensure emergency ID exists and is unique
    const emergencyId = await ensureEmergencyId(user);
    console.log(`Using emergency ID: ${emergencyId}`);

    // Get user's medical profile data
    const medicalProfile = {
      emergencyId,
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
      emergencyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/emergency/view/${emergencyId}`
    };

    // For the new lightweight flow we encode only the emergencyId in the QR.
    const qrContent = emergencyId; // a short opaque string

    // Verify the emergency ID is accessible
    const testUser = await User.findOne({ emergencyId });
    if (!testUser) {
      throw new Error('Emergency ID not accessible after generation');
    }

    res.json({
      emergencyId,
      emergencyUrl: qrData.emergencyUrl,
    });
  } catch (err) {
    console.error('Error in generateQrCode:', err);
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
