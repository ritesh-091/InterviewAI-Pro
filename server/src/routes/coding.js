const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getChallenges,
  getChallengeById,
  runChallenge,
  bookmarkChallenge,
  favoriteChallenge,
  saveNotes,
  getNotes,
  getDiscussions,
  createDiscussion,
  replyDiscussion,
  getProgress,
  getDailyChallenge,
  getRandomChallenge,
  aiExplain,
  aiOptimize,
  aiComplexity,
  aiHint,
  getLeaderboard
} = require('../controllers/codingController');

// Main challenges listing and detail mappings
router.get('/challenges', protect, getChallenges);
router.get('/daily-challenge', protect, getDailyChallenge);
router.get('/random-challenge', protect, getRandomChallenge);
router.get('/analytics/progress', protect, getProgress);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/challenges/:id', protect, getChallengeById);
router.post('/challenges/:id/run', protect, runChallenge);

// Bookmarks & Favorites toggle endpoints
router.post('/challenges/:id/bookmark', protect, bookmarkChallenge);
router.post('/challenges/:id/favorite', protect, favoriteChallenge);

// Personal notes routes
router.get('/challenges/:id/notes', protect, getNotes);
router.post('/challenges/:id/notes', protect, saveNotes);

// Discussions comment & replies routes
router.get('/challenges/:id/discussions', protect, getDiscussions);
router.post('/challenges/:id/discussions', protect, createDiscussion);
router.post('/challenges/:id/discussions/:commentId/reply', protect, replyDiscussion);

// AI helpers endpoints
router.post('/ai/explain', protect, aiExplain);
router.post('/ai/optimize', protect, aiOptimize);
router.post('/ai/complexity', protect, aiComplexity);
router.post('/ai/hint', protect, aiHint);

module.exports = router;
