const axios = require('axios');
require('dotenv').config();

/**
 * @desc Generate medical summary via custom AI model
 * @route POST /api/summary
 * @access Private
 * Body expects: {
 *   userId: <string>,
 *   profile: { ...medical fields... }
 * }
 */
exports.generateSummary = async (req, res) => {
  const { profile } = req.body;
  if (!profile) {
    return res.status(400).json({ msg: 'Profile data is required' });
  }

  try {
    // --- Intents-based local summary (rule-based) ---
    const parts = [];
    if (profile.name) parts.push(`${profile.name}`);
    if (profile.age) parts.push(`is ${profile.age} years old`);
    if (profile.bloodGroup) parts.push(`blood group ${profile.bloodGroup}`);

    if (profile.medicalConditions && profile.medicalConditions.length) {
      parts.push(`has medical conditions: ${profile.medicalConditions.join(', ')}`);
    }

    if (profile.allergies && profile.allergies.length) {
      parts.push(`allergies: ${profile.allergies.join(', ')}`);
    }

    if (profile.pastSurgeries && profile.pastSurgeries.length) {
      parts.push(`past surgeries: ${profile.pastSurgeries.join(', ')}`);
    }

    if (profile.currentMedications && profile.currentMedications.length) {
      parts.push(`currently taking: ${profile.currentMedications.join(', ')}`);
    }

    if (!parts.length) {
      parts.push('No significant medical history provided.');
    }

    const summary = parts.join('. ') + '.';

    res.json({ summary });
  } catch (err) {
    console.error('[SummaryController] Model request failed:', err.message);
    res.status(500).json({ msg: 'AI model error', error: err.message });
  }
};
