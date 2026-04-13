
const express = require('express');
const { protect, admin } = require('../middlewares/authMiddleware');
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  getAvailableExams,
} = require('../controllers/examController');
const router = express.Router();

// Student route
router.route('/available').get(protect, getAvailableExams);

// Admin-only routes for creating exams
router.route('/').post(protect, admin, createExam);

// Routes accessible by both students and admins
router.route('/').get(protect, getExams);
router.route('/:id')
  .get(protect, getExamById) // Changed from admin to protect
  .put(protect, admin, updateExam)
  .delete(protect, admin, deleteExam);

module.exports = router;
