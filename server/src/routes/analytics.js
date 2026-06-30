const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUserAnalytics, updateStudyHours } = require('../controllers/analyticsController');

router.get('/', protect, getUserAnalytics);
router.post('/study-hours', protect, updateStudyHours);

module.exports = router;
