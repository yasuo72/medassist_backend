const express = require('express');
const router = express.Router();
const faceController = require('../controllers/faceController');

// POST /api/face/identify
router.post('/register', faceController.uploadMiddleware, faceController.register);
router.post('/identify', faceController.uploadMiddleware, faceController.identify);
// GET /api/face/status/:emergencyId
router.get('/status/:emergencyId', faceController.status);

module.exports = router;
