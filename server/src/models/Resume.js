const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalName: {
    type: String,
    required: true
  },
  parsedText: {
    type: String,
    default: ''
  },
  atsScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  feedback: {
    missingSkills: [{ type: String }],
    grammarSuggestions: [{
      original: String,
      suggestion: String,
      explanation: String
    }],
    keywordOptimization: [{
      keyword: String,
      reason: String
    }],
    roleSuitability: [{
      role: String,
      score: Number,
      reason: String
    }]
  },
  pdfReportPath: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);
