
const express = require('express');
const router = express.Router();
const { startExam, submitExam, getResultById } = require('../controllers/resultController');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST /api/results/start/:examId
// @desc    Start an exam session for a student
// @access  Private
router.post('/start/:examId', protect, startExam);

// @route   POST /api/results/submit/:resultId
// @desc    Submit answers for an exam
// @access  Private
router.post('/submit/:resultId', protect, submitExam);

// @route   GET /api/results/:id
// @desc    Get a single exam result
// @access  Private
router.get('/:id', protect, getResultById);

module.exports = router;
