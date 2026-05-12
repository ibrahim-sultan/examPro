
const Result = require('../models/resultModel');
const Exam = require('../models/examModel');
const Question = require('../models/questionModel');
const Subject = require('../models/subjectModel');

const ALLOWED_CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
const ALLOWED_DEPARTMENTS = ['General', 'Science', 'Art', 'Commercial'];

const normalizeValue = (value) => String(value || '').trim();
const normalizeDepartment = (value) => {
  const department = normalizeValue(value);
  if (/^commercial$/i.test(department)) return 'Commercial';
  return department;
};
const isValidClassDepartment = (classLevel, department) => {
  const level = normalizeValue(classLevel).toUpperCase();
  const dept = normalizeDepartment(department);
  if (!ALLOWED_CLASS_LEVELS.includes(level) || !ALLOWED_DEPARTMENTS.includes(dept)) return false;
  if (level.startsWith('JSS')) return dept === 'General';
  if (level.startsWith('SS')) return ['Science', 'Art', 'Commercial'].includes(dept);
  return false;
};

const getExams = async (req, res) => {
  try {
    const query = {};
    const exams = await Exam.find(query).select('-questions');
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (req.user.role === 'Student' && exam.status !== 'Published') {
      return res.status(403).json({ message: 'Not authorized to view this exam' });
    }

    if (req.user.role === 'Student') {
      if (exam.classLevel && exam.department) {
        if (
          normalizeValue(req.user.classLevel).toUpperCase() !== normalizeValue(exam.classLevel).toUpperCase() ||
          normalizeDepartment(req.user.department) !== normalizeDepartment(exam.department)
        ) {
          return res.status(403).json({ message: 'Not authorized to view this exam' });
        }
      }

      const examDetailsForStudent = {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject,
        duration: exam.duration,
        startTime: exam.startTime,
        endTime: exam.endTime,
        questionCount: exam.questions.length,
        classLevel: exam.classLevel,
        department: exam.department,
      };
      return res.json(examDetailsForStudent);
    }

    await exam.populate('questions');
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      classLevel,
      department,
      duration,
      startTime,
      endTime,
      markingScheme,
      randomizeQuestions,
      passportRequired,
      questionCount,
      assignedGroups,
      status,
    } = req.body;

    if ((classLevel && !department) || (!classLevel && department)) {
      return res.status(400).json({ message: 'Both classLevel and department must be provided together' });
    }

    if (classLevel && department && !isValidClassDepartment(classLevel, department)) {
      return res.status(400).json({ message: 'Invalid classLevel or department for this exam' });
    }

    // Auto-create subject if it doesn't exist
    if (subject && subject.trim()) {
      const normalizedSubject = subject.trim().toLowerCase();
      let subjectDoc = await Subject.findOne({ name: normalizedSubject });
      if (!subjectDoc) {
        subjectDoc = await Subject.create({
          name: normalizedSubject,
          displayName: subject.trim(),
          createdBy: req.user._id,
        });
      }
    }

    const match = { subject };
    if (classLevel) match.classLevel = normalizeValue(classLevel).toUpperCase();
    if (department) match.department = normalizeDepartment(department);

    const desiredCount = Number(questionCount) || 10;
    const questions = await Question.aggregate([
      { $match: match },
      { $sample: { size: desiredCount } },
    ]);

    if (questions.length < desiredCount) {
      return res.status(400).json({ message: `Not enough questions in the bank for the selected filters. Found only ${questions.length}.` });
    }

    const questionIds = questions.map((q) => q._id);

    const exam = new Exam({
      title,
      description,
      subject,
      classLevel: classLevel ? normalizeValue(classLevel).toUpperCase() : undefined,
      department: department ? normalizeDepartment(department) : undefined,
      duration,
      startTime,
      endTime,
      markingScheme,
      randomizeQuestions,
      passportRequired: !!passportRequired,
      questions: questionIds,
      createdBy: req.user._id,
      assignedGroups,
      status: status || 'Draft',
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

    const studentGroups = Array.isArray(student.groups) && student.groups.length > 0 
      ? student.groups 
      : [];
    
    const studentClassLevel = normalizeValue(student.classLevel).toUpperCase();
    const studentDepartment = normalizeValue(student.department);
    const studentSubjects = Array.isArray(student.subjects)
      ? student.subjects.map((s) => normalizeValue(s).toLowerCase()).filter(Boolean)
      : [];

    const orConditions = [
      { assignedGroups: { $exists: false } },
      { assignedGroups: { $size: 0 } },
    ];

    if (studentGroups.length > 0) {
      orConditions.push({ assignedGroups: { $in: studentGroups } });
    }

    const classDepartmentFilter = {
      $or: [
        { classLevel: { $exists: false } },
        { classLevel: '' },
        { department: { $exists: false } },
        { department: '' },
        { classLevel: studentClassLevel, department: studentDepartment },
      ],
    };

    const [completedResults, exams] = await Promise.all([
      Result.find({ user: student._id, status: 'Completed' }).select('exam').lean(),
      Exam.find({
        status: 'Published',
        startTime: { $lte: now },
        endTime: { $gte: now },
        $or: orConditions,
        ...classDepartmentFilter,
      }).select('-questions -markingScheme -createdBy').lean(),
    ]);

    const completedExamIds = new Set(completedResults.map((result) => result.exam.toString()));
    const availableExams = exams.filter((exam) => {
      if (completedExamIds.has(exam._id.toString())) return false;
      if (!studentSubjects.length) return true;
      return studentSubjects.includes(normalizeValue(exam.subject).toLowerCase());
    });

    res.json(availableExams);
  } catch (error) {
    console.error('getAvailableExams error:', error);
    res.status(500).json({ message: 'Server Error', details: error.message });
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
