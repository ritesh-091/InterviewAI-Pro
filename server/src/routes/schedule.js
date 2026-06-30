const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createSchedule, getSchedules, deleteSchedule } = require('../controllers/scheduleController');

// All scheduling routes require authentication
router.use(protect);

router.post('/', createSchedule);
router.get('/', getSchedules);
router.delete('/:id', deleteSchedule);

module.exports = router;
