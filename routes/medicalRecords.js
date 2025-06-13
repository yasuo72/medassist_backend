const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const medicalRecordController = require('../controllers/medicalRecordController');

// @route   GET /api/records
// @desc    Get all medical records for a user
// @access  Private
router.get('/', auth, medicalRecordController.getMedicalRecords);

// @route   POST /api/records
// @desc    Upload a new medical record
// @access  Private
router.post(
  '/',
  [
    auth,
    upload.any(),
    // unify to req.file for controller compatibility
    (req, _res, next) => {
      if (!req.file && Array.isArray(req.files) && req.files.length) {
        req.file = req.files[0];
      }
      next();
    },
  ],
  medicalRecordController.createMedicalRecord
);

// @route   POST /api/records/upload (legacy/mobile)
// @desc    Upload a new medical record (alias for POST /api/records)
// @access  Private
router.post(
  '/upload',
  [
    auth,
    upload.any(),
    (req, _res, next) => {
      if (!req.file && Array.isArray(req.files) && req.files.length) {
        req.file = req.files[0];
      }
      next();
    },
  ],
  medicalRecordController.createMedicalRecord
);

// @route   DELETE /api/records/:id
// @desc    Delete a medical record
// @access  Private
router.delete('/:id', auth, medicalRecordController.deleteMedicalRecord);

// @route   POST /api/records/:id/summarize
// @desc    Generate AI summary for a record
// @access  Private
router.post('/:id/summarize', auth, medicalRecordController.generateAiSummary);

// @route   GET /api/records/:userId/summary
// @desc    Get an aggregated AI summary for a user
// @access  Private
router.get('/:userId/summary', auth, medicalRecordController.getAggregatedAiSummary);

module.exports = router;
