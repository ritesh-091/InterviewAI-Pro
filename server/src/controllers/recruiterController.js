const crypto = require('crypto');
const User = require('../models/User');
const Interview = require('../models/Interview');
const InterviewResult = require('../models/InterviewResult');
const Analytics = require('../models/Analytics');
const { sendInterviewInvitation } = require('../services/emailService');
const { generateInterviewQuestion } = require('../services/aiService');

// 1. Invite Candidate to Complete an Interview Round
const inviteCandidate = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    if (!email || !type) {
      return res.status(400).json({ message: 'Candidate email and interview type are required' });
    }

    const recruiterCompanyName = req.user.profile.name || 'Your Prospective Employer';

    // Check if candidate account exists
    let candidate = await User.findOne({ email });
    if (!candidate) {
      // Create a placeholder user account for the candidate
      const randomPassword = crypto.randomBytes(16).toString('hex');
      candidate = await User.create({
        email,
        password: randomPassword,
        isVerified: true, // Mark verified to skip sign-up blocks on invite entry
        profile: {
          name: email.split('@')[0],
          title: 'Candidate Developer'
        }
      });

      // Initialize analytics for candidate
      await Analytics.create({
        userId: candidate._id,
        dailyStudyHours: [],
        interviewScoreHistory: [],
        skillProgress: [],
        codingProgress: { easyCompleted: 0, mediumCompleted: 0, hardCompleted: 0 }
      });
    }

    // Generate first question for the candidate round from AI service
    const firstQuestionText = await generateInterviewQuestion(type, []);

    // Create pre-allocated interview session
    const interview = await Interview.create({
      userId: candidate._id,
      invitedBy: req.user._id,
      invitationEmail: email,
      type,
      status: 'ongoing',
      questions: [{ question: firstQuestionText }],
      currentIndex: 0
    });

    // Invite link
    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/mock-interview?session=${interview._id}`;
    
    // Dispatch invite email
    await sendInterviewInvitation(email, inviteLink, recruiterCompanyName);

    res.status(201).json({
      message: `Candidate invitation successfully dispatched to ${email}`,
      inviteLink,
      interviewId: interview._id
    });

  } catch (error) {
    next(error);
  }
};

// 2. Get Invited Candidates list and score reports
const getInvitedCandidates = async (req, res, next) => {
  try {
    // Find all interviews initiated by this recruiter
    const interviews = await Interview.find({ invitedBy: req.user._id });
    const interviewIds = interviews.map(i => i._id);

    // Fetch corresponding results
    const results = await InterviewResult.find({ interviewId: { $in: interviewIds } })
      .populate('userId', 'email profile.name')
      .populate('interviewId', 'type status updatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  inviteCandidate,
  getInvitedCandidates
};
