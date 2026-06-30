const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  interviewProcess: [{
    stepNumber: Number,
    title: String,
    description: String
  }],
  faq: [{
    question: String,
    answer: String
  }],
  aptitudeTopics: [{
    type: String
  }],
  technicalTopics: [{
    type: String
  }],
  hrQuestions: [{
    type: String
  }],
  codingQuestions: [{
    title: String,
    difficulty: String,
    description: String
  }],
  previousExperiences: [{
    userName: String,
    role: String,
    content: String,
    rating: Number,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
