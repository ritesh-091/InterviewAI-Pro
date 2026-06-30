const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { 
  getSystemOverview, 
  getUsers, 
  updateUserRole, 
  createChallenge, 
  updateChallenge, 
  deleteChallenge,
  sendAnnouncement
} = require('../controllers/adminController');

// All admin routes require both JWT authentication and admin role confirmation
router.use(protect);
router.use(admin);

router.get('/overview', getSystemOverview);
router.get('/users', getUsers);
router.post('/users/role', updateUserRole);

router.post('/challenges', createChallenge);
router.put('/challenges/:id', updateChallenge);
router.delete('/challenges/:id', deleteChallenge);

router.post('/announcement', sendAnnouncement);

module.exports = router;
