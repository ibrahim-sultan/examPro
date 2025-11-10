
const express = require('express');
const router = express.Router();
const {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { protect, admin } = require('../middlewares/authMiddleware');

// All routes are protected and admin-only
router.route('/')
  .post(protect, admin, createQuestion)
  .get(protect, admin, getQuestions);

router.route('/:id')
  .get(protect, admin, getQuestionById)
  .put(protect, admin, updateQuestion)
  .delete(protect, admin, deleteQuestion);

module.exports = router;
