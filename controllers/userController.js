const User = require('../models/User');

// @desc    Get all emergency contacts for a user
// @route   GET /api/user/contacts
// @access  Private
exports.getEmergencyContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.emergencyContacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add an emergency contact
// @route   POST /api/user/contacts
// @access  Private
exports.addEmergencyContact = async (req, res) => {
  const { name, phone, relationship, isPriority = false, shareMedicalSummary = false } = req.body;

  if (!name || !phone || !relationship) {
    return res.status(400).json({ msg: 'Please provide name, phone, and relationship' });
  }

  const newContact = { name, phone, relationship, isPriority, shareMedicalSummary };

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.emergencyContacts.push(newContact);
    await user.save();
    res.json(user.emergencyContacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete an emergency contact
// @route   DELETE /api/user/contacts/:contactId
// @access  Private
exports.deleteEmergencyContact = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Find the index of the contact to remove
    const removeIndex = user.emergencyContacts.findIndex(
      (contact) => contact.id === req.params.contactId
    );

    if (removeIndex === -1) {
      return res.status(404).json({ msg: 'Contact not found' });
    }

    user.emergencyContacts.splice(removeIndex, 1);
    await user.save();
    res.json(user.emergencyContacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update an emergency contact
// @route   PUT /api/user/contacts/:contactId
// @access  Private
exports.updateEmergencyContact = async (req, res) => {
  const { name, phone, relationship, isPriority, shareMedicalSummary } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const contact = user.emergencyContacts.id(req.params.contactId);
    if (!contact) {
      return res.status(404).json({ msg: 'Contact not found' });
    }

    if (name) contact.name = name;
    if (phone) contact.phone = phone;
    if (relationship) contact.relationship = relationship;
    if (typeof isPriority !== 'undefined') contact.isPriority = isPriority;
    if (typeof shareMedicalSummary !== 'undefined') contact.shareMedicalSummary = shareMedicalSummary;

    await user.save();
    res.json(user.emergencyContacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// =========================
//  Profile CRUD Endpoints
// =========================

// @desc    Get logged-in user's profile (medical + basic)
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // exclude password
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create / update medical profile for the logged-in user
// @route   POST /api/user/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const {
    name,
    bloodGroup,
    medicalConditions,
    allergies,
    pastSurgeries,
    currentMedications,
    reportFilePaths,
    faceEmbedding,
    fingerprintHash,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Update basic + medical fields only if provided
    if (name !== undefined) user.name = name;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (medicalConditions !== undefined) user.medicalConditions = medicalConditions;
    if (allergies !== undefined) user.allergies = allergies;
    if (pastSurgeries !== undefined) user.pastSurgeries = pastSurgeries;
    if (currentMedications !== undefined) user.currentMedications = currentMedications;
    if (reportFilePaths !== undefined) user.reportFilePaths = reportFilePaths;
    if (faceEmbedding !== undefined) user.faceEmbedding = faceEmbedding;
    if (fingerprintHash !== undefined) user.fingerprintHash = fingerprintHash;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
