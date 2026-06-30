const CodingChallenge = require('../models/CodingChallenge');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const { executeCode } = require('../services/sandboxService');

// Default Seed Challenges to run if the collection is empty
const SEED_CHALLENGES = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    difficulty: "Easy",
    category: "Arrays & Hashing",
    codeTemplates: {
      javascript: `function twoSum(nums, target) {\n  // Write your code here\n  \n}`,
      python: `def two_sum(nums, target):\n    # Write your code here\n    pass`,
      java: `public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};`
    },
    testCases: [
      { input: "([2, 7, 11, 15], 9)", expectedOutput: "[0, 1]", isHidden: false },
      { input: "([3, 2, 4], 6)", expectedOutput: "[1, 2]", isHidden: false },
      { input: "([3, 3], 6)", expectedOutput: "[0, 1]", isHidden: false }
    ],
    solution: {
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      explanation: "We can use a hash map to map each value to its index. While iterating through the array, we check if the complement (target - nums[i]) exists in the map. If it does, we return its index and the current index."
    }
  },
  {
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters `s`.\nYou must do this by modifying the input array in-place with O(1) extra memory.",
    difficulty: "Easy",
    category: "Strings",
    codeTemplates: {
      javascript: `function reverseString(s) {\n  // Write your code here\n  return s.reverse();\n}`,
      python: `def reverse_string(s):\n    # Write your code here\n    s.reverse()\n    return s`,
      java: `public class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n    }\n}`,
      cpp: `class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n    }\n};`
    },
    testCases: [
      { input: "(['h','e','l','l','o'])", expectedOutput: "['o','l','l','e','h']", isHidden: false },
      { input: "(['H','a','n','n','a','h'])", expectedOutput: "['h','a','n','n','a','H']", isHidden: false }
    ],
    solution: {
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      explanation: "Using a two-pointer approach, we set one pointer at the start and one at the end. We swap characters, then move pointers closer until they meet."
    }
  },
  {
    title: "Longest Substring Without Repeating Characters",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    difficulty: "Medium",
    category: "Sliding Window",
    codeTemplates: {
      javascript: `function lengthOfLongestSubstring(s) {\n  // Write your code here\n  \n}`,
      python: `def length_of_longest_substring(s):\n    # Write your code here\n    pass`,
      java: `public class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your code here\n        return 0;\n    }\n};`
    },
    testCases: [
      { input: "(\"abcabcbb\")", expectedOutput: "3", isHidden: false },
      { input: "(\"bbbbb\")", expectedOutput: "1", isHidden: false },
      { input: "(\"pewwkew\")", expectedOutput: "3", isHidden: false }
    ],
    solution: {
      timeComplexity: "O(n)",
      spaceComplexity: "O(min(m, n))",
      explanation: "We utilize a sliding window with a set/map representing characters. We slide the right boundary and, if a repeat character is hit, shrink the left boundary."
    }
  }
];

// Helper to seed challenges if database is empty
const seedChallengesIfNeeded = async () => {
  try {
    const count = await CodingChallenge.countDocuments();
    if (count === 0) {
      await CodingChallenge.insertMany(SEED_CHALLENGES);
      console.log('Seeded default coding challenges successfully!');
    }
  } catch (error) {
    console.error('Error seeding coding challenges:', error);
  }
};

// Seed immediately on import
setTimeout(seedChallengesIfNeeded, 2000);

// 1. Get Coding Challenges
const getChallenges = async (req, res, next) => {
  try {
    const challenges = await CodingChallenge.find({}).select('-testCases.isHidden');
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
