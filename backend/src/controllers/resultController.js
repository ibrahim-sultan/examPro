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

const parseQuestionLabel = (label) => {
  const raw = String(label || '').trim().toLowerCase();
  const parts = raw.match(/^(\d+)\s*([a-z]+)?$/i);
  if (!parts) return [Number.MAX_SAFE_INTEGER, raw];
  return [Number(parts[1]), parts[2] || ''];
};

const compareQuestionLabels = (labelA, labelB) => {
  const [numA, suffixA] = parseQuestionLabel(labelA);
  const [numB, suffixB] = parseQuestionLabel(labelB);
  if (numA !== numB) return numA - numB;
  if (suffixA !== suffixB) return suffixA.localeCompare(suffixB);
  return 0;
};

const sortTheoryQuestions = (questions) =>
  [...questions].sort((a, b) => compareQuestionLabels(a.questionLabel, b.questionLabel));

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

    if (req.user.role === 'Student' && exam.classLevel && exam.department) {
      if (
        String(req.user.classLevel).toUpperCase() !== String(exam.classLevel).toUpperCase() ||
        String(req.user.department) !== String(exam.department)
      ) {
        return res.status(403).json({ message: 'Not authorized to start this exam' });
      }
    }
    if (req.user.role === 'Student' && exam.passportRequired && !req.user.passportPhoto) {
      return res.status(403).json({ message: 'Passport photo is required before starting this exam' });
    }

    // Check if user has already completed this exam (only one attempt allowed)
    const completedResult = await Result.findOne({ exam: examId, user: userId, status: 'Completed' });
    if (completedResult) {
      return res.status(400).json({ message: 'You have already completed this exam. Only one attempt is allowed.' });
    }

    // Check if user has an existing session for this exam
    const existingResult = await Result.findOne({ exam: examId, user: userId, status: 'In Progress' }).sort({ createdAt: -1 });
    if (existingResult) {
      if (existingResult.status === 'In Progress') {
        const elapsedMinutes = (Date.now() - new Date(existingResult.startTime).getTime()) / (1000 * 60);
        if (elapsedMinutes <= exam.duration) {
          // Reconstruct display options from saved optionOrder
          const examObj = exam.toObject();
          const answersMap = new Map(
            existingResult.answers.map((a) => [a.question.toString(), a.optionOrder])
          );
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
          return res.json({
            ...existingResult.toObject(),
            exam: { ...examObj, questions: sanitizedQuestions },
          });
        }

        existingResult.status = 'Completed';
        existingResult.submittedAt = new Date();
        await existingResult.save();

        return res.status(400).json({
          message: 'Your previous exam session has expired. Only one attempt is allowed.',
        });
      }
    }

    // New session: build answers skeleton with per-question option order
    const examObj = exam.toObject();
    let questions = examObj.questions;

    if (exam.randomizeQuestions) {
      const objectiveQuestions = questions.filter((q) => q.type !== 'theory');
      const theoryQuestions = questions.filter((q) => q.type === 'theory');
      questions = [...shuffle(objectiveQuestions), ...sortTheoryQuestions(theoryQuestions)];
    } else {
      const objectiveQuestions = questions.filter((q) => q.type !== 'theory');
      const theoryQuestions = questions.filter((q) => q.type === 'theory');
      questions = [...objectiveQuestions, ...sortTheoryQuestions(theoryQuestions)];
    }

    const answersSkeleton = questions.map((q) => {
      const safeOptions = Array.isArray(q.options) ? q.options : [];
      const order = q.type === 'objective' && safeOptions.length ? shuffle([...Array(safeOptions.length).keys()]) : [];
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
      const safeOptions = Array.isArray(q.options) ? q.options : [];
      const displayOptions = Array.isArray(ans.optionOrder)
        ? ans.optionOrder.map((idx) => safeOptions[idx]).filter(Boolean)
        : [];
      const { correctAnswer, options, ...rest } = q;

      const theoryInstruction =
        q.type === 'theory'
          ? (q.instruction && q.instruction.trim()
              ? q.instruction
              : 'Answer this question in the answer booklet provided')
          : undefined;

      return {
        ...rest,
        options: q.type === 'objective' ? displayOptions : [],
        instruction: theoryInstruction,
      };
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
      const safeOptions = Array.isArray(question.options) ? question.options : [];

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
          : question.type === 'objective'
            ? [...Array(safeOptions.length).keys()]
            : [];

      const selectedOriginalIndex =
        selectedDisplayIndex !== null && optionOrder[selectedDisplayIndex] !== undefined
          ? optionOrder[selectedDisplayIndex]
          : null;

      let isCorrect = false;
      if (question.type === 'objective') {
        isCorrect =
          selectedOriginalIndex !== null &&
          typeof question.correctAnswer === 'string' &&
          safeOptions[selectedOriginalIndex] &&
          safeOptions[selectedOriginalIndex].toLowerCase() === question.correctAnswer.toLowerCase();

        if (isCorrect) {
          score += 1;
        }
      }

      answerDetails.push({
        question: question._id,
        selectedOption: question.type === 'objective' ? selectedDisplayIndex : null,
        textAnswer: question.type === 'theory' ? String(rawVal || '').trim() : '',
        optionOrder,
        isCorrect: question.type === 'objective' ? isCorrect : null,
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
// @access  Private/Admin (students cannot view detailed results)
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

    // Load exam questions so we can safely recompute scores from answers if needed
    const exam = await Exam.findById(examId).populate('questions');
    const questionMap = new Map();
    if (exam && Array.isArray(exam.questions)) {
      exam.questions.forEach((q) => {
        if (q && q._id) {
          questionMap.set(q._id.toString(), q);
        }
      });
    }

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
      Student.find({ _id: { $in: userIds } }).select('name email admissionNumber'),
    ]);

    const accountMap = new Map();
    users.forEach((u) => accountMap.set(u._id.toString(), u));
    students.forEach((s) => accountMap.set(s._id.toString(), s));

    const rows = [
      ['Name', 'Email', 'Admission Number', 'Subject', 'Objective Score', 'Theory Answered', 'Status', 'Start Time', 'End Time', 'Tab Switches', 'Copy/Paste Attempts'],
    ];

    for (const r of results) {
      // Skip non-completed results in export
      if (r.status !== 'Completed') continue;
      
      const account = r.user ? accountMap.get(r.user.toString()) : null;

      // Prefer stored score, but if it's missing or clearly wrong while answers exist,
      // recompute from answers to ensure exported scores are accurate.
      let effectiveScore = typeof r.score === 'number' && !Number.isNaN(r.score) ? r.score : 0;
      let theoryAnswered = 0;
      if (Array.isArray(r.answers) && r.answers.length && questionMap.size) {
        let recomputed = 0;
        for (const ans of r.answers) {
          if (!ans || !ans.question) continue;
          const q = questionMap.get(ans.question.toString());
          if (!q) continue;
          if (q.type === 'theory') {
            if (String(ans.textAnswer || '').trim()) theoryAnswered += 1;
            continue;
          }
          if (!Array.isArray(q.options)) continue;

          let selectedOriginalIndex = null;

          if (
            Array.isArray(ans.optionOrder) &&
            ans.optionOrder.length &&
            typeof ans.selectedOption === 'number' &&
            ans.selectedOption >= 0 &&
            ans.selectedOption < ans.optionOrder.length
          ) {
            // Map from displayed index back to original index
            selectedOriginalIndex = ans.optionOrder[ans.selectedOption];
          } else if (typeof ans.selectedOption === 'number') {
            // Fallback for legacy data where selectedOption already stored original index
            selectedOriginalIndex = ans.selectedOption;
          }

          if (
            selectedOriginalIndex !== null &&
            q.options &&
            Array.isArray(q.options) &&
            q.correctAnswer
          ) {
            const selectedOption = q.options[selectedOriginalIndex];
            if (
              selectedOption &&
              String(selectedOption).toLowerCase() === String(q.correctAnswer).toLowerCase()
            ) {
              recomputed += 1;
            }
          }
        }
        effectiveScore = recomputed;
      }

      rows.push([
        account?.name || '',
        account?.email || '',
        account?.admissionNumber || '',
        exam?.subject || '',
        effectiveScore,
        theoryAnswered,
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
    const results = await Result.find({ user: req.user._id, status: 'Completed' })
      .select('-answers')
      .populate({
        path: 'exam',
        select: 'title subject',
        options: { strictPopulate: false }
      })
      .lean()
      .sort({ submittedAt: -1, createdAt: -1 });
    
    const validResults = results.filter(r => r.exam !== null);
    // Deduplicate: keep only the most recent result per exam
    const examMap = new Map();
    validResults.forEach((result) => {
      const examId = result.exam?._id?.toString();
      if (examId) {
        if (!examMap.has(examId) || new Date(result.createdAt) > new Date(examMap.get(examId).createdAt)) {
          examMap.set(examId, result);
        }
      }
    });
    const deduplicatedResults = Array.from(examMap.values());
    res.json(deduplicatedResults || []);
  } catch (e) {
    console.error('getMyResults error:', e.message);
    res.status(500).json({ message: 'Server Error', details: e.message });
  }
};

module.exports = { startExam, submitExam, getResultById, getResultsForExam, exportResultsCSV, getExamAnalytics, getMyResults };
