
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Question = require('../models/questionModel');

const ALLOWED_CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
const ALLOWED_DEPARTMENTS = ['General', 'Science', 'Art', 'Commercial'];

const normalizeText = (value) => String(value || '').trim();
const normalizeDepartment = (value) => {
  const department = normalizeText(value);
  if (/^commercial$/i.test(department)) return 'Commercial';
  return department;
};

const isValidClassDepartment = (classLevel, department) => {
  const level = normalizeText(classLevel).toUpperCase();
  const dept = normalizeDepartment(department);
  if (!ALLOWED_CLASS_LEVELS.includes(level) || !ALLOWED_DEPARTMENTS.includes(dept)) {
    return false;
  }
  if (level.startsWith('JSS')) {
    return dept === 'General';
  }
  if (level.startsWith('SS')) {
    return ['Science', 'Art', 'Commercial'].includes(dept);
  }
  return false;
};

const parseOptions = (options) => {
  if (!Array.isArray(options)) return [];
  return options
    .map((opt) => normalizeText(typeof opt === 'object' ? opt.text : opt))
    .filter((opt) => opt.length > 0);
};
const questionImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/questions');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `question-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};
const questionImageUpload = multer({ storage: questionImageStorage, fileFilter: imageFileFilter });
const normalizeSubject = (value) => normalizeText(value).toLowerCase();

const canManageSubject = (user, subject) => {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;
  const subjects = Array.isArray(user.subjects) ? user.subjects.map(normalizeSubject) : [];
  if (subjects.length === 0) return true;
  return subjects.includes(normalizeSubject(subject));
};

const canManageClassDepartment = (user, classLevel, department) => {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;
  if (!user.classLevel && !user.department) return true;
  return (
    normalizeText(user.classLevel).toUpperCase() === normalizeText(classLevel).toUpperCase() &&
    normalizeDepartment(user.department) === normalizeDepartment(department)
  );
};

const createQuestion = asyncHandler(async (req, res) => {
  let {
    question,
    questionText,
    subject,
    classLevel,
    department,
    type,
    options,
    correctAnswer,
    explanation,
    questionLabel,
    imageUrl,
    instruction,
  } = req.body;

  const text = normalizeText(question || questionText);
  subject = normalizeText(subject);
  classLevel = normalizeText(classLevel).toUpperCase();
  department = normalizeDepartment(department);
  type = normalizeText(type).toLowerCase();
  explanation = normalizeText(explanation);
  instruction = normalizeText(instruction);
  const normalizedLabel = normalizeText(questionLabel);
  const normalizedImageUrl = normalizeText(imageUrl);
  options = parseOptions(options);
  correctAnswer = normalizeText(correctAnswer);

  if (!text || !subject || !classLevel || !department || !type) {
    res.status(400);
    throw new Error('question, subject, classLevel, department and type are required');
  }
  if (!canManageSubject(req.user, subject)) {
    res.status(403);
    throw new Error('You can only create questions for subjects assigned to you');
  }
  if (!canManageClassDepartment(req.user, classLevel, department)) {
    res.status(403);
    throw new Error('You can only create questions for your assigned class/department');
  }

  if (!isValidClassDepartment(classLevel, department)) {
    res.status(400);
    throw new Error('Invalid classLevel or department combination');
  }

  if (!['objective', 'theory'].includes(type)) {
    res.status(400);
    throw new Error('type must be either objective or theory');
  }

  if (type === 'objective') {
    if (options.length < 2) {
      res.status(400);
      throw new Error('Objective questions require at least two options');
    }
    if (!correctAnswer) {
      res.status(400);
      throw new Error('Objective questions require a correctAnswer');
    }
    const normalizedOptions = options.map((opt) => opt.toLowerCase());
    if (!normalizedOptions.includes(correctAnswer.toLowerCase())) {
      res.status(400);
      throw new Error('correctAnswer must match one of the provided options');
    }
  } else {
    options = [];
    correctAnswer = '';
  }

  const newQuestion = new Question({
    subject,
    questionText: text,
    type,
    classLevel,
    department,
    options,
    correctAnswer: correctAnswer || undefined,
    instruction: type === 'theory' ? instruction : undefined,
    explanation,
    questionLabel: normalizedLabel,
    imageUrl: normalizedImageUrl,
    createdBy: req.user._id,
  });

  const createdQuestion = await newQuestion.save();
  res.status(201).json(createdQuestion);
});

const getQuestions = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.subject) filters.subject = normalizeText(req.query.subject);
  if (req.query.classLevel) filters.classLevel = normalizeText(req.query.classLevel).toUpperCase();
  if (req.query.department) filters.department = normalizeText(req.query.department);
  if (req.user.role !== 'Super Admin' && Array.isArray(req.user.subjects) && req.user.subjects.length > 0) {
    filters.subject = { $in: req.user.subjects };
  }
  if (req.user.role !== 'Super Admin' && req.user.classLevel) {
    filters.classLevel = normalizeText(req.user.classLevel).toUpperCase();
  }
  if (req.user.role !== 'Super Admin' && req.user.department) {
    filters.department = normalizeDepartment(req.user.department);
  }
  const questions = await Question.find(filters).populate('createdBy', 'name');
  res.json(questions);
});

const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Question.distinct('subject');
  res.json(subjects.filter(Boolean).sort());
});

const getQuestionById = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (question) {
    res.json(question);
  } else {
    res.status(404);
    throw new Error('Question not found');
  }
});

const updateQuestion = asyncHandler(async (req, res) => {
  let {
    question,
    questionText,
    subject,
    classLevel,
    department,
    type,
    options,
    correctAnswer,
    explanation,
    questionLabel,
    imageUrl,
    instruction,
  } = req.body;

  const text = normalizeText(question || questionText);
  subject = normalizeText(subject);
  classLevel = normalizeText(classLevel).toUpperCase();
  department = normalizeDepartment(department);
  type = normalizeText(type).toLowerCase();
  explanation = normalizeText(explanation);
  instruction = normalizeText(instruction);
  const normalizedLabel = normalizeText(questionLabel);
  const normalizedImageUrl = normalizeText(imageUrl);
  options = parseOptions(options);
  correctAnswer = normalizeText(correctAnswer);

  const existingQuestion = await Question.findById(req.params.id);

  if (!existingQuestion) {
    res.status(404);
    throw new Error('Question not found');
  }
  if (!canManageSubject(req.user, existingQuestion.subject)) {
    res.status(403);
    throw new Error('You can only update questions for subjects assigned to you');
  }
  const targetClass = classLevel || existingQuestion.classLevel;
  const targetDepartment = department || existingQuestion.department;
  if (!canManageClassDepartment(req.user, targetClass, targetDepartment)) {
    res.status(403);
    throw new Error('You can only update questions for your assigned class/department');
  }

  if (subject) existingQuestion.subject = subject;
  if (subject && !canManageSubject(req.user, subject)) {
    res.status(403);
    throw new Error('You can only update questions for subjects assigned to you');
  }
  if (text) existingQuestion.questionText = text;
  if (classLevel) existingQuestion.classLevel = classLevel;
  if (department) existingQuestion.department = department;
  if (type) existingQuestion.type = type;
  if (explanation !== undefined) existingQuestion.explanation = explanation;
  if (instruction !== undefined) existingQuestion.instruction = instruction;
  if (questionLabel !== undefined) existingQuestion.questionLabel = normalizedLabel;
  if (imageUrl !== undefined) existingQuestion.imageUrl = normalizedImageUrl;

  if (classLevel || department) {
    const validClass = classLevel || existingQuestion.classLevel;
    const validDept = department || existingQuestion.department;
    if (!isValidClassDepartment(validClass, validDept)) {
      res.status(400);
      throw new Error('Invalid classLevel or department combination');
    }
  }

  if (type === 'objective' || existingQuestion.type === 'objective') {
    const targetType = type || existingQuestion.type;
    if (targetType === 'objective') {
      if (options.length > 0) existingQuestion.options = options;
      if (options.length > 0 && options.length < 2) {
        res.status(400);
        throw new Error('Objective questions require at least two options');
      }
      if (correctAnswer) {
        existingQuestion.correctAnswer = correctAnswer;
      }
      if (!existingQuestion.correctAnswer) {
        res.status(400);
        throw new Error('Objective questions require a correctAnswer');
      }
      const normalizedOptions = existingQuestion.options.map((opt) => opt.toLowerCase());
      if (!normalizedOptions.includes(existingQuestion.correctAnswer.toLowerCase())) {
        res.status(400);
        throw new Error('correctAnswer must match one of the options');
      }
      existingQuestion.instruction = '';
    }
  }

  if (type === 'theory') {
    existingQuestion.options = [];
    existingQuestion.correctAnswer = '';
  }

  const updatedQuestion = await existingQuestion.save();
  res.json(updatedQuestion);
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (question) {
    if (!canManageSubject(req.user, question.subject)) {
      res.status(403);
      throw new Error('You can only delete questions for subjects assigned to you');
    }
    await question.deleteOne();
    res.json({ message: 'Question removed' });
  } else {
    res.status(404);
    throw new Error('Question not found');
  }
});

const deleteQuestionsBulk = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (!ids.length) {
    res.status(400);
    throw new Error('ids array is required');
  }
  const questions = await Question.find({ _id: { $in: ids } });
  const allowedIds = questions
    .filter(
      (q) =>
        canManageSubject(req.user, q.subject) &&
        canManageClassDepartment(req.user, q.classLevel, q.department)
    )
    .map((q) => q._id);
  if (!allowedIds.length) {
    res.status(403);
    throw new Error('No selected questions can be deleted with your account');
  }
  const result = await Question.deleteMany({ _id: { $in: allowedIds } });
  res.json({ deletedCount: result.deletedCount });
});

const uploadQuestionImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Question image file is required');
  }
  res.json({ imageUrl: `/uploads/questions/${req.file.filename}` });
});

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  deleteQuestionsBulk,
  uploadQuestionImage,
  questionImageUpload,
  getSubjects,
};
