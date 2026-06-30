const Analytics = require('../models/Analytics');

// 1. Get Logged-in User's Analytics
const getUserAnalytics = async (req, res, next) => {
  try {
    let analytics = await Analytics.findOne({ userId: req.user._id });
    
    if (!analytics) {
      analytics = await Analytics.create({
        userId: req.user._id,
        dailyStudyHours: [],
        interviewScoreHistory: [],
        skillProgress: [
          { skillName: 'Technical Skills', rating: 50 },
          { skillName: 'Communication Skills', rating: 50 },
          { skillName: 'Algorithms', rating: 30 }
        ],
        codingProgress: { easyCompleted: 0, mediumCompleted: 0, hardCompleted: 0 },
        resumeImprovementTrend: []
      });
    }

    res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
};

// 2. Track & Increment Daily Study Hours
const updateStudyHours = async (req, res, next) => {
  try {
    const { hours } = req.body;
    if (hours === undefined || isNaN(hours)) {
      return res.status(400).json({ message: 'Valid study hours value is required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let analytics = await Analytics.findOne({ userId: req.user._id });

    if (!analytics) {
      analytics = new Analytics({
        userId: req.user._id,
        dailyStudyHours: [],
        interviewScoreHistory: [],
        skillProgress: [],
        codingProgress: { easyCompleted: 0, mediumCompleted: 0, hardCompleted: 0 }
      });
    }

    const existingDayIdx = analytics.dailyStudyHours.findIndex(d => d.date === todayStr);
    if (existingDayIdx > -1) {
      analytics.dailyStudyHours[existingDayIdx].hours += Number(hours);
    } else {
      analytics.dailyStudyHours.push({ date: todayStr, hours: Number(hours) });
    }

    await analytics.save();
    res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserAnalytics,
  updateStudyHours
};
