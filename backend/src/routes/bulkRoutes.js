const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const bulk = require('../controllers/bulkController');

router.post('/questions', protect, admin, bulk.upload.single('file'), bulk.uploadQuestions);
router.post('/students', protect, admin, bulk.upload.single('file'), bulk.uploadStudents);

module.exports = router;
