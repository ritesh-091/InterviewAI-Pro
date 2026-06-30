const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getChallenges, getChallengeById, runChallenge, getLeaderboard } = require('../controllers/codingController');

router.get('/challenges', protect, getChallenges);
router.get('/challenges/:id', protect, getChallengeById);
router.post('/challenges/:id/run', protect, runChallenge);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
