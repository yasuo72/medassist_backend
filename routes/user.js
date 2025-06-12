const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// @route   GET /api/user/contacts
// @desc    Get all emergency contacts for a user
// @access  Private
router.get('/contacts', auth, userController.getEmergencyContacts);

// @route   POST /api/user/contacts
// @desc    Add an emergency contact
// @access  Private
router.post('/contacts', auth, userController.addEmergencyContact);

// @route   DELETE /api/user/contacts/:contactId
// @desc    Delete an emergency contact
// @access  Private
router.delete('/contacts/:contactId', auth, userController.deleteEmergencyContact);

// Update contact
router.put('/contacts/:contactId', auth, userController.updateEmergencyContact);

// =========================
//  Profile Routes
// =========================

// Get logged-in user's profile
router.get('/profile', auth, userController.getProfile);

// Create / update profile
router.post('/profile', auth, userController.updateProfile);

module.exports = router;
