
const express = require('express');
const router = express.Router();
const { startExam, submitExam, getResultById, getResultsForExam, exportResultsCSV, getExamAnalytics, getMyResults } = require('../controllers/resultController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Student actions
router.post('/start/:examId', protect, startExam);
router.post('/submit/:resultId', protect, submitExam);
router.get('/my', protect, getMyResults);

// Admin views
router.get('/exam/:examId', protect, admin, getResultsForExam);
router.get('/exam/:examId/export', protect, admin, exportResultsCSV);
router.get('/exam/:examId/analytics', protect, admin, getExamAnalytics);

// Shared
router.get('/:id', protect, getResultById);

module.exports = router;
