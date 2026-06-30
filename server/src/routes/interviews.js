const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { startInterview, submitAnswer, getInterviewResult, getInterviewHistory, downloadInterviewPDFReport, getInterviewById } = require('../controllers/interviewController');

// Multer configuration for memory uploads of audio binaries
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit for voice clips
});

router.post('/start', protect, startInterview);
router.post('/answer', protect, upload.single('audio'), submitAnswer);
router.get('/result/:interviewId', protect, getInterviewResult);
router.get('/result/:interviewId/pdf', protect, downloadInterviewPDFReport);
router.get('/history', protect, getInterviewHistory);
router.get('/:id', protect, getInterviewById);

module.exports = router;
