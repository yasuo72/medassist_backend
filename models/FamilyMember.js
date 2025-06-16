const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FamilyMemberSchema = new Schema({
  guardian: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  relationship: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
  },
  bloodGroup: {
    type: String,
  },
  allergies: {
    type: [String],
    default: [],
  },
  medicalConditions: {
    type: [String],
    default: [],
  },
  medicalTag: {
    type: String,
  },
  faceEmbedding: {
    type: String, // Stored as a base64 string or a hash
  },
  fingerprintHash: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FamilyMember', FamilyMemberSchema);
