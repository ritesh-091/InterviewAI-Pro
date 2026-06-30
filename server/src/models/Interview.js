const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  invitationEmail: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['HR', 'Technical', 'System Design', 'Behavioral', 'Coding'],
    required: true
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },
  questions: [{
    question: { type: String, required: true },
    answer: { type: String, default: '' },
    recordingUrl: { type: String, default: '' },
    evaluation: {
      confidenceScore: { type: Number, default: 0 },
      communicationScore: { type: Number, default: 0 },
      technicalScore: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      betterAnswer: { type: String, default: '' }
    }
  }],
  currentIndex: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);
