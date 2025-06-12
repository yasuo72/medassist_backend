const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// Helper function for cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

exports.getLoggedInUser = async (req, res) => {
  try {
    // req.user is assigned by the auth middleware
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addFaceEmbedding = async (req, res) => {
  const { faceEmbedding } = req.body;

  // Basic validation
  if (!faceEmbedding) {
    return res.status(400).json({ msg: 'Face embedding is required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.faceEmbedding = faceEmbedding;
    await user.save();

    res.json({ msg: 'Face embedding added successfully', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addFingerprintHash = async (req, res) => {
  const { fingerprintHash } = req.body;

  // Basic validation
  if (!fingerprintHash) {
    return res.status(400).json({ msg: 'Fingerprint hash is required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.fingerprintHash = fingerprintHash;
    await user.save();

    res.json({ msg: 'Fingerprint hash added successfully', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.verifyBiometric = async (req, res) => {
  const { faceEmbedding, fingerprintHash } = req.body;

  if (!faceEmbedding && !fingerprintHash) {
    return res.status(400).json({ msg: 'Biometric data is required for verification' });
  }

  try {
    // Handle fingerprint hash (exact match)
    if (fingerprintHash) {
      const user = await User.findOne({ fingerprintHash }).select('-password');
      if (!user) {
        return res.status(404).json({ msg: 'No matching user found for fingerprint' });
      }
      return res.json(user);
    }

    // Handle face embedding (similarity search)
    if (faceEmbedding) {
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

      for (const user of usersWithFaceData) {
        const storedEmbedding = user.faceEmbedding.split(',').map(Number);
        if (storedEmbedding.length === incomingEmbedding.length) {
          const similarity = cosineSimilarity(incomingEmbedding, storedEmbedding);
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatch = user;
          }
        }
      }

      const SIMILARITY_THRESHOLD = 0.9; // This should be tuned
      if (bestMatch && maxSimilarity >= SIMILARITY_THRESHOLD) {
        const userObject = bestMatch.toObject();
        delete userObject.password;
        // Also remove sensitive biometric data before returning
        delete userObject.faceEmbedding;
        delete userObject.fingerprintHash;
        return res.json(userObject);
      } else {
        return res.status(404).json({ msg: 'No matching user found' });
      }
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        const userSafe = { id: user.id, name: user.name, email: user.email };
        res.json({ token, user: userSafe });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Handle Google auth callback and issue JWT
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = (req, res) => {
  // Passport attaches the user to req.user after successful authentication
  const payload = { user: { id: req.user.id } };

  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: 360000 },
    (err, token) => {
      if (err) throw err;
      // Redirect to a frontend route that can handle the token.
      // This is often a deep link for mobile apps.
      res.redirect(`medassist://auth?token=${token}`);
    }
  );
};

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({ name, email, password });
    user.emergencyId = uuidv4();

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    // IMPORTANT: Make sure you have JWT_SECRET in your .env file
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 }, // Expires in 100 hours
      (err, token) => {
        if (err) throw err;
        const userSafe = { id: user.id, name: user.name, email: user.email };
        res.json({ token, user: userSafe });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
