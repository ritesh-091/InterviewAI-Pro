const mongoose = require('mongoose');

const codingChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  codeTemplates: {
    javascript: { type: String, required: true },
    python: { type: String, required: true },
    java: { type: String, required: true },
    cpp: { type: String, required: true },
    c: { type: String, required: false }
  },
  companyTags: {
    type: [String],
    default: []
  },
  testCases: [{
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
  }],
  solution: {
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    explanation: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CodingChallenge', codingChallengeSchema);
