const FamilyMember = require('../models/FamilyMember');
const User = require('../models/User');

// @desc    Add a new family member
// @route   POST /api/family
// @access  Private
exports.addFamilyMember = async (req, res) => {
  const { name, relationship, relation, medicalTag, emergencyId, summaryUrl, dateOfBirth, bloodGroup, allergies, medicalConditions } = req.body;

  // Accept either 'relationship' or deprecated 'relation' field from client
    const resolvedRelationship = relationship || relation;

    // Basic validation
  if (!name || !resolvedRelationship) {
    return res.status(400).json({ msg: 'Name and relationship are required' });
  }

  try {
    const newFamilyMember = new FamilyMember({
      guardian: req.user.id,
      name,
      relationship: resolvedRelationship,
      dateOfBirth,
      bloodGroup,
      allergies,
      medicalConditions,
      emergencyId,
      summaryUrl,
      medicalTag,
    });

    const familyMember = await newFamilyMember.save();
    res.json({ success: true, data: familyMember });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all family members for a user
// @route   GET /api/family
// @access  Private
exports.getFamilyMembers = async (req, res) => {
  try {
    const familyMembers = await FamilyMember.find({ guardian: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: familyMembers });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a family member's details
// @route   PUT /api/family/:id
// @access  Private
exports.updateFamilyMember = async (req, res) => {
  const { name, relationship, relation, medicalTag, emergencyId, summaryUrl, dateOfBirth, bloodGroup, allergies, medicalConditions } = req.body;

  // Build a fields object to update
  const memberFields = {};
  if (name) memberFields.name = name;
    if (relationship) memberFields.relationship = relationship;
  if (!relationship && relation) memberFields.relationship = relation;
  if (dateOfBirth) memberFields.dateOfBirth = dateOfBirth;
  if (bloodGroup) memberFields.bloodGroup = bloodGroup;
  if (allergies) memberFields.allergies = allergies;
  if (medicalConditions) memberFields.medicalConditions = medicalConditions;
  if (medicalTag) memberFields.medicalTag = medicalTag;
  if (emergencyId) memberFields.emergencyId = emergencyId;
  if (summaryUrl) memberFields.summaryUrl = summaryUrl;

  try {
    let member = await FamilyMember.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ msg: 'Family member not found' });
    }

    // Ensure the user is the guardian
    if (member.guardian.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    member = await FamilyMember.findByIdAndUpdate(
      req.params.id,
      { $set: memberFields },
      { new: true } // Return the updated document
    );

    res.json(member);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a family member
// @route   DELETE /api/family/:id
// @access  Private
exports.deleteFamilyMember = async (req, res) => {
  try {
    let member = await FamilyMember.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ msg: 'Family member not found' });
    }

    // Ensure the user is the guardian
    if (member.guardian.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await FamilyMember.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Family member removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Upload medical summary (PDF/Image)
// @route   POST /api/family/summary
// @access  Private
exports.uploadSummary = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'file is required' });
    }
    const fileUrl = `${process.env.BASE_URL || req.protocol + '://' + req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Public get summary URL by emergencyId
// @route   GET /api/family/summary/:emergencyId
// @access  Public
exports.getSummaryByEmergencyId = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const member = await FamilyMember.findOne({ emergencyId });
    if (!member || !member.summaryUrl) {
      return res.status(404).json({ success: false, message: 'Summary not found' });
    }
    res.json({ success: true, url: member.summaryUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
