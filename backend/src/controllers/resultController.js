const Result = require('../models/resultModel');
const Exam = require('../models/examModel');

// @desc    Start an exam for a student
// @route   POST /api/results/start/:examId
// @access  Private/Student
const startExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.user._id;

    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user has already started this exam
    const existingResult = await Result.findOne({ exam: examId, user: userId });
    if (existingResult) {
      // If they have an "In Progress" exam, resume it. Otherwise, block.
      if (existingResult.status === 'In Progress') {
         await existingResult.populate({
            path: 'exam',
            populate: { path: 'questions' }
        });
        // Don't send correct answers to the client
        const questions = existingResult.exam.questions.map(q => {
            const { correctAnswer, ...questionData } = q.toObject();
            return questionData;
        });
        const resultData = existingResult.toObject();
        resultData.exam.questions = questions;

        return res.json(resultData);
      }
      return res.status(400).json({ message: 'You have already completed this exam.' });
    }

    const result = new Result({
      exam: examId,
      user: userId,
      answers: [],
      status: 'In Progress',
      startTime: new Date(),
    });

    const createdResult = await result.save();
    
    // Don't send correct answers to the client
    const questions = exam.questions.map(q => {
        const { correctAnswer, ...questionData } = q.toObject();
        return questionData;
    });

    const response = {
        ...createdResult.toObject(),
        exam: {
            ...exam.toObject(),
            questions: questions
        }
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Submit an exam
// @route   POST /api/results/submit/:resultId
// @access  Private/Student
const submitExam = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }

    if (result.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit this exam.' });
    }

    if (result.status === 'Completed') {
      return res.status(400).json({ message: 'This exam has already been submitted.' });
    }

    const exam = await Exam.findById(result.exam).populate('questions');
    if (!exam) {
      return res.status(404).json({ message: 'Associated exam not found.' });
    }

    // Check if the exam time has expired
    const timeElapsed = (Date.now() - result.startTime) / (1000 * 60); // in minutes
    if (timeElapsed > exam.duration) {
      // Mark as completed with score 0 or calculate score up to that point
      result.status = 'Completed';
      result.submittedAt = Date.now();
      await result.save();
      return res.status(400).json({
        message: 'Time is up! Your exam has been submitted automatically.',
        result,
      });
    }

    let score = 0;
    const answerDetails = [];

    exam.questions.forEach(question => {
      const submittedAnswer = answers[question._id];
      const isCorrect = submittedAnswer === question.correctAnswer;
      if (isCorrect) {
        score++;
      }
      answerDetails.push({
        question: question._id,
        submittedAnswer: submittedAnswer || 'Not Answered',
        correctAnswer: question.correctAnswer,
        isCorrect,
      });
    });

    result.answers = answerDetails;
    result.score = score;
    result.status = 'Completed';
    result.endTime = new Date();
    result.submittedAt = Date.now();

    const updatedResult = await result.save();
    res.json(updatedResult);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single result by ID
// @route   GET /api/results/:id
// @access  Private
const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'exam',
        select: 'title',
      });

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Ensure only the user who took the exam or an admin can view it
    if (
      result.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: 'Not authorized to view this result' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all results for a specific exam
// @route   GET /api/results/exam/:examId
// @access  Private/Admin/Moderator
const getResults = async (req, res) => {
  try {
    const examId = req.params.examId;
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const results = await Result.find({ exam: examId })
      .populate('student', 'name email')
      .select('-answers');

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get results for the logged-in student
// @route   GET /api/results/myresults
// @access  Private/Student
const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate('exam', 'title')
      .select('-answers'); // Exclude detailed answers for the list view

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  startExam,
  submitExam,
  getResults,
  getResultById,
  getMyResults,
};
