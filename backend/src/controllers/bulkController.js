const XLSX = require('xlsx');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Question = require('../models/questionModel');


// ============================
// Multer Memory Storage
// ============================
const storage = multer.memoryStorage();
exports.upload = multer({ storage });


// ============================
// Helper: Read Excel Sheet
// ============================
const normalizeValue = (value) => String(value || '').trim();
const makeQuestionKey = (subject, questionText, options, correctIndex) => {
  return `${normalizeValue(subject)}|${normalizeValue(questionText)}|${options
    .map((opt) => normalizeValue(opt))
    .join('|')}|${correctIndex}`;
};

const readRows = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
};



// ============================================================================
//  UPLOAD QUESTIONS  (supports text, number, A–D, option1–4)
// ============================================================================
exports.uploadQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const rows = readRows(req.file.buffer);
    const docs = [];
    const seen = new Set();

    for (const r of rows) {
      const subject = normalizeValue(r.subject);
      const questionText = normalizeValue(r.questionText || r.question || r.text);
      const options = [r.option1, r.option2, r.option3, r.option4]
        .map(normalizeValue)
        .filter((opt) => opt.length > 0);
      const explanation = normalizeValue(r.explanation);

      if (!subject || !questionText || options.length < 2) {
        continue;
      }

      let raw = normalizeValue(r.correctOption).toLowerCase();
      let correctIndex = 0;

      if (/^[1-4]$/.test(raw)) {
        correctIndex = Number(raw) - 1;
      } else if (['a', 'b', 'c', 'd'].includes(raw)) {
        correctIndex = raw.charCodeAt(0) - 97;
      } else if (/^option[1-4]$/.test(raw)) {
        const num = Number(raw.replace('option', ''));
        correctIndex = num - 1;
      } else {
        const matchIndex = options.findIndex(
          (opt) => normalizeValue(opt).toLowerCase() === raw
        );
        if (matchIndex !== -1) {
          correctIndex = matchIndex;
        }
      }

      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }

      const key = makeQuestionKey(subject, questionText, options, correctIndex);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      docs.push({
        subject,
        questionText,
        options,
        correctOption: correctIndex,
        explanation,
        createdBy: req.user._id,
      });
    }

    if (docs.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No valid questions found in the uploaded file.',
        count: 0,
        skipped: rows.length,
      });
    }

    const existingQuestions = await Question.find({
      subject: { $in: Array.from(new Set(docs.map((d) => d.subject))) },
      questionText: { $in: Array.from(new Set(docs.map((d) => d.questionText))) },
    }).lean();

    const existingKeys = new Set(
      existingQuestions.map((q) =>
        makeQuestionKey(
          q.subject,
          q.questionText,
          Array.isArray(q.options) ? q.options : [],
          q.correctOption
        )
      )
    );

    const uniqueDocs = docs.filter(
      (doc) => !existingKeys.has(makeQuestionKey(doc.subject, doc.questionText, doc.options, doc.correctOption))
    );
    const skipped = docs.length - uniqueDocs.length;

    if (uniqueDocs.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No new questions to upload. Duplicates were skipped.',
        count: 0,
        skipped,
      });
    }

    const created = await Question.insertMany(uniqueDocs);

    res.json({
      status: 'success',
      message: 'Questions uploaded successfully',
      count: created.length,
      skipped,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed' });
  }
};



// ============================================================================
//  UPLOAD STUDENTS (clean & improved)
// ============================================================================
exports.uploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const rows = readRows(req.file.buffer);
    const ops = [];

    for (const r of rows) {

      const plainPassword = r.password || 'ChangeMe123!';
      const hashedPassword = await bcrypt.hash(String(plainPassword), 10);

      ops.push({
        updateOne: {
          filter: { email: r.email },
          update: {
            $setOnInsert: {
              name: r.name,
              email: r.email,
              password: hashedPassword,
              role: 'Student',
              isActive: r.isActive !== undefined ? !!r.isActive : true
            }
          },
          upsert: true
        }
      });
    }

    const result = await Student.bulkWrite(ops);

    res.json({
      status: 'success',
      upserted: result.upsertedCount,
      modified: result.modifiedCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed' });
  }
};
