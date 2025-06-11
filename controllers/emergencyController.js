const User = require('../models/User');

// Helper function for cosine similarity (can be moved to a utils file)
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}
const FamilyMember = require('../models/FamilyMember');

// @desc    Get public emergency profile by emergency ID
// @route   GET /api/emergency/:emergencyId
// @access  Public
exports.getEmergencyProfile = async (req, res) => {
  try {
    // Find the user by their unique emergency ID
    const user = await User.findOne({ emergencyId: req.params.emergencyId });

    if (!user) {
      return res.status(404).json({ msg: 'Emergency profile not found' });
    }

    // Find associated family members
    const familyMembers = await FamilyMember.find({ guardian: user._id });

    // Construct a safe, public-facing profile
    const publicProfile = {
      user: {
        name: user.name,
        // Add other safe-to-share fields from the User model here if needed
      },
      familyMembers: familyMembers.map(member => ({
        name: member.name,
        relationship: member.relationship,
        dateOfBirth: member.dateOfBirth,
        bloodGroup: member.bloodGroup,
        allergies: member.allergies,
        medicalConditions: member.medicalConditions,
      })),
      // We can also add a summarized list of the user's own medical conditions if stored on the user model
    };

    res.json(publicProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Verify biometric data publicly and return emergency profile
// @route   POST /api/emergency/verify-biometric
// @access  Public
exports.verifyBiometricPublic = async (req, res) => {
  const { faceEmbedding, fingerprintHash } = req.body;

  if (!faceEmbedding && !fingerprintHash) {
    return res.status(400).json({ msg: 'Biometric data is required' });
  }

  try {
    let user;
    // Handle fingerprint hash (exact match)
    if (fingerprintHash) {
      user = await User.findOne({ fingerprintHash });
    }
    // Handle face embedding (similarity search)
    else if (faceEmbedding) {
      const incomingEmbedding = faceEmbedding.split(',').map(Number);
      if (incomingEmbedding.some(isNaN)) {
        return res.status(400).json({ msg: 'Invalid face embedding format' });
      }

      const usersWithFaceData = await User.find({ faceEmbedding: { $exists: true, $ne: null } });
      if (usersWithFaceData.length === 0) {
        return res.status(404).json({ msg: 'No users with face data registered' });
      }

      let bestMatch = null;
      let maxSimilarity = -1;

      for (const u of usersWithFaceData) {
        const storedEmbedding = u.faceEmbedding.split(',').map(Number);
        if (storedEmbedding.length === incomingEmbedding.length) {
          const similarity = cosineSimilarity(incomingEmbedding, storedEmbedding);
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatch = u;
          }
        }
      }

      const SIMILARITY_THRESHOLD = 0.9; // This should be tuned
      if (bestMatch && maxSimilarity >= SIMILARITY_THRESHOLD) {
        user = bestMatch;
      }
    }

    if (!user) {
      return res.status(404).json({ msg: 'No matching user found' });
    }

    // If a user is found, return their public emergency profile
    const familyMembers = await FamilyMember.find({ guardian: user._id });
    const publicProfile = {
      user: { name: user.name },
      familyMembers: familyMembers.map(m => ({
        name: m.name,
        relationship: m.relationship,
        bloodGroup: m.bloodGroup,
        allergies: m.allergies,
        medicalConditions: m.medicalConditions,
      })),
    };

    res.json(publicProfile);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
