const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const summaryController = require('../controllers/summaryController');

// POST /api/summary  -> generate medical summary from profile
router.post('/', auth, summaryController.generateSummary);

module.exports = router;
