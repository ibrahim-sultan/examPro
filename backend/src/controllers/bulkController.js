const XLSX = require('xlsx');
const multer = require('multer');
const User = require('../models/userModel');
const Question = require('../models/questionModel');

const storage = multer.memoryStorage();
exports.upload = multer({ storage });

const readRows = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
};

// Expect columns: subject, questionText, option1, option2, option3, option4, correctOption (0-based or 1-4), explanation
exports.uploadQuestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const rows = readRows(req.file.buffer);
    const docs = [];
    for (const r of rows) {
      const options = [r.option1, r.option2, r.option3, r.option4].filter((v) => v !== '' && v !== undefined);
      let correct = Number(r.correctOption);
      if (!Number.isInteger(correct)) correct = 0;
      if (correct >= 1 && correct <= options.length) correct -= 1; // normalize 1-based to 0-based
      docs.push({
        subject: r.subject,
        questionText: r.questionText,
        options,
        correctOption: correct,
        explanation: r.explanation || '',
        createdBy: req.user._id,
      });
    }
    const created = await Question.insertMany(docs);
    res.json({ count: created.length });
  } catch (e) {
    res.status(500).json({ message: 'Upload failed' });
  }
};

// Expect columns: name, email, password, role (Student|Moderator|Super Admin), isActive
exports.uploadStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const rows = readRows(req.file.buffer);
    const ops = rows.map((r) => ({
      updateOne: {
        filter: { email: r.email },
        update: {
          $setOnInsert: {
            name: r.name,
            email: r.email,
            password: r.password || 'ChangeMe123!',
            role: r.role || 'Student',
            isActive: r.isActive !== undefined ? !!r.isActive : true,
          },
        },
        upsert: true,
      },
    }));
    const result = await User.bulkWrite(ops);
    res.json({ upserted: result.upsertedCount, modified: result.modifiedCount });
  } catch (e) {
    res.status(500).json({ message: 'Upload failed' });
  }
};
