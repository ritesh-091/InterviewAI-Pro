const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  dailyStudyHours: [{
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    hours: { type: Number, default: 0 }
  }],
  interviewScoreHistory: [{
    date: { type: String, required: true },
    score: { type: Number, required: true },
    type: { type: String, required: true }
  }],
  skillProgress: [{
    skillName: { type: String, required: true },
    rating: { type: Number, default: 0 } // 0 to 100
  }],
  codingProgress: {
    easyCompleted: { type: Number, default: 0 },
    mediumCompleted: { type: Number, default: 0 },
    hardCompleted: { type: Number, default: 0 }
  },
  resumeImprovementTrend: [{
    date: { type: String, required: true },
    score: { type: Number, required: true }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Analytics', analyticsSchema);
