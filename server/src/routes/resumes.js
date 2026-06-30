const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { uploadResume, getResumeHistory, deleteResume, compareResume } = require('../controllers/resumeController');

// Multer memory configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported!'), false);
    }
  }
});

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.post('/compare', protect, upload.single('resume'), compareResume);
router.get('/', protect, getResumeHistory);
router.delete('/:id', protect, deleteResume);

module.exports = router;
