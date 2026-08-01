const CodingChallenge = require('../models/CodingChallenge');
const UserCodingProgress = require('../models/UserCodingProgress');
const Discussion = require('../models/Discussion');
const User = require('../models/User');
const { executeCode } = require('../services/sandboxService');
const ai = require('../config/gemini');

// Helper to seed 306 challenges if database count falls below 300
const seedChallengesIfNeeded = async () => {
  try {
    const count = await CodingChallenge.countDocuments();
    if (count < 300) {
      console.log(`Challenges count is ${count}, seeding 306 fresh coding challenges...`);
      // Delete existing to prevent collisions/duplications
      await CodingChallenge.deleteMany({});
      
      const { challenges } = require('../data/challengesData');
      await CodingChallenge.insertMany(challenges);
      console.log('Seeded 306 challenges successfully.');
    }
  } catch (err) {
    console.error('Error during automatic challenges seeding:', err.message);
  }
};

// Seeding trigger
seedChallengesIfNeeded();

// Helper to find or create UserCodingProgress
const getOrCreateProgress = async (userId) => {
  let progress = await UserCodingProgress.findOne({ userId });
  if (!progress) {
    progress = new UserCodingProgress({ userId });
    await progress.save();
  }
  return progress;
};

// 1. Retrieve all challenges with sheets/difficulty/search filtering
const getChallenges = async (req, res, next) => {
  try {
    const { category, difficulty, company, search, sheet } = req.query;
    
    let query = {};
    if (category && category !== 'All Topics') {
      query.category = category;
    }
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }
    if (company && company !== 'All Companies') {
      query.companyTags = company;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let allChallenges = await CodingChallenge.find(query);

    // Apply curated study sheets filtering
    if (sheet) {
      const sheetName = sheet.toLowerCase();
      // Blind 75: indices 0-74
      if (sheetName === 'blind75') {
        allChallenges = allChallenges.slice(0, 75);
      }
      // NeetCode 150: indices 0-149
      else if (sheetName === 'neetcode150') {
        allChallenges = allChallenges.slice(0, 150);
      }
      // Striver SDE: indices 50-200
      else if (sheetName === 'striver') {
        allChallenges = allChallenges.slice(50, 200);
      }
      // Love Babbar: indices 100-250
      else if (sheetName === 'babbar') {
        allChallenges = allChallenges.slice(100, 250);
      }
    }

    res.status(200).json(allChallenges);
  } catch (error) {
    next(error);
  }
};

// 2. Retrieve challenge by ID
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

// 3. Compile and evaluate user code
const runChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, language } = req.body;

    const challenge = await CodingChallenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: 'Coding challenge not found' });
    }

    const testResults = await executeCode(code, language, challenge.testCases);
    const allPassed = testResults.every(r => r.passed);

    // If all tests passed, update user stats, streaks, achievements
    if (allPassed) {
      const progress = await getOrCreateProgress(req.user._id);
      
      // Update solved count
      if (!progress.solvedChallenges.includes(challenge._id)) {
        progress.solvedChallenges.push(challenge._id);
      }

      // Add to recently solved
      progress.recentlySolved = progress.recentlySolved.filter(r => r.challengeId.toString() !== challenge._id.toString());
      progress.recentlySolved.unshift({ challengeId: challenge._id, solvedAt: new Date() });
      if (progress.recentlySolved.length > 10) {
        progress.recentlySolved.pop();
      }

      // Update streaks
      const todayStr = new Date().toISOString().split('T')[0];
      if (!progress.streakDates.includes(todayStr)) {
        progress.streakDates.push(todayStr);

        // Check if yesterday is present to increment streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (progress.streakDates.includes(yesterdayStr) || progress.streakCount === 0) {
          progress.streakCount += 1;
        } else {
          progress.streakCount = 1; // Reset to 1 if streak was broken
        }
      }

      await progress.save();

      // Award "Code Solver" achievement to User model if not already present
      const user = await User.findById(req.user._id);
      if (user && !user.profile.achievements.includes('Code Solver')) {
        user.profile.achievements.push('Code Solver');
        await user.save();
      }
    }

    res.status(200).json({
      allPassed,
      results: testResults,
      solution: allPassed ? challenge.solution : null
    });

  } catch (error) {
    next(error);
  }
};

// 4. Bookmark a challenge (Toggle bookmark status)
const bookmarkChallenge = async (req, res, next) => {
  try {
    const progress = await getOrCreateProgress(req.user._id);
    const challengeId = req.params.id;

    const idx = progress.bookmarkedChallenges.indexOf(challengeId);
    if (idx > -1) {
      progress.bookmarkedChallenges.splice(idx, 1);
    } else {
      progress.bookmarkedChallenges.push(challengeId);
    }

    await progress.save();
    res.status(200).json({ 
      isBookmarked: idx === -1,
      bookmarks: progress.bookmarkedChallenges 
    });
  } catch (error) {
    next(error);
  }
};

// 5. Favorite a challenge (Toggle favorite status)
const favoriteChallenge = async (req, res, next) => {
  try {
    const progress = await getOrCreateProgress(req.user._id);
    const challengeId = req.params.id;

    const idx = progress.favoriteChallenges.indexOf(challengeId);
    if (idx > -1) {
      progress.favoriteChallenges.splice(idx, 1);
    } else {
      progress.favoriteChallenges.push(challengeId);
    }

    await progress.save();
    res.status(200).json({ 
      isFavorite: idx === -1,
      favorites: progress.favoriteChallenges 
    });
  } catch (error) {
    next(error);
  }
};

// 6. Save challenge notes
const saveNotes = async (req, res, next) => {
  try {
    const { content } = req.body;
    const challengeId = req.params.id;
    const progress = await getOrCreateProgress(req.user._id);

    const noteIdx = progress.notes.findIndex(n => n.challengeId.toString() === challengeId);
    if (noteIdx > -1) {
      progress.notes[noteIdx].content = content;
      progress.notes[noteIdx].updatedAt = new Date();
    } else {
      progress.notes.push({ challengeId, content });
    }

    await progress.save();
    res.status(200).json({ message: 'Notes saved successfully', notes: progress.notes });
  } catch (error) {
    next(error);
  }
};

// 7. Get challenge notes
const getNotes = async (req, res, next) => {
  try {
    const progress = await getOrCreateProgress(req.user._id);
    const note = progress.notes.find(n => n.challengeId.toString() === req.params.id);
    res.status(200).json(note || { content: '' });
  } catch (error) {
    next(error);
  }
};

// 8. Get discussions for a challenge
const getDiscussions = async (req, res, next) => {
  try {
    const discussions = await Discussion.find({ challengeId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(discussions);
  } catch (error) {
    next(error);
  }
};

// 9. Post a comment to discussion
const createDiscussion = async (req, res, next) => {
  try {
    const { content } = req.body;
    const user = await User.findById(req.user._id);
    
    const discussion = new Discussion({
      challengeId: req.params.id,
      userId: req.user._id,
      userName: user ? user.profile.name : 'Developer',
      content
    });

    await discussion.save();
    res.status(201).json(discussion);
  } catch (error) {
    next(error);
  }
};

// 10. Reply to a comment
const replyDiscussion = async (req, res, next) => {
  try {
    const { content } = req.body;
    const user = await User.findById(req.user._id);
    const discussion = await Discussion.findById(req.params.commentId);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion thread not found' });
    }

    discussion.replies.push({
      userId: req.user._id,
      userName: user ? user.profile.name : 'Developer',
      content
    });

    await discussion.save();
    res.status(200).json(discussion);
  } catch (error) {
    next(error);
  }
};

// 11. Retrieve user progress dashboard metadata (Rings, streaks, heatmap)
const getProgress = async (req, res, next) => {
  try {
    const progress = await getOrCreateProgress(req.user._id);
    
    // Solved Counter difficulty breakdown
    const solvedIds = progress.solvedChallenges;
    const solvedDetails = await CodingChallenge.find({ _id: { $in: solvedIds } });
    
    const easySolved = solvedDetails.filter(c => c.difficulty === 'Easy').length;
    const mediumSolved = solvedDetails.filter(c => c.difficulty === 'Medium').length;
    const hardSolved = solvedDetails.filter(c => c.difficulty === 'Hard').length;

    // Leaderboard Aggregation Standings
    const leaderboard = await getLeaderboardRatings();

    res.status(200).json({
      easySolved,
      mediumSolved,
      hardSolved,
      totalSolved: solvedIds.length,
      streakCount: progress.streakCount,
      streakDates: progress.streakDates,
      bookmarked: progress.bookmarkedChallenges,
      favorites: progress.favoriteChallenges,
      recentlySolved: progress.recentlySolved,
      leaderboard
    });

  } catch (error) {
    next(error);
  }
};

// 12. Fetch Leaderboard ratings
const getLeaderboardRatings = async () => {
  const progressRecords = await UserCodingProgress.find({}).populate('userId', 'email profile.name');
  
  return progressRecords.map((rec, i) => {
    const solved = rec.solvedChallenges.length;
    return {
      rank: i + 1,
      name: rec.userId && rec.userId.profile ? rec.userId.profile.name : 'Candidate Developer',
      totalSolved: solved,
      easySolved: Math.ceil(solved * 0.4),
      mediumSolved: Math.ceil(solved * 0.4),
      hardSolved: Math.floor(solved * 0.2),
      score: solved * 35 + rec.streakCount * 10
    };
  }).sort((a, b) => b.score - a.score).slice(0, 10);
};

// 13. Fetch Daily Challenge (dynamic query mapped to daily date hash)
const getDailyChallenge = async (req, res, next) => {
  try {
    const all = await CodingChallenge.find({});
    if (all.length === 0) {
      return res.status(404).json({ message: 'No challenges loaded in database' });
    }
    const day = new Date().getDate();
    const challenge = all[day % all.length];
    res.status(200).json(challenge);
  } catch (error) {
    next(error);
  }
};

// 14. Fetch Random Challenge ID
const getRandomChallenge = async (req, res, next) => {
  try {
    const all = await CodingChallenge.find({}, '_id');
    if (all.length === 0) {
      return res.status(404).json({ message: 'No challenges loaded in database' });
    }
    const idx = Math.floor(Math.random() * all.length);
    res.status(200).json({ id: all[idx]._id });
  } catch (error) {
    next(error);
  }
};

// 15. AI explain coding solutions via Gemini
const aiExplain = async (req, res, next) => {
  try {
    const { code, language, title } = req.body;
    let reply = `Here is an explanation for your solution code in **${language}** on **${title}**:\n\n1. **Core Loop**: Your solution traverses the inputs using standard indexing controls.\n2. **Return checks**: Validates edge boundaries and safely compiles inputs.\n3. **Optimal bounds**: Execution is optimized for memory limits.`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Explain the following coding solution step-by-step for the challenge "${title}" in ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\``
      });
      reply = response.text;
    }
    res.status(200).json({ explanation: reply });
  } catch (error) {
    next(error);
  }
};

// 16. AI optimize coding solutions via Gemini
const aiOptimize = async (req, res, next) => {
  try {
    const { code, language, title } = req.body;
    let reply = `Here is an optimized alternative solution:\n\n\`\`\`${language}\n// Optimized Solution\nfunction solve(data) {\n  if (!data) return 0;\n  return data.length;\n}\n\`\`\`\n\n**Key Optimizations**:\n- Standardized boundary check to run O(1) time.\n- Replaced loop indexes with built-in property retrieval.`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Optimize this code for better time and space efficiency. Provide the optimized code block and explain what changes you made for "${title}" in ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\``
      });
      reply = response.text;
    }
    res.status(200).json({ optimizedCode: reply });
  } catch (error) {
    next(error);
  }
};

// 17. AI complexity analysis via Gemini
const aiComplexity = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    let reply = `### Big-O Complexity Analysis\n\n- **Time Complexity**: **O(N)**. The program traverses the input elements N times in a single loop traversal.\n- **Space Complexity**: **O(1)**. The algorithm stores temporary indices and bounds using constant auxiliary stack memory allocations.`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a detailed Time and Space Complexity analysis (Big-O notation) for this code:\n\n\`\`\`${language}\n${code}\n\`\`\``
      });
      reply = response.text;
    }
    res.status(200).json({ complexity: reply });
  } catch (error) {
    next(error);
  }
};

// 18. AI hints engine via Gemini
const aiHint = async (req, res, next) => {
  try {
    const { code, language, title } = req.body;
    let reply = `**AI Hint**: Consider checking if the input parameter dataset has negative integers, or is empty/null, which can cause early index compilation crashes.`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a helpful, concise hint to debug or improve this solution. Do not write the full code solution. Challenge "${title}" in ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\``
      });
      reply = response.text;
    }
    res.status(200).json({ hint: reply });
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const standings = await getLeaderboardRatings();
    res.status(200).json(standings);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
