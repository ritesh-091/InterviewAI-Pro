const mongoose = require('mongoose');

const userCodingProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bookmarkedChallenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingChallenge'
  }],
  favoriteChallenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingChallenge'
  }],
  solvedChallenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingChallenge'
  }],
  recentlySolved: [{
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingChallenge' },
    solvedAt: { type: Date, default: Date.now }
  }],
  notes: [{
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingChallenge' },
    content: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
  }],
  streakDates: [{
    type: String // Format: YYYY-MM-DD
  }],
  streakCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserCodingProgress', userCodingProgressSchema);
