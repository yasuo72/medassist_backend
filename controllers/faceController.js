const axios = require('axios');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const User = require('../models/User');

// Helper to build full URL even if env lacks protocol
function buildFaceServiceUrl(path) {
  let base = process.env.FACE_SERVICE_URL || 'http://127.0.0.1:8000';
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = `https://${base}`; // default to https if protocol missing
  }
  // Ensure no trailing slash duplication
  if (base.endsWith('/')) base = base.slice(0, -1);
  return `${base}${path}`;
}

// Memory storage – incoming image stays in RAM and is forwarded as-is to Python
const upload = multer();
// accept any multipart fields to tolerate different field names
exports.uploadMiddleware = upload.any();

// Helper: forward multipart data to Python DeepFace service
async function forwardToPythonIdentify(imageBuffer) {
  const url = buildFaceServiceUrl('/face/identify');
  const form = new FormData();
  form.append('image', imageBuffer, 'capture.jpg');

  const headers = {
    ...form.getHeaders(),
    // Allow large images
    'Content-Length': form.getLengthSync()
  };

  return axios.post(url, form, {
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  }).then(r => r.data);
}

exports.register = async (req, res) => {
  try {
    // Accept either emergencyId (preferred) or user_id (legacy mobile key)
    let emergencyId = req.body.emergencyId || req.body.user_id;
    if (!emergencyId) {
      // generate new uuid if not supplied
      emergencyId = uuidv4();
    }
    const { profileJson } = req.body;

    // Extract image buffer: multipart upload (req.file) OR base64 JSON field
    let imageBuffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.image_data) {
      // Expect data URI or raw base64 string
      const base64 = req.body.image_data.split(',').pop();
      imageBuffer = Buffer.from(base64, 'base64');
    }

    if (!emergencyId || !imageBuffer) {
      return res
        .status(400)
        .json({ error: 'emergencyId/user_id and image are required' });
    }

    // forward to python register
    const formData = new FormData();
    formData.append('emergency_id', emergencyId);
    formData.append('image', imageBuffer, 'capture.jpg');
    if (profileJson) formData.append('profile_json', profileJson);

        const registerUrl = buildFaceServiceUrl('/face/register');
    const pythonResp = await axios.post(registerUrl, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }).then(r => r.data);

    // upsert user in Mongo
    const profile = profileJson ? JSON.parse(profileJson) : {};

    const savedUser = await User.findOneAndUpdate(
      { emergencyId },
      {
        name: profile.name || 'Unknown',
        emergencyId,
        bloodGroup: profile.blood_group || '',
        allergies: profile.allergies || [],
        medicalConditions: profile.conditions || [],
        currentMedications: profile.medications || [],
      },
      { upsert: true, new: true }
    );

    // Build or reuse QR URL for emergency profile
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrUrl = `${frontend}/emergency/view/${emergencyId}`;
    if (!savedUser.qrUrl) {
      savedUser.qrUrl = qrUrl;
      await savedUser.save();
    }

    res.json({ ...pythonResp, qrUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Face register failed' });
  }
};

exports.identify = async (req, res) => {
  try {
    let imageBuffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.image_data) {
      imageBuffer = Buffer.from(req.body.image_data.split(',').pop(), 'base64');
    }
    if (!imageBuffer) {
      return res.status(400).json({ error: 'image file is required' });
    }

    const pythonResp = await forwardToPythonIdentify(imageBuffer);
    if (!pythonResp.match) return res.json({ match: false });

    // Look up emergency profile in Mongo by emergency_id
    const user = await User.findOne({ emergencyId: pythonResp.emergency_id });
    if (!user) {
      return res.status(404).json({ match: true, similarity: pythonResp.similarity, error: 'Profile not found' });
    }

    const profile = {
      name: user.name,
      emergencyId: user.emergencyId,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      medicalConditions: user.medicalConditions,
      currentMedications: user.currentMedications,
      // Expose emergencyContacts so emergency viewer and other clients
      // can show call buttons when the user is identified by face.
      emergencyContacts: user.emergencyContacts || [],
    };

    res.json({ match: true, similarity: pythonResp.similarity, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Face identify failed' });
  }
};

// GET /api/face/status/:emergencyId – returns { modelExists: boolean }
exports.status = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    if (!emergencyId) {
      return res.status(400).json({ error: 'emergencyId is required' });
    }

    const user = await User.findOne({ emergencyId });
    const modelExists = !!(user && user.faceEmbedding);
    res.json({ modelExists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch face status' });
  }
};
