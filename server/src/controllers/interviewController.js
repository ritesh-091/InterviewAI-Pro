const Interview = require('../models/Interview');
const path = require('path');
const { generateInterviewPDFReport } = require('../services/pdfService');
const InterviewResult = require('../models/InterviewResult');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const { generateInterviewQuestion, evaluateInterviewAnswer, generateFinalInterviewFeedback } = require('../services/aiService');

// Total questions per interview session
const QUESTION_LIMIT = 5;

// 1. Start Interview Session
const startInterview = async (req, res, next) => {
  try {
    const { type } = req.body; // HR, Technical, System Design, Behavioral, Coding
    if (!type) {
      return res.status(400).json({ message: 'Interview type is required' });
    }

    // Generate first question from AI service
    const firstQuestionText = await generateInterviewQuestion(type, []);

    const interview = await Interview.create({
      userId: req.user._id,
      type,
      status: 'ongoing',
      questions: [{ question: firstQuestionText }],
      currentIndex: 0
    });

    res.status(201).json(interview);
  } catch (error) {
    next(error);
  }
};

// 2. Submit Answer & Advance or Complete
const submitAnswer = async (req, res, next) => {
  try {
    const { interviewId, answer } = req.body;
    if (!interviewId || answer === undefined) {
      return res.status(400).json({ message: 'Interview ID and answer are required' });
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ message: 'This interview has already been completed' });
    }

    const currIdx = interview.currentIndex;
    const currentQuestionObj = interview.questions[currIdx];

    // Evaluate answer with AI engine
    const evaluation = await evaluateInterviewAnswer(currentQuestionObj.question, answer, interview.type);

    let recordingUrl = '';
    if (req.file) {
      try {
        const { uploadFile } = require('../services/cloudinaryService');
        recordingUrl = await uploadFile(req.file.buffer, req.file.originalname || 'audio_recording.webm', 'interview_audio');
      } catch (uploadError) {
        console.error('Audio upload error:', uploadError);
      }
    }

    // Save answer and grades
    interview.questions[currIdx].answer = answer;
    interview.questions[currIdx].evaluation = evaluation;
    if (recordingUrl) {
      interview.questions[currIdx].recordingUrl = recordingUrl;
    }

    // Check if we have more questions to ask
    if (currIdx < QUESTION_LIMIT - 1) {
      // Generate next question
      const nextQuestionText = await generateInterviewQuestion(interview.type, interview.questions);
      interview.questions.push({ question: nextQuestionText });
      interview.currentIndex = currIdx + 1;
      await interview.save();

      res.status(200).json({
        isFinished: false,
        evaluatedQuestion: interview.questions[currIdx],
        nextQuestion: nextQuestionText,
        currentIndex: interview.currentIndex
      });
    } else {
      // Completed interview session!
      interview.status = 'completed';
      await interview.save();

      // Compile final aggregate scores
      const finalReport = await generateFinalInterviewFeedback(interview.questions, interview.type);

      const result = await InterviewResult.create({
        interviewId: interview._id,
        userId: req.user._id,
        overallScore: finalReport.overallScore,
        communicationScore: finalReport.communicationScore,
        technicalScore: finalReport.technicalScore,
        confidenceScore: finalReport.confidenceScore,
        detailedFeedback: finalReport.detailedFeedback,
        improvementAreas: finalReport.improvementAreas,
        suggestedAnswers: finalReport.suggestedAnswers
      });

      // Update Analytics database with new results
      const userAnalytics = await Analytics.findOne({ userId: req.user._id });
      if (userAnalytics) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Add score to history
        userAnalytics.interviewScoreHistory.push({
          date: todayStr,
          score: finalReport.overallScore,
          type: interview.type
        });

        // Add topic / skill updates
        const skillName = interview.type + ' Skills';
        const existingSkillIdx = userAnalytics.skillProgress.findIndex(s => s.skillName === skillName);
        if (existingSkillIdx > -1) {
          userAnalytics.skillProgress[existingSkillIdx].rating = finalReport.overallScore;
        } else {
          userAnalytics.skillProgress.push({
            skillName,
            rating: finalReport.overallScore
          });
        }
        await userAnalytics.save();
      }

      // Award First Attempt achievement badge
      const user = await User.findById(req.user._id);
      if (user && !user.profile.achievements.includes('First Attempt')) {
        user.profile.achievements.push('First Attempt');
        await user.save();
      }

      res.status(200).json({
        isFinished: true,
        evaluatedQuestion: interview.questions[currIdx],
        result
      });
    }
  } catch (error) {
    next(error);
  }
};

// 3. Get Interview Results Dashboard Details
const getInterviewResult = async (req, res, next) => {
  try {
    const result = await InterviewResult.findOne({ 
      interviewId: req.params.interviewId, 
      userId: req.user._id 
    }).populate('interviewId');

    if (!result) {
      return res.status(404).json({ message: 'Result not found for this interview session' });
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// 4. Get Past Interviews History
const getInterviewHistory = async (req, res, next) => {
  try {
    const history = await InterviewResult.find({ userId: req.user._id })
      .populate('interviewId')
      .sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

// 5. Download Interview PDF Report
const downloadInterviewPDFReport = async (req, res, next) => {
  try {
    const result = await InterviewResult.findOne({ 
      interviewId: req.params.interviewId
    }).populate('userId').populate('interviewId');

    if (!result) {
      return res.status(404).json({ message: 'Evaluation results not found' });
    }

    // Ensure only authorized user or recruiter can download this PDF
    const isOwner = String(result.userId._id) === String(req.user._id);
    const isInvitedRecruiter = result.interviewId.invitedBy && String(result.interviewId.invitedBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isInvitedRecruiter && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: Unauthorized report query' });
    }

    const candidateName = result.userId.profile.name || 'Candidate';
    const candidateEmail = result.userId.email;
    const mockType = result.interviewId.type;

    const reportFilename = `interview_report_${result.interviewId._id}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads', reportFilename);

    await generateInterviewPDFReport(result, candidateName, candidateEmail, mockType, outputPath);

    res.download(outputPath, reportFilename, (err) => {
      if (err) {
        console.error('Error sending PDF report file:', err);
      }
    });

  } catch (error) {
    next(error);
  }
};

const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview session not found' });
    }
    res.status(200).json(interview);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startInterview,
  submitAnswer,
  getInterviewResult,
  getInterviewHistory,
  downloadInterviewPDFReport,
  getInterviewById
};
