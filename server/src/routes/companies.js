const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCompanies, getCompanyByName, toggleBookmark, updateProgress, addExperience } = require('../controllers/companyController');

router.get('/', protect, getCompanies);
router.get('/:name', protect, getCompanyByName);
router.post('/:name/bookmark', protect, toggleBookmark);
router.post('/:name/progress', protect, updateProgress);
router.post('/:name/experience', protect, addExperience);

module.exports = router;
