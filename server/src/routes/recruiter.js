const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const recruiter = require('../middleware/recruiter');
const { inviteCandidate, getInvitedCandidates } = require('../controllers/recruiterController');

// All recruiter routes require JWT authentication and recruiter/admin privileges
router.use(protect);
router.use(recruiter);

router.post('/invite', inviteCandidate);
router.get('/candidates', getInvitedCandidates);

module.exports = router;
