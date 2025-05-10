const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema({
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  clubName: String,
  semester: String,
  status: { type: String, enum: ['yes', 'no'], default: 'no' },
  application_deadline: Date,
  description: String,
  pending_std: [Number],   // Student IDs
  approved_std: [Number],
  rejected_std: [Number],
}, {
  timestamps: true
});

recruitmentSchema.index({ clubId: 1, semester: 1 }, { unique: true }); // Prevent duplicate

module.exports = mongoose.model('Recruitment', recruitmentSchema);
