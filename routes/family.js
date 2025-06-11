const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const familyController = require('../controllers/familyController');

// @route   POST /api/family
// @desc    Add a new family member
// @access  Private
router.post('/', auth, familyController.addFamilyMember);

// @route   GET /api/family
// @desc    Get all family members for a user
// @access  Private
router.get('/', auth, familyController.getFamilyMembers);

// @route   PUT /api/family/:id
// @desc    Update a family member's details
// @access  Private
router.put('/:id', auth, familyController.updateFamilyMember);

// @route   DELETE /api/family/:id
// @desc    Delete a family member
// @access  Private
router.delete('/:id', auth, familyController.deleteFamilyMember);

module.exports = router;
