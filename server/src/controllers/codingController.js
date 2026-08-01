const CodingChallenge = require('../models/CodingChallenge');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const { executeCode } = require('../services/sandboxService');
const { CHALLENGES } = require('../data/challengesData');

// Helper to seed challenges if database is empty or outdated
const seedChallengesIfNeeded = async () => {
  try {
    const count = await CodingChallenge.countDocuments();
    if (count < 150) {
      await CodingChallenge.deleteMany({});
      await CodingChallenge.insertMany(CHALLENGES);
      console.log(`Seeded ${CHALLENGES.length} coding challenges successfully!`);
    }
  } catch (error) {
    console.error('Error seeding coding challenges:', error);
  }
};

// Seed only after MongoDB connection is active
const mongoose = require('mongoose');
if (mongoose.connection.readyState === 1) {
  seedChallengesIfNeeded();
} else {
  mongoose.connection.once('open', seedChallengesIfNeeded);
}

// 1. Get Coding Challenges
const getChallenges = async (req, res, next) => {
  try {
    const { category, difficulty, search, company } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (company) {
      query.companyTags = company;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const challenges = await CodingChallenge.find(query).select('-testCases.isHidden');
    res.status(200).json(challenges);
  } catch (error) {
    next(error);
  }
};

// 2. Get Challenge Details
const getChallengeById = async (req, res, next) => {
  try {
    const challenge = await CodingChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Coding challenge not found' });
    }
    res.status(200).json(challenge);
  } catch (error) {
    next(error);
  }
};

// 3. Run & Evaluate Challenge Code
const runChallenge = async (req, res, next) => {
  try {
    const { challengeId, code, language } = req.body;
    if (!challengeId || !code || !language) {
      return res.status(400).json({ message: 'Challenge ID, code, and language are required' });
    }

    const challenge = await CodingChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Execute code via sandboxed service
    const results = await executeCode(code, language, challenge.testCases);

    const allPassed = results.length > 0 && results.every(r => r.passed);

    // If passed, credit coding stats in Analytics database
    if (allPassed) {
      const userAnalytics = await Analytics.findOne({ userId: req.user._id });
      if (userAnalytics) {
        const difficulty = challenge.difficulty.toLowerCase();
        
        if (difficulty === 'easy') {
          userAnalytics.codingProgress.easyCompleted += 1;
        } else if (difficulty === 'medium') {
          userAnalytics.codingProgress.mediumCompleted += 1;
        } else if (difficulty === 'hard') {
          userAnalytics.codingProgress.hardCompleted += 1;
        }

        // Update skill rating progress (Algorithm Skills)
        const existingSkillIdx = userAnalytics.skillProgress.findIndex(s => s.skillName === 'Algorithms');
        if (existingSkillIdx > -1) {
          userAnalytics.skillProgress[existingSkillIdx].rating = Math.min(userAnalytics.skillProgress[existingSkillIdx].rating + 8, 100);
        } else {
          userAnalytics.skillProgress.push({
            skillName: 'Algorithms',
            rating: 40
          });
        }

        await userAnalytics.save();
      }

      // Award Code Solver achievement badge
      const user = await User.findById(req.user._id);
      if (user && !user.profile.achievements.includes('Code Solver')) {
        user.profile.achievements.push('Code Solver');
        await user.save();
      }
    }

    res.status(200).json({
      allPassed,
      results,
      solution: allPassed ? challenge.solution : null
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Leaderboard Ratings
const getLeaderboard = async (req, res, next) => {
  try {
    // In real app, calculate scores from challenges solved. 
    // We will build a dynamic aggregate query mapping users' analytics solved metrics.
    const analyticsRecords = await Analytics.find({}).populate('userId', 'email profile.name profile.avatar');
    
    const leaderboard = analyticsRecords.map(record => {
      const easy = record.codingProgress.easyCompleted || 0;
      const medium = record.codingProgress.mediumCompleted || 0;
      const hard = record.codingProgress.hardCompleted || 0;
      
      const totalSolved = easy + medium + hard;
      const points = (easy * 10) + (medium * 25) + (hard * 50);

      return {
        userId: record.userId ? record.userId._id : null,
        name: record.userId && record.userId.profile ? record.userId.profile.name : 'Candidate Developer',
        avatar: record.userId && record.userId.profile ? record.userId.profile.avatar : '',
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
        totalSolved,
        score: points
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Return Top 10

    res.status(200).json(leaderboard);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChallenges,
  getChallengeById,
  runChallenge,
  getLeaderboard
};
