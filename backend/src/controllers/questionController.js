
const asyncHandler = require('express-async-handler');
const Question = require('../models/questionModel');

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private/Admin
// Supports both:
// - payload from bulk upload: { subject, questionText, options: [string], correctOption }
// - payload from React form: { text, subject, options: [{ text, isCorrect }] }
const createQuestion = asyncHandler(async (req, res) => {
  let { subject, questionText, question, options, correctOption, points, text } = req.body;

  // If coming from the React form, options is an array of objects
  if (text && Array.isArray(options) && options.length && typeof options[0] === 'object') {
    const simpleOptions = options.map((o) => o.text);
    const idx = options.findIndex((o) => o.isCorrect);
    if (idx === -1) {
      res.status(400);
      throw new Error('Please mark one option as correct');
    }
    questionText = text;
    correctOption = idx;
    options = simpleOptions;
  }

  // Backwards compatibility: allow "question" field name
  if (!questionText && question) {
    questionText = question;
  }

  if (!subject || !questionText || !Array.isArray(options) || options.length < 2) {
    res.status(400);
    throw new Error('Subject, question text and at least two options are required');
  }

  if (typeof correctOption !== 'number' || correctOption < 0 || correctOption >= options.length) {
    res.status(400);
    throw new Error('correctOption index is invalid');
  }

  const newQuestion = new Question({
    subject,
    questionText,
    options,
    correctOption,
    // points is not currently in the schema but kept for future compatibility
    createdBy: req.user._id,
  });

  const createdQuestion = await newQuestion.save();
  res.status(201).json(createdQuestion);
});

// @desc    Get all questions
// @route   GET /api/questions
// @access  Private/Admin
const getQuestions = asyncHandler(async (req, res) => {
  const subjectFilter = req.query.subject ? { subject: req.query.subject } : {};
  const questions = await Question.find({ ...subjectFilter }).populate('createdBy', 'name');
  res.json(questions);
});

// @desc    List distinct subjects from questions
// @route   GET /api/questions/subjects
// @access  Private (students/admins)
const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Question.distinct('subject');
  res.json(subjects.filter(Boolean).sort());
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
  let { subject, questionText, question, options, correctOption, points, text } = req.body;

  // Accept React-form payload as well
  if (text && Array.isArray(options) && options.length && typeof options[0] === 'object') {
    const simpleOptions = options.map((o) => o.text);
    const idx = options.findIndex((o) => o.isCorrect);
    if (idx !== -1) {
      correctOption = idx;
    }
    questionText = text;
    options = simpleOptions;
  }

  if (!questionText && question) {
    questionText = question;
  }

  const existingQuestion = await Question.findById(req.params.id);

  if (existingQuestion) {
    if (subject) existingQuestion.subject = subject;
    if (questionText) existingQuestion.questionText = questionText;
    if (Array.isArray(options) && options.length >= 2) {
      existingQuestion.options = options;
    }
    if (typeof correctOption === 'number') {
      existingQuestion.correctOption = correctOption;
    }

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
  getSubjects,
};
