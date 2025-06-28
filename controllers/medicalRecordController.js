const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Upload a new medical record
// @route   POST /api/records
// @access  Private
exports.createMedicalRecord = async (req, res) => {
  const { title, recordType } = req.body;

  if (!title || !recordType) {
    return res.status(400).json({ msg: 'Title and record type are required' });
  }

  if (!req.file) {
    return res.status(400).json({ msg: 'Please upload a file' });
  }

  try {
    const newRecord = new MedicalRecord({
      user: req.user.id,
      title,
      recordType,
      filePath: path.join('uploads', req.file.filename),
      fileMimetype: req.file.mimetype,
    });

    const record = await newRecord.save();
    res.json(record);
  } catch (err) {
    console.error(err.message);
    // If there's a DB error, delete the uploaded file
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting file after DB save failure:', unlinkErr);
    });
    res.status(500).send('Server Error');
  }
};

// @desc    Get all medical records for a user
// @route   GET /api/records
// @access  Private
exports.getMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a medical record
// @route   DELETE /api/records/:id
// @access  Private
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ msg: 'Record not found' });
    }

    // Make sure user owns the record
    if (record.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Delete the file from the filesystem (ensure absolute path)
    const filePathToDelete = path.isAbsolute(record.filePath)
      ? record.filePath
      : path.join(__dirname, '..', record.filePath);

    fs.unlink(filePathToDelete, async (err) => {
      if (err) {
        // Log the error but proceed to delete from DB anyway
        console.error('File deletion error:', err);
        // If the file is already missing we log and continue to delete DB record

      }

      await MedicalRecord.findByIdAndDelete(req.params.id);

      res.json({ msg: 'Record removed' });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Generate AI summary for a medical record
// @route   POST /api/records/:id/summarize
// @access  Private
exports.generateAiSummary = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ msg: 'Record not found' });
    }

    // Make sure user owns the record
    if (record.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // --- Real AI Processing via HuggingFace Space ---
    const { summarizeReport } = require('../services/aiInferenceService');

    try {
      const summaryText = await summarizeReport(record.filePath, record.fileMimetype);
      record.aiSummary = summaryText;
      await record.save();
      return res.json({ summary: summaryText });
    } catch (aiErr) {
      console.error('AI summarization failed:', aiErr);
      return res.status(500).json({ msg: 'AI summarization failed', error: aiErr.message });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get an aggregated AI summary for a specific user
// @route   GET /api/records/:userId/summary
// @access  Private (or protected by other means)
exports.getAggregatedAiSummary = async (req, res) => {
  try {
    // Check if the user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const records = await MedicalRecord.find({ user: req.params.userId });

    if (!records || records.length === 0) {
      return res.status(404).json({ msg: 'No medical records found for this user.' });
    }

    // Combine all individual summaries.
    const aggregatedSummary = records
      .map(record => record.aiSummary)
      .filter(summary => summary) // Filter out records without a summary
      .join('\n\n---\n\n');

    if (!aggregatedSummary) {
      return res.status(404).json({ msg: 'No AI summaries available to aggregate.' });
    }

    res.json({ aggregatedSummary });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
