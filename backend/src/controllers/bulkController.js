const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const XLSX = require('xlsx');
const MathMLToLaTeX = require('mathml-to-latex').MathMLToLaTeX;
const multer = require('multer');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const Student = require('../models/studentModel');
const Group = require('../models/groupModel');
const Question = require('../models/questionModel');

const ALLOWED_CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
const ALLOWED_DEPARTMENTS = ['General', 'Science', 'Art', 'Commercial'];

const storage = multer.memoryStorage();
exports.upload = multer({ storage });

const questionImageDir = path.join(__dirname, '../../uploads/questions');

const saveQuestionImage = async (file) => {
  fs.mkdirSync(questionImageDir, { recursive: true });
  const originalName = String(file.originalname || '').trim();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  let finalName = safeName;
  const fullPath = (name) => path.join(questionImageDir, name);
  if (fs.existsSync(fullPath(finalName))) {
    const { name, ext } = path.parse(safeName);
    finalName = `${name}-${Date.now()}${ext}`;
  }
  await fs.promises.writeFile(fullPath(finalName), file.buffer);
  return `/uploads/questions/${finalName}`;
};

const normalizeValue = (value) => normalizeMathText(String(value || '').trim());
const normalizeSubject = (value) => normalizeValue(value).toLowerCase();
const normalizeDepartment = (value) => {
  const department = normalizeValue(value).toLowerCase();
  const deptMap = {
    'general': 'General',
    'science': 'Science',
    'art': 'Art',
    'business': 'Commercial',
    'business studies': 'Commercial',
    'commerce': 'Commercial',
    'commercial': 'Commercial',
    'comm': 'Commercial',
  };
  if (deptMap[department]) return deptMap[department];
  if (/^(comm(ercial|erce)?|bus(iness)?)( studies)?$/i.test(department)) {
    return 'Commercial';
  }
  return normalizeValue(value);
};

const normalizeRow = (row) =>
  Object.keys(row || {}).reduce((acc, key) => {
    acc[String(key || '').trim().toLowerCase()] = row[key];
    return acc;
  }, {});

const normalizeMathText = (value) => {
  if (typeof value !== 'string') return value;
  const replaceSup = (match) => `^${match
    .split('')
    .map((ch) => {
      const map = {
        '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
        '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
      };
      return map[ch] || ch;
    })
    .join('')}`;
  const replaceSub = (match) => `_${match
    .split('')
    .map((ch) => {
      const map = {
        '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
        '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
      };
      return map[ch] || ch;
    })
    .join('')}`;

  const symbolMap = {
    'π': '\\pi',
    '√': '\\sqrt',
    '×': '\\times',
    '÷': '\\div',
    '±': '\\pm',
    '∞': '\\infty',
    '≤': '\\le',
    '≥': '\\ge',
    '≠': '\\neq',
  };

  return value
    .replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾]+)/g, replaceSup)
    .replace(/([₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]+)/g, replaceSub)
    .replace(/[π√×÷±∞≤≥≠]/g, (ch) => symbolMap[ch] || ch)
    .replace(/\\sqrt\s*([A-Za-z0-9]+)/g, '\\sqrt{$1}');
};

const decodeHtmlEntities = (text) =>
  String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");

const escapeRegExp = (text) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeZipPath = (value) => String(value || '').replace(/\\/g, '/').replace(/^\//, '');

const parseZipEntries = (buffer) => {
  const ZIP_EOCD_HEADER = 0x06054b50;
  const ZIP_CENTRAL_DIR_HEADER = 0x02014b50;
  const eocdLimit = Math.max(0, buffer.length - 0xFFFF - 22);
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= eocdLimit; --i) {
    if (buffer.readUInt32LE(i) === ZIP_EOCD_HEADER) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('Unable to locate ZIP end-of-central-directory record');

  const cdCount = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = cdOffset;
  const entries = {};

  for (let i = 0; i < cdCount; ++i) {
    if (buffer.readUInt32LE(offset) !== ZIP_CENTRAL_DIR_HEADER) break;
    const fileNameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer
      .toString('utf8', offset + 46, offset + 46 + fileNameLen)
      .replace(/\\\\/g, '/');

    entries[normalizeZipPath(fileName)] = {
      fileName: normalizeZipPath(fileName),
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    };
    offset += 46 + fileNameLen + extraLen + commentLen;
  }

  return entries;
};

const getZipEntryText = (buffer, entries, path) => {
  const normalizedPath = normalizeZipPath(path);
  const entry = entries[normalizedPath] || entries[Object.keys(entries).find((key) => key === normalizedPath)];
  if (!entry) return null;

  const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
  const lhOffset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(lhOffset) !== ZIP_LOCAL_FILE_HEADER) {
    throw new Error(`Invalid ZIP local header for ${entry.fileName}`);
  }

  const nameLen = buffer.readUInt16LE(lhOffset + 26);
  const extraLen = buffer.readUInt16LE(lhOffset + 28);
  const dataStart = lhOffset + 30 + nameLen + extraLen;
  const compressedData = buffer.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) return compressedData.toString('utf8');
  if (entry.compressionMethod === 8) return zlib.inflateRawSync(compressedData).toString('utf8');
  throw new Error(`Unsupported compression method ${entry.compressionMethod} for ${entry.fileName}`);
};

const getWorksheetPath = (zipEntries, workbookXml, sheetName, buffer) => {
  if (!workbookXml) return null;
  let sheetRelId;
  const sheetRegex = new RegExp(`<sheet[^>]*name=[\"']${escapeRegExp(sheetName)}[\"'][^>]*r:id=[\"']([^\"']+)[\"']`, 'i');
  const sheetMatch = workbookXml.match(sheetRegex);
  if (sheetMatch) {
    sheetRelId = sheetMatch[1];
  } else {
    const firstSheetMatch = workbookXml.match(/<sheet[^>]*r:id=[\"']([^\"']+)[\"'][^>]*>/i);
    sheetRelId = firstSheetMatch ? firstSheetMatch[1] : null;
  }
  if (!sheetRelId) return 'xl/worksheets/sheet1.xml';

  const relsXml = getZipEntryText(buffer, zipEntries, 'xl/_rels/workbook.xml.rels');
  if (!relsXml) return 'xl/worksheets/sheet1.xml';
  const relRegex = new RegExp(`<Relationship[^>]*Id=[\"']${escapeRegExp(sheetRelId)}[\"'][^>]*Target=[\"']([^\"']+)[\"']`, 'i');
  const relMatch = relsXml.match(relRegex);
  if (!relMatch) return 'xl/worksheets/sheet1.xml';
  let target = relMatch[1];
  if (target.startsWith('/')) target = target.slice(1);
  if (!target.startsWith('xl/')) target = `xl/${target}`;
  return normalizeZipPath(target);
};

const extractRawWorksheetCellText = (buffer, sheetName) => {
  const zipEntries = parseZipEntries(buffer);
  const workbookXml = getZipEntryText(buffer, zipEntries, 'xl/workbook.xml');
  const sheetPath = getWorksheetPath(zipEntries, workbookXml, sheetName, buffer);
  const worksheetXml = getZipEntryText(buffer, zipEntries, sheetPath);
  if (!worksheetXml) return new Map();

  const cellMap = new Map();
  const cellRegex = /<c\b[^>]*\br=[\"']([^\"']+)[\"'][^>]*>([\s\S]*?)<\/c>/gi;
  let match;
  while ((match = cellRegex.exec(worksheetXml))) {
    const address = match[1];
    const innerXml = match[2];
    let text = '';

    if (/<math[\s>]|<oMath\b|<m:oMath\b/i.test(innerXml)) {
      text = extractMathFromMarkup(innerXml);
    } else {
      const tMatches = Array.from(innerXml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/gi), (m) => m[1]);
      if (tMatches.length) {
        text = normalizeWhitespace(tMatches.join(' '));
      } else {
        const vMatch = innerXml.match(/<v[^>]*>([\s\S]*?)<\/v>/i);
        if (vMatch) text = normalizeWhitespace(vMatch[1]);
      }
    }

    if (text) {
      cellMap.set(address, normalizeMathText(text));
    }
  }

  return cellMap;
};

const extractMathFromMarkup = (markup) => {
  const html = decodeHtmlEntities(String(markup || ''));
  if (/<math[\s>]/i.test(html)) {
    try {
      return MathMLToLaTeX.convert(html).trim();
    } catch (_) {
      return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  if (/<\/??m:[^>]+>/i.test(html) || /<\/??oMath[^>]*>/i.test(html)) {
    return html
      .replace(/<m:t[^>]*>(.*?)<\/m:t>/gi, '$1')
      .replace(/<oMath[^>]*>/gi, ' ')
      .replace(/<\/oMath[^>]*>/gi, ' ')
      .replace(/<m:[^>]+>/gi, ' ')
      .replace(/<\/m:[^>]+>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return '';
};

const stripHtml = (html) => {
  if (!html) return '';
  const mathText = extractMathFromMarkup(html);
  if (mathText) return mathText;
  return decodeHtmlEntities(String(html))
    .replace(/<sup>(.*?)<\/sup>/gi, '^$1')
    .replace(/<sub>(.*?)<\/sub>/gi, '_$1')
    .replace(/<[^>]+>/g, '')
    .trim();
};

const parseRowOptions = (row) => {
  const optionNames = ['optiona', 'optionb', 'optionc', 'optiond', 'option1', 'option2', 'option3', 'option4'];
  const foundOptions = optionNames
    .map((name) => {
      const val = row[name] || row[name.toUpperCase()] || row[name.charAt(0).toUpperCase() + name.slice(1)];
      return normalizeValue(val);
    })
    .filter((option) => option.length > 0);
  
  if (foundOptions.length === 0) {
    console.log('parseRowOptions found 0 options from row:', row);
  }
  
  return foundOptions;
};

const resolveCorrectAnswer = (correctAnswer, options) => {
  const raw = normalizeValue(correctAnswer).toLowerCase();
  if (!raw) return '';

  const regex = /^(?:option\s*)?([abcd1234])$/i;
  const labelMatch = raw.match(regex);
  if (labelMatch) {
    const key = labelMatch[1].toLowerCase();
    const labelMap = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
    const idx = labelMap[key] ?? -1;
    const resolved = options[idx] || '';
    console.log('resolveCorrectAnswer label route', { raw, key, idx, resolved, options });
    return resolved;
  }

  const matchedOption = options.find((opt) => normalizeValue(opt).toLowerCase() === raw);
  console.log('resolveCorrectAnswer match route', { raw, matchedOption, options });
  return matchedOption || '';
};

const resolveInstruction = (row) => {
  return normalizeValue(
    row.instruction ||
    row.instructions ||
    row.prompt ||
    row.shared_instruction ||
    row['shared instruction'] ||
    row.sharedPrompt ||
    row.shared_prompt ||
    row.prompt_text ||
    row['prompt text'] ||
    row.instruction_text ||
    row['instruction text']
  );
};

const normalizeType = (type) => {
  const raw = normalizeValue(type).toLowerCase();
  if (raw === 'objective' || raw === 'theory') return raw;
  return '';
};

const isValidClassDepartment = (classLevel, department) => {
  const level = normalizeValue(classLevel).toUpperCase();
  const dept = normalizeDepartment(department);
  if (!ALLOWED_CLASS_LEVELS.includes(level) || !ALLOWED_DEPARTMENTS.includes(dept)) return false;
  if (level.startsWith('JSS')) return dept === 'General';
  if (level.startsWith('SS')) return ['Science', 'Art', 'Commercial'].includes(dept);
  return false;
};

const inferQuestionType = (row) => {
  const possibleType = normalizeType(row.type || row.question_type);
  if (possibleType) return possibleType;
  const options = parseRowOptions(row);
  const correctAnswer = normalizeValue(row.correctAnswer || row.correctanswer || row.correct_answer || row.answer);
  if (options.length >= 2 && correctAnswer.length > 0) return 'objective';
  return 'theory';
};

const makeQuestionKey = (questionText, subject, classLevel, department, type, options, correctAnswer) => {
  return [questionText, subject, classLevel, department, type, correctAnswer, ...(options || [])]
    .map(normalizeValue)
    .join('|');
};

const normalizeWhitespace = (value) =>
  String(value || '')
    .replace(/[\u00A0\u2000-\u200F\u2028\u2029]+/g, ' ')
    .trim();

const extractValueText = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return normalizeWhitespace(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return normalizeWhitespace(value.map((part) => extractValueText(part)).join(' '));
  }
  if (typeof value === 'object') {
    if (value.t) return normalizeWhitespace(String(value.t));
    if (value.v) return extractValueText(value.v);
    if (value.r) return extractValueText(value.r);
    return normalizeWhitespace(JSON.stringify(value));
  }
  return normalizeWhitespace(String(value));
};

const readRows = (buffer) => {
  const wb = XLSX.read(buffer, {
    type: 'buffer',
    cellHTML: true,
    cellText: true,
    cellStyles: true,
    cellFormula: true,
  });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  let rawWorksheetText = new Map();
  try {
    rawWorksheetText = extractRawWorksheetCellText(buffer, wb.SheetNames[0]);
  } catch (error) {
    console.warn('Raw worksheet fallback parsing failed:', error.message);
  }
  const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: true });
  const headerRow = allRows[0] || [];
  const dataRows = allRows.slice(1);

  const getCellText = (rowIndex, colIndex) => {
    const address = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
    const cell = sheet[address];
    if (cell) {
      if (cell.h) {
        const htmlText = extractValueText(cell.h);
        const strippedHtml = stripHtml(htmlText);
        if (strippedHtml) return normalizeMathText(strippedHtml);
      }
      if (cell.w) return normalizeMathText(extractValueText(cell.w));
      if (cell.r) return normalizeMathText(extractValueText(cell.r));
      if (cell.v !== undefined && cell.v !== null) return normalizeMathText(extractValueText(cell.v));
      if (cell.f) return normalizeMathText(extractValueText(cell.f));
      try {
        return normalizeMathText(extractValueText(XLSX.utils.format_cell(cell)));
      } catch (_) {
        // continue to raw worksheet fallback
      }
    }
    if (rawWorksheetText.has(address)) return rawWorksheetText.get(address);
    return '';
  };

  return dataRows.map((rowValues, rowIndex) => {
    const obj = {};
    headerRow.forEach((header, colIndex) => {
      let value = rowValues[colIndex];
      if (value === '' || value === null || value === undefined || typeof value === 'object') {
        value = getCellText(rowIndex, colIndex);
      }
      obj[String(header || '').trim()] = normalizeWhitespace(value);
    });
    return obj;
  });
};

exports.uploadQuestions = async (req, res) => {
  try {
    const csvFile = req.files?.file?.[0];
    if (!csvFile) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uploadedImages = Array.isArray(req.files?.images) ? req.files.images : [];
    const availableImages = new Map();
    uploadedImages.forEach((file) => {
      const fileName = path.basename(String(file.originalname || '').trim());
      if (fileName) availableImages.set(fileName.toLowerCase(), file);
    });

    const rows = readRows(csvFile.buffer);
    const docs = [];
    const failedRows = [];
    const seen = new Set();

    rows.forEach((row, index) => {
      const rowNum = index + 2;
      const normalizedRow = normalizeRow(row);
      if (index === 0) {
        console.log('Sample row headers:', Object.keys(normalizedRow));
        console.log('Sample row data:', normalizedRow);
      }
      if (index < 5) {
        console.log(`Row ${rowNum} raw data:`, row);
        console.log(`Row ${rowNum} normalized keys:`, Object.keys(normalizedRow));
      }
      const questionText = normalizeValue(normalizedRow.question || normalizedRow.questiontext || normalizedRow.text || normalizedRow.question_text || normalizedRow['question text']);
      if (index < 5) {
        console.log(`Row ${rowNum} questionText extracted:`, questionText, 'from raw row:', row);
      }
      if (!questionText) {
        console.log(`Row ${rowNum} missing question. Available headers:`, Object.keys(normalizedRow));
        console.log(`Row ${rowNum} values:`, row);
      }
      const subject = normalizeValue(normalizedRow.subject || normalizedRow.subject_name);
      const classLevel = normalizeValue(normalizedRow.classlevel || normalizedRow.class_level || normalizedRow.level).toUpperCase();
      let department = normalizeDepartment(normalizedRow.department || normalizedRow.dept || normalizedRow.department_name);
      const type = inferQuestionType(normalizedRow);
      const questionLabel = normalizeValue(normalizedRow.questionlabel || normalizedRow.question_label || normalizedRow.label);
      const rawImage = normalizeValue(normalizedRow.imageurl || normalizedRow.image_url || normalizedRow.questionimage || normalizedRow.image);
      const imageName = path.basename(rawImage || '');
      const explanation = normalizeValue(normalizedRow.explanation || normalizedRow.explanation_text);
      const instruction = resolveInstruction(normalizedRow);
      const options = parseRowOptions(normalizedRow);
      const rawCorrectAnswer = normalizeValue(normalizedRow.correctanswer || normalizedRow.correct_answer || normalizedRow.answer);
      const correctAnswer = resolveCorrectAnswer(rawCorrectAnswer, options);

      let imageUrl = '';
      if (rawImage) {
        if (/^\//.test(rawImage) || /^https?:\/\//i.test(rawImage)) {
          imageUrl = rawImage;
        } else if (imageName && availableImages.has(imageName.toLowerCase())) {
          imageUrl = imageName;
        } else {
          imageUrl = '';
        }
      }

      if (!department && classLevel.startsWith('JSS')) {
        department = 'General';
      }

      const errors = [];
      if (!questionText) errors.push('Missing question');
      if (!subject) errors.push('Missing subject');
      if (!classLevel) errors.push('Missing classLevel');
      if (!department) errors.push('Missing department');
      if (!type) errors.push('Missing or invalid type');
      if (type && !['objective', 'theory'].includes(type)) errors.push('type must be objective or theory');
      const staffSubjects = Array.isArray(req.user?.subjects) ? req.user.subjects.map(normalizeSubject) : [];
      if (staffSubjects.length > 0 && !staffSubjects.includes(normalizeSubject(subject))) {
        errors.push('Subject is not assigned to your account');
      }
      if (req.user?.classLevel && String(req.user.classLevel).toUpperCase() !== classLevel) {
        errors.push('classLevel does not match your account assignment');
      }
      if (req.user?.department && normalizeDepartment(req.user.department) !== department) {
        errors.push('department does not match your account assignment');
      }
      if (classLevel && department && !isValidClassDepartment(classLevel, department)) {
        errors.push('Invalid classLevel/department combination');
      }
      if (rawImage && imageUrl === '') {
        errors.push(`Image file '${rawImage}' not found in uploaded images`);
      }
      if (type === 'objective') {
        if (options.length < 2) errors.push('Objective questions require at least two options');
        if (!rawCorrectAnswer) errors.push('Objective questions require correctAnswer');
        if (rawCorrectAnswer && !correctAnswer) {
          console.log('unresolved correctAnswer', { rowNum, rawCorrectAnswer, options });
          errors.push('correctAnswer must match one of the options');
        }
      }
      if (type === 'theory') {
        if (options.length > 0) {
          // allow theory rows to contain options but ignore them
        }
      }
      if (errors.length) {
        failedRows.push({ row: rowNum, errors });
        return;
      }

      const doc = {
        subject,
        questionText,
        classLevel,
        department,
        type,
        instruction: type === 'theory' ? instruction : '',
        options: type === 'objective' ? options : [],
        correctAnswer: type === 'objective' ? correctAnswer : '',
        explanation,
        questionLabel,
        imageUrl,
        createdBy: req.user._id,
      };

      const key = makeQuestionKey(questionText, subject, classLevel, department, type, options, doc.correctAnswer);
      if (seen.has(key)) {
        failedRows.push({ row: rowNum, errors: ['Duplicate row in upload file'] });
        return;
      }
      seen.add(key);
      docs.push(doc);
    });

    const savedImages = new Map();
    for (const doc of docs) {
      if (doc.imageUrl && !/^\//.test(doc.imageUrl) && !/^https?:\/\//i.test(doc.imageUrl)) {
        const key = doc.imageUrl.toLowerCase();
        const file = availableImages.get(key);
        if (file) {
          if (!savedImages.has(key)) {
            savedImages.set(key, await saveQuestionImage(file));
          }
          doc.imageUrl = savedImages.get(key);
        }
      }
    }

    if (!docs.length && failedRows.length) {
      console.log('Upload validation errors:', failedRows.slice(0, 5));
      return res.status(400).json({
        status: 'failed',
        message: 'No valid rows found',
        successCount: 0,
        failedRows: failedRows.slice(0, 10),
      });
    }

    const existingQuestions = await Question.find({
      $or: docs.map((doc) => ({
        questionText: doc.questionText,
        subject: doc.subject,
        classLevel: doc.classLevel,
        department: doc.department,
        type: doc.type,
        questionLabel: doc.questionLabel,
      })),
    }).lean();

    const existingKeys = new Set(
      existingQuestions.map((q) =>
        makeQuestionKey(q.questionText, q.subject, q.classLevel, q.department, q.type, q.options || [], q.correctAnswer || '')
      )
    );

    const validDocs = [];
    let duplicateCount = 0;

    docs.forEach((doc) => {
      const key = makeQuestionKey(doc.questionText, doc.subject, doc.classLevel, doc.department, doc.type, doc.options, doc.correctAnswer);
      if (existingKeys.has(key)) {
        duplicateCount += 1;
      } else {
        validDocs.push(doc);
      }
    });

    const created = validDocs.length ? await Question.insertMany(validDocs) : [];

    res.json({
      status: 'success',
      message: 'Questions upload processed',
      totalRows: rows.length,
      successCount: created.length,
      duplicateCount,
      failedCount: failedRows.length,
      failedRows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

exports.uploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const rows = readRows(req.file.buffer);
    const ops = [];
    const failedRows = [];
    const processedAdmissionNumbers = [];

    await Promise.all(
      rows.map(async (row, index) => {
        const rowNum = index + 2;
        const normalizedRow = normalizeRow(row);
        const firstname = normalizeValue(normalizedRow.firstname);
        const lastname = normalizeValue(normalizedRow.lastname);
        const name = `${firstname} ${lastname}`.trim();
        const email = normalizeValue(normalizedRow.email);
        const admissionNumber = normalizeValue(
          normalizedRow.admissionnumber ||
          normalizedRow.admission_number ||
          normalizedRow.regno ||
          normalizedRow.registrationnumber
        );
        const password = normalizeValue(normalizedRow.password) || 'ChangeMe123!';
        const classLevel = normalizeValue(normalizedRow.class).toUpperCase();
        let department = normalizeDepartment(normalizedRow.department || normalizedRow.dept);
        const isActive = String(normalizedRow.isactive || '').toLowerCase();
        const active = isActive === 'false' || isActive === '0' ? false : true;

        if (!department && classLevel.startsWith('JSS')) {
          department = 'General';
        }

        const errors = [];
        if (!firstname || !lastname) errors.push('Missing firstname or lastname');
        if (!admissionNumber) errors.push('Missing admissionNumber');
        if (!classLevel) errors.push('Missing class');
        if (!department) errors.push('Missing department');
        if (!isValidClassDepartment(classLevel, department)) {
          errors.push('Invalid class/department combination');
        }
        if (errors.length) {
          failedRows.push({ row: rowNum, errors });
          return;
        }

        const hashedPassword = await bcrypt.hash(String(password), 10);

        ops.push({
          updateOne: {
            filter: { admissionNumber },
            update: {
              $setOnInsert: {
                name,
                email,
                password: hashedPassword,
                role: 'Student',
                isActive: active,
              },
              $set: {
                classLevel,
                department,
                admissionNumber,
                ...(email ? { email } : {}),
              },
            },
            upsert: true,
          },
        });

        processedAdmissionNumbers.push(admissionNumber);
      })
    );

    const result = ops.length ? await Student.bulkWrite(ops) : { upsertedCount: 0, modifiedCount: 0 };

    const isSameObjectId = (idA, idB) => String(idA) === String(idB);

    // Assign students to groups based on classLevel
    if (processedAdmissionNumbers.length > 0) {
      const students = await Student.find({ admissionNumber: { $in: processedAdmissionNumbers } });
      for (const student of students) {
        let group = await Group.findOne({ name: student.classLevel });
        if (!group) {
          group = new Group({
            name: student.classLevel,
            description: `Students in ${student.classLevel}`,
            createdBy: req.user._id,
          });
          await group.save();
        }

        if (!Array.isArray(group.members) || !group.members.some((memberId) => isSameObjectId(memberId, student._id))) {
          group.members = Array.isArray(group.members) ? group.members : [];
          group.members.push(student._id);
          await group.save();
        }

        if (!Array.isArray(student.groups) || !student.groups.some((groupId) => isSameObjectId(groupId, group._id))) {
          student.groups = Array.isArray(student.groups) ? student.groups : [];
          student.groups.push(group._id);
          await student.save();
        }
      }
    }

    res.json({
      status: 'success',
      message: 'Student upload processed',
      successCount: rows.length - failedRows.length,
      failedCount: failedRows.length,
      failedRows,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
