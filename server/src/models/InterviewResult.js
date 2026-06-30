const mongoose = require('mongoose');

const interviewResultSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  communicationScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  technicalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  confidenceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  detailedFeedback: {
    type: String,
    required: true
  },
  improvementAreas: [{
    type: String
  }],
  suggestedAnswers: [{
    question: String,
    betterAnswer: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('InterviewResult', interviewResultSchema);
