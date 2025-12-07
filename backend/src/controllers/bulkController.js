const XLSX = require('xlsx');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Question = require('../models/questionModel');


// ------------------------------
// Multer Memory Storage
// ------------------------------
const storage = multer.memoryStorage();
exports.upload = multer({ storage });


// ------------------------------
// Helper: Read Sheet Rows
// ------------------------------
const readRows = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
};


// ============================================================================
//  UPLOAD QUESTIONS  (Supports text answers + numeric answers)
// ============================================================================

exports.uploadQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const rows = readRows(req.file.buffer);
    const docs = [];

    for (const r of rows) {

      // Normalize options
      const options = [
        r.option1,
        r.option2,
        r.option3,
        r.option4
      ].filter(v => v !== '' && v !== undefined && v !== null);

      // Normalize correctOption input
      const raw = String(r.correctOption || '').trim().toLowerCase();
      let correctIndex = 0; // default to option1

      // 1) If user enters a NUMBER (1–4)
      if (/^[1-4]$/.test(raw)) {
        correctIndex = Number(raw) - 1;
      }

      // 2) If user enters the ANSWER TEXT (e.g., "tinubu")
      else {
        const matchIndex = options.findIndex(
          opt => String(opt).trim().toLowerCase() === raw
        );

        if (matchIndex !== -1) {
          correctIndex = matchIndex;
        }
      }

      // Safety: ensure correctIndex within valid range
      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0; // fallback to option1
      }

      docs.push({
        subject: r.subject,
        questionText: r.questionText,
        options,
        correctOption: correctIndex,
        explanation: r.explanation || '',
        createdBy: req.user._id
      });
    }

    const created = await Question.insertMany(docs);

    res.json({
      status: 'success',
      message: 'Questions uploaded successfully',
      count: created.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed' });
  }
};



// ============================================================================
//  UPLOAD STUDENTS (unchanged but improved readability)
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
