
const express = require('express');
const router = express.Router();
const {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getSubjects,
} = require('../controllers/questionController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Subjects list for students/admins
router.get('/subjects', protect, getSubjects);

// Admin-only question CRUD
router
  .route('/')
  .post(protect, admin, createQuestion)
  .get(protect, admin, getQuestions);

router
  .route('/:id')
  .get(protect, admin, getQuestionById)
  .put(protect, admin, updateQuestion)
  .delete(protect, admin, deleteQuestion);

module.exports = router;
