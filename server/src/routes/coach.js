const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chat, chatStream, getHistory, deleteHistory } = require('../controllers/coachController');

router.post('/chat', protect, chat);
router.post('/chat/stream', protect, chatStream);
router.get('/history', protect, getHistory);
router.delete('/history', protect, deleteHistory);

module.exports = router;
