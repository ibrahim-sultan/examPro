
const asyncHandler = require('express-async-handler');
const Question = require('../models/questionModel');

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private/Admin
const createQuestion = asyncHandler(async (req, res) => {
  const { question, options, correctOption, subject, points } = req.body;

  const newQuestion = new Question({
    question,
    options,
    correctOption,
    subject,
    points,
    createdBy: req.user._id,
  });

  const createdQuestion = await newQuestion.save();
  res.status(201).json(createdQuestion);
});

// @desc    Get all questions
// @route   GET /api/questions
// @access  Private/Admin
const getQuestions = asyncHandler(async (req, res) => {
  // Optional: Add filtering by subject from query params
  const subject = req.query.subject ? { subject: req.query.subject } : {};
  const questions = await Question.find({ ...subject }).populate(
    'createdBy',
    'name'
  );
  res.json(questions);
});

// @desc    Get a single question by ID
// @route   GET /api/questions/:id
// @access  Private/Admin
const getQuestionById = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (question) {
    res.json(question);
  } else {
    res.status(404);
    throw new Error('Question not found');
  }
});

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private/Admin
const updateQuestion = asyncHandler(async (req, res) => {
  const { question, options, correctOption, subject, points } = req.body;

  const existingQuestion = await Question.findById(req.params.id);

  if (existingQuestion) {
    existingQuestion.question = question || existingQuestion.question;
    existingQuestion.options = options || existingQuestion.options;
    existingQuestion.correctOption =
      correctOption || existingQuestion.correctOption;
    existingQuestion.subject = subject || existingQuestion.subject;
    existingQuestion.points = points || existingQuestion.points;

    const updatedQuestion = await existingQuestion.save();
    res.json(updatedQuestion);
  } else {
    res.status(404);
    throw new Error('Question not found');
  }
});

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (question) {
    await question.deleteOne();
    res.json({ message: 'Question removed' });
  } else {
    res.status(404);
    throw new Error('Question not found');
  }
});

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
};
