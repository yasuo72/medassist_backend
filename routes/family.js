const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
const familyController = require('../controllers/familyController');

// @route   POST /api/family
// @desc    Add a new family member
// @access  Private
router.post('/', auth, familyController.addFamilyMember);

// Upload medical summary
router.post('/summary', auth, upload.single('file'), familyController.uploadSummary);

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
