const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const CodingChallenge = require('../models/CodingChallenge');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const Analytics = require('../models/Analytics');

// 1. Get System Analytics Overview
const getSystemOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalResumes = await Resume.countDocuments();
    const totalInterviews = await Interview.countDocuments();
    const totalChallenges = await CodingChallenge.countDocuments();

    // Calculate subscription breakdown
    const proUsers = await User.countDocuments({ 'subscription.plan': 'pro' });
    const premiumUsers = await User.countDocuments({ 'subscription.plan': 'premium' });
    const freeUsers = await User.countDocuments({ 'subscription.plan': 'free' });

    res.status(200).json({
      totals: {
        users: totalUsers,
        resumes: totalResumes,
        interviews: totalInterviews,
        challenges: totalChallenges
      },
      subscriptions: {
        free: freeUsers,
        pro: proUsers,
        premium: premiumUsers
      },
      apiUsage: {
        successRate: 99.4,
        averageLatencyMs: 340,
        totalRequestsToday: 1420
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Manage Users List
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and target role are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();
    res.status(200).json({ message: 'User role updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// 3. Question Bank CRUD Operations
const createChallenge = async (req, res, next) => {
  try {
    const challenge = await CodingChallenge.create(req.body);
    res.status(201).json({ message: 'Coding challenge created successfully', challenge });
  } catch (error) {
    next(error);
  }
};

const updateChallenge = async (req, res, next) => {
  try {
    const challenge = await CodingChallenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.status(200).json({ message: 'Coding challenge updated successfully', challenge });
  } catch (error) {
    next(error);
  }
};

const deleteChallenge = async (req, res, next) => {
  try {
    const challenge = await CodingChallenge.findByIdAndDelete(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.status(200).json({ message: 'Coding challenge deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 4. Send Platform Announcement to All Users
const sendAnnouncement = async (req, res, next) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Announcement title and content message are required' });
    }

    // Get all user IDs
    const users = await User.find({}).select('_id');
    
    // Create notifications for each user
    const notifications = users.map(u => ({
      userId: u._id,
      title: `[Platform] ${title}`,
      message,
      type: 'info'
    }));

    await Notification.insertMany(notifications);

    res.status(200).json({ message: `Announcement successfully dispatched to ${users.length} active users.` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemOverview,
  getUsers,
  updateUserRole,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  sendAnnouncement
};
