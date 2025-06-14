const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicalRecordSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  recordType: {
    type: String,
    required: true,
    enum: ['Lab Report', 'Prescription', 'Imaging', 'Clinical Note', 'Report', 'Other'],
  },
  filePath: {
    type: String,
    required: true,
  },
  fileMimetype: {
    type: String,
    required: true,
  },
  aiSummary: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
