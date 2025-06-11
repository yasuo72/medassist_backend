const express = require('express');
const router = express.Router();
const passport = require('passport');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   GET /api/auth
// @desc    Get logged in user
// @access  Private
router.get('/', auth, authController.getLoggedInUser);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  authController.registerUser
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  authController.loginUser
);

// @route   POST /api/auth/biometric/face
// @desc    Add face embedding to user profile
// @access  Private
router.post('/biometric/face', auth, authController.addFaceEmbedding);

// @route   POST /api/auth/biometric/fingerprint
// @desc    Add fingerprint hash to user profile
// @access  Private
router.post('/biometric/fingerprint', auth, authController.addFingerprintHash);

// @route   POST /api/auth/biometric/verify
// @desc    Verify biometric data and return user profile
// @access  Public
router.post('/biometric/verify', authController.verifyBiometric);

// @route   GET /api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  authController.googleCallback
);

module.exports = router;
