const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() { return !this.googleId; } // Only require a password if not signing in with Google
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple documents to have a null value for this field
  },
  emergencyId: {
    type: String,
    unique: true,
    index: true,
  },
  qrUrl: {
    type: String,
  },
  faceEmbedding: {
    type: String, // Will store the base64 encoded hash/vector
  },
  fingerprintHash: {
    type: String,
  },
  bloodGroup: {
    type: String,
  },
  medicalConditions: [String],
  allergies: [String],
  pastSurgeries: [String],
  currentMedications: [String],
  reportFilePaths: [String],
  emergencyContacts: [
    {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
      isPriority: {
        type: Boolean,
        default: false,
      },
      shareMedicalSummary: {
        type: Boolean,
        default: false,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('user', UserSchema);
