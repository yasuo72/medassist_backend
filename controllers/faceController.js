const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const User = require('../models/User');

// Memory storage – incoming image stays in RAM and is forwarded as-is to Python
const upload = multer();
exports.uploadMiddleware = upload.single('image');

// Helper: forward multipart data to Python DeepFace service
async function forwardToPythonIdentify(req) {
  return axios.post((process.env.FACE_SERVICE_URL || 'http://127.0.0.1:8000') + '/face/identify', req.file.buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `form-data; name="image"; filename="capture.jpg"`
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  }).then(r => r.data);
}

exports.register = async (req, res) => {
  try {
    const { emergencyId, profileJson } = req.body;
    if (!emergencyId || !req.file) {
      return res.status(400).json({ error: 'emergencyId and image are required' });
    }

    // forward to python register
    const formData = new FormData();
    formData.append('emergency_id', emergencyId);
    formData.append('image', req.file.buffer, 'capture.jpg');
    if (profileJson) formData.append('profile_json', profileJson);

    const pythonResp = await axios.post((process.env.FACE_SERVICE_URL || 'http://127.0.0.1:8000') + '/face/register', formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }).then(r => r.data);

    // upsert user in Mongo
    const profile = profileJson ? JSON.parse(profileJson) : {};

    await User.findOneAndUpdate(
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

    res.json(pythonResp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Face register failed' });
  }
};

exports.identify = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'image file is required' });
    }

    const pythonResp = await forwardToPythonIdentify(req);
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
    };

    res.json({ match: true, similarity: pythonResp.similarity, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Face identify failed' });
  }
};
