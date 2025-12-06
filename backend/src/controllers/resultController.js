const Result = require('../models/resultModel');
const Exam = require('../models/examModel');
const User = require('../models/userModel');
const Student = require('../models/studentModel');

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

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
      if (existingResult.status === 'In Progress') {
        // Reconstruct display options from saved optionOrder
        const examObj = exam.toObject();
        const answersMap = new Map(existingResult.answers.map((a) => [a.question.toString(), a.optionOrder]));
        let questions = examObj.questions;
        // Preserve question order using the order in answers
        if (existingResult.answers?.length) {
          const order = existingResult.answers.map((a) => a.question.toString());
          const mapQ = new Map(questions.map((q) => [q._id.toString(), q]));
          questions = order.map((id) => mapQ.get(id)).filter(Boolean);
        }
        const sanitizedQuestions = questions.map((q) => {
          const { correctOption, options, ...rest } = q;
          const order = answersMap.get(q._id.toString()) || [...options.keys?.()];
          const displayed = Array.isArray(order) ? order.map((idx) => options[idx]) : options;
          return { ...rest, options: displayed };
        });
        return res.json({ ...existingResult.toObject(), exam: { ...examObj, questions: sanitizedQuestions } });
      }
      return res.status(400).json({ message: 'You have already completed this exam.' });
    }

    // New session: build answers skeleton with per-question option order
    const examObj = exam.toObject();
    let questions = examObj.questions;
    if (exam.randomizeQuestions) questions = shuffle(questions);

    const answersSkeleton = questions.map((q) => {
      const order = shuffle([...Array(q.options.length).keys()]);
      return { question: q._id, optionOrder: order };
    });

    const createdResult = await Result.create({
      exam: examId,
      user: userId,
      answers: answersSkeleton,
      status: 'In Progress',
      startTime: new Date(),
    });

    const sanitizedQuestions = questions.map((q) => {
      const ans = answersSkeleton.find((a) => a.question.toString() === q._id.toString());
      const displayOptions = ans.optionOrder.map((idx) => q.options[idx]);
      const { correctOption, options, ...rest } = q;
      return { ...rest, options: displayOptions };
    });

    res.status(201).json({ ...createdResult.toObject(), exam: { ...examObj, questions: sanitizedQuestions } });
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
    const rawAnswers = (req.body && req.body.answers) || {}; // { [questionId]: selectedDisplayIndex }
    const userId = req.user._id;

    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ message: 'Exam session not found.' });
    if (result.user.toString() !== userId.toString())
      return res.status(403).json({ message: 'Not authorized to submit this exam.' });
    if (result.status === 'Completed')
      return res.status(400).json({ message: 'This exam has already been submitted.' });

    const exam = await Exam.findById(result.exam).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Associated exam not found.' });

    const timeElapsed = (Date.now() - result.startTime) / (1000 * 60);
    if (timeElapsed > exam.duration) {
      result.status = 'Completed';
      result.submittedAt = new Date();
      await result.save();
      return res.status(400).json({ message: 'Time is up! Auto-submitted.', result });
    }

    let score = 0;
    const answerDetails = [];

    // Filter out any malformed entries from legacy data
    const resultAnswersArray = Array.isArray(result.answers)
      ? result.answers.filter((a) => a && a.question)
      : [];

    exam.questions.forEach((question) => {
      const qid = question._id.toString();

      // Answers come from the frontend as an object: { [questionId]: selectedDisplayIndex }.
      // In practice, the indices may be numbers or numeric strings, so normalise to Number.
      const rawVal = rawAnswers[qid];
      const selectedDisplayIndex =
        rawVal !== undefined && rawVal !== null && !Number.isNaN(Number(rawVal))
          ? Number(rawVal)
          : null;

      const existing = resultAnswersArray.find(
        (a) => a.question && a.question.toString() === qid
      );

      const optionOrder =
        (existing && Array.isArray(existing.optionOrder) && existing.optionOrder.length)
          ? existing.optionOrder
          : [...Array((question.options || []).length).keys()];

      const selectedOriginalIndex =
        selectedDisplayIndex !== null && optionOrder[selectedDisplayIndex] !== undefined
          ? optionOrder[selectedDisplayIndex]
          : null;

      const isCorrect =
        selectedOriginalIndex !== null && selectedOriginalIndex === question.correctOption;

      if (isCorrect) {
        // Currently +1 per correct answer. To apply exam.markingScheme, replace with that logic.
        score += 1;
      }

      answerDetails.push({
        question: question._id,
        selectedOption: selectedDisplayIndex,
        optionOrder,
        isCorrect,
      });
    });

    result.answers = answerDetails;
    result.score = score;
    result.status = 'Completed';
    result.endTime = new Date();
    result.submittedAt = new Date();

    const updatedResult = await result.save();
    res.json(updatedResult);
  } catch (error) {
    console.error('submitExam error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single result by ID
// @route   GET /api/results/:id
<<<<<<< HEAD
// @access  Private/Admin (students cannot view detailed results)
=======
// @access  Private
>>>>>>> 203c0421ccb22ef29f61bfd648cb51f552759cb7
const getResultById = async (req, res) => {
  try {
    const id = req.params.id;

    // Guard against invalid ObjectId strings causing a 500
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid result ID' });
    }

    // We do not populate the `user` field here because it may point to either a
    // User or a Student document. Instead, we authorise by comparing raw IDs
    // and only populate the exam metadata that the frontend needs.
    const result = await Result.findById(id).populate({ path: 'exam', select: 'title duration' });

    if (!result) return res.status(404).json({ message: 'Result not found' });

    const currentUser = req.user || {};
    const role = currentUser.role || '';
    const isAdmin = role === 'Super Admin' || role === 'Moderator';

    // Only admins can view detailed exam results; students are not allowed
    if (!isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this result' });
    }

    res.json(result);
  } catch (error) {
    console.error('getResultById error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// List results for an exam (admin)
const getResultsForExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const results = await Result.find({ exam: examId }).populate('user', 'name email');
    res.json(results);
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Export CSV for exam results (admin)
// NOTE: Result.user may point to either a User or a Student document.
// We therefore resolve names/emails by looking in both collections instead of relying solely on Mongoose populate.
const exportResultsCSV = async (req, res) => {
  try {
    const { examId } = req.params;
    const results = await Result.find({ exam: examId });

    // Build a unique list of account IDs referenced by results
    const userIds = Array.from(
      new Set(
        results
          .map((r) => (r.user ? r.user.toString() : null))
          .filter(Boolean)
      )
    );

    // Fetch matching accounts from both User and Student collections
    const [users, students] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('name email'),
      Student.find({ _id: { $in: userIds } }).select('name email'),
    ]);

    const accountMap = new Map();
    users.forEach((u) => accountMap.set(u._id.toString(), u));
    students.forEach((s) => accountMap.set(s._id.toString(), s));

    const rows = [
      ['Name', 'Email', 'Score', 'Status', 'Start Time', 'End Time', 'Tab Switches', 'Copy/Paste Attempts'],
    ];

    for (const r of results) {
      const account = r.user ? accountMap.get(r.user.toString()) : null;

      rows.push([
        account?.name || '',
        account?.email || '',
        r.score ?? 0,
        r.status,
        r.startTime ? new Date(r.startTime).toISOString() : '',
        r.submittedAt ? new Date(r.submittedAt).toISOString() : '',
        r.tabSwitchCount ?? 0,
        r.copyPasteAttempts ?? 0,
      ]);
    }

    const csv = rows
      .map((cols) =>
        cols
          .map((c) =>
            typeof c === 'string' && c.includes(',')
              ? `\"${c.replaceAll('\"', '\"\"')}\"`
              : c
          )
          .join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
    return res.send(csv);
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Analytics for an exam (admin)
const getExamAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;
    const results = await Result.find({ exam: examId, status: 'Completed' });
    const count = results.length;
    const totalScore = results.reduce((s, r) => s + (r.score || 0), 0);
    const avg = count ? totalScore / count : 0;
    const max = results.reduce((m, r) => Math.max(m, r.score || 0), 0);
    const min = results.reduce((m, r) => Math.min(m, r.score || 0), count ? results[0].score || 0 : 0);
    res.json({ count, average: avg, max, min });
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// My results (student)
const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user._id }).select('-answers').populate('exam', 'title');
    res.json(results);
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { startExam, submitExam, getResultById, getResultsForExam, exportResultsCSV, getExamAnalytics, getMyResults };
