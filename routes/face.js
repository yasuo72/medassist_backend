const express = require('express');
const router = express.Router();
const faceController = require('../controllers/faceController');

// POST /api/face/identify
router.post('/register', faceController.uploadMiddleware, faceController.register);
router.post('/identify', faceController.uploadMiddleware, faceController.identify);

module.exports = router;
