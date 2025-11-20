
const Exam = require('../models/examModel');
const Question = require('../models/questionModel');

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res) => {
  try {
    const query = {};
    // For now, show all exams to students; time and access control are handled on the client.
    // If you later want to hide archived exams, you can change this to filter by status.
    const exams = await Exam.find(query).select('-questions'); // Don't send questions in list view
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single exam by ID
// @route   GET /api/exams/:id
// @access  Private
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Students can only view published exams
    if (req.user.role === 'Student' && exam.status !== 'Published') {
      return res.status(403).json({ message: 'Not authorized to view this exam' });
    }

    // For students, we might not want to send all details before they start
    if (req.user.role === 'Student') {
        const examDetailsForStudent = {
            _id: exam._id,
            title: exam.title,
            description: exam.description,
            subject: exam.subject,
            duration: exam.duration,
            startTime: exam.startTime,
            endTime: exam.endTime,
            questionCount: exam.questions.length
        };
       return res.json(examDetailsForStudent);
    }


    // Admin gets full details
    await exam.populate('questions');
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create an exam
// @route   POST /api/exams
// @access  Private/Admin
const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      duration,
      startTime,
      endTime,
      markingScheme,
      randomizeQuestions,
      questionCount, // Number of questions to add
      assignedGroups,
    } = req.body;

    // Fetch random questions from the bank for the given subject
    const questions = await Question.aggregate([
      { $match: { subject: subject } },
      { $sample: { size: Number(questionCount) || 10 } }, // Default to 10 questions if not specified
    ]);

    if (questions.length < questionCount) {
        return res.status(400).json({ message: `Not enough questions in the bank for the subject '${subject}'. Found only ${questions.length}.` });
    }

    const questionIds = questions.map(q => q._id);

    const exam = new Exam({
      title,
      description,
      subject,
      duration,
      startTime,
      endTime,
      markingScheme,
      randomizeQuestions,
      questions: questionIds,
      createdBy: req.user._id,
      assignedGroups,
    });

    const createdExam = await exam.save();
    res.status(201).json(createdExam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
const updateExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (exam) {
            // Update fields from req.body
            Object.assign(exam, req.body);
            const updatedExam = await exam.save();
            res.json(updatedExam);
        } else {
            res.status(404).json({ message: 'Exam not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// @desc    Delete an exam
// @route   DELETE /api/exams/:id
// @access  Private/Admin
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
      await exam.deleteOne();
      res.json({ message: 'Exam removed' });
    } else {
      res.status(404).json({ message: 'Exam not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get exams available to the current student
// @route   GET /api/exams/available
// @access  Private/Student
const getAvailableExams = async (req, res) => {
  try {
    const student = req.user;
    const now = new Date();

    const exams = await Exam.find({
      status: 'Published',
      startTime: { $lte: now },
      endTime: { $gte: now },
      // Exam is available if it has no assigned groups (public)
      // OR if the student is in one of the assigned groups.
      $or: [
        { assignedGroups: { $exists: true, $size: 0 } },
        { assignedGroups: { $in: student.groups } },
      ],
    }).select('-questions -markingScheme -createdBy'); // Exclude sensitive data

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  getAvailableExams,
};
