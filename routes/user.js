const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const rateLimit = require('express-rate-limit');
const { rateLimit: rateLimitConfig } = require('../config/rate-limit');

// Rate limiting for all routes
const limiter = rateLimit({
  windowMs: rateLimitConfig.windowMs, // 15 minutes
  max: rateLimitConfig.maxRequests, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  trustProxy: 1 // Trust first proxy (Railway)
});

// Apply rate limiting to all routes
router.use(limiter);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid input data',
      errors: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ===== Emergency ID Routes =====
// GET current user's emergency ID
router.get('/emergency-id', auth, async (req, res, next) => {
  try {
    const id = await userController.getEmergencyId(req);
    res.json({ success: true, data: id });
  } catch (err) { next(err); }
});

// POST set/update emergency ID
router.post('/emergency-id', auth, async (req, res, next) => {
  try {
    const id = await userController.setEmergencyId(req);
    res.json({ success: true, data: id });
  } catch (err) { next(err); }
});

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, userController.getUserProfile);



// @route   GET /api/user/contacts
// @desc    Get all emergency contacts for a user
// @access  Private
router.get('/contacts', auth, async (req, res, next) => {
  try {
    const contacts = await userController.getEmergencyContacts(req);
    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/user/contacts
// @desc    Add an emergency contact
// @access  Private
router.post('/contacts', auth, async (req, res, next) => {
  try {
    const contact = await userController.addEmergencyContact(req);
    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/user/contacts/:contactId
// @desc    Delete an emergency contact
// @access  Private
router.delete('/contacts/:contactId', auth, async (req, res, next) => {
  try {
    await userController.deleteEmergencyContact(req);
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update contact
router.put('/contacts/:contactId', auth, async (req, res, next) => {
  try {
    const contact = await userController.updateEmergencyContact(req);
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// =========================
//  Profile Routes
// =========================



// Update logged-in user's profile
router.post('/profile', auth, async (req, res) => {
  try {
    const updatedProfile = await userController.updateProfile(req);
    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
