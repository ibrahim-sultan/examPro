
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/userModel');
const Student = require('../models/studentModel');
const generateToken = require('../utils/generateToken');

const passportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/passports');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `passport-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};
const passportUpload = multer({ storage: passportStorage, fileFilter: imageFileFilter });

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user._id);
  let role = user?.role;
  if (!user) {
    user = await Student.findById(req.user._id);
    role = 'Student';
  }

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: role || user.role,
      subjects: user.subjects || [],
      classLevel: user.classLevel || undefined,
      department: user.department || undefined,
      admissionNumber: user.admissionNumber || undefined,
      passportPhoto: user.passportPhoto || '',
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user._id);
  let role = user?.role;
  if (!user) {
    user = await Student.findById(req.user._id);
    role = 'Student';
  }

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: role || updatedUser.role,
      subjects: updatedUser.subjects || [],
      classLevel: updatedUser.classLevel || undefined,
      department: updatedUser.department || undefined,
      admissionNumber: updatedUser.admissionNumber || undefined,
      passportPhoto: updatedUser.passportPhoto || '',
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users (admins + students)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  const students = await Student.find({}).select('-password');

  const combined = [
    ...users.map((u) => ({ ...u.toObject(), accountType: 'User' })),
    ...students.map((s) => ({ ...s.toObject(), accountType: 'Student' })),
  ];

  res.json(combined);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  // Try User model first
  let user = await User.findById(req.params.id).select('-password');
  if (!user) {
    // If not found, try Student model
    user = await Student.findById(req.params.id).select('-password');
  }

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  // Try User model first
  let user = await User.findById(req.params.id);
  let Model = User;
  if (!user) {
    // If not found, try Student model
    user = await Student.findById(req.params.id);
    Model = Student;
  }

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (Array.isArray(req.body.subjects)) {
      user.subjects = req.body.subjects;
    }
    if (req.body.classLevel !== undefined) {
      user.classLevel = req.body.classLevel || undefined;
    }
    if (req.body.department !== undefined) {
      user.department = req.body.department || undefined;
    }
    if (Model === User) {
      user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin || false,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  // Try to find in User model first
  let account = await User.findById(req.params.id);
  let accountType = 'User';

  if (!account) {
    // If not found in User, try Student model
    account = await Student.findById(req.params.id);
    accountType = 'Student';
  }

  if (!account) {
    res.status(404);
    throw new Error('Account not found');
  }

  // Prevent self-deletion
  if (account._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Admin cannot delete themselves');
  }

  await account.deleteOne();
  res.json({ message: `${accountType} removed` });
});

// @desc    Get my subjects
// @route   GET /api/users/subjects
// @access  Private
const getMySubjects = asyncHandler(async (req, res) => {
  // Try Student model first if role is Student, else User
  let Model = User;
  if (req.user.role === 'Student') {
    Model = Student;
  }

  let doc = await Model.findById(req.user._id).select('subjects');
  if (!doc && req.user.role === 'Student') {
    // Fallback: if not found in Student, try User (for legacy students created as users)
    doc = await User.findById(req.user._id).select('subjects');
  }

  res.json(doc?.subjects || []);
});

// @desc    Update my subjects
// @route   PUT /api/users/subjects
// @access  Private
const updateMySubjects = asyncHandler(async (req, res) => {
  const { subjects } = req.body;
  if (!Array.isArray(subjects)) {
    res.status(400);
    throw new Error('subjects must be an array of strings');
  }

  // Try Student model first if role is Student, else User
  let Model = User;
  if (req.user.role === 'Student') {
    Model = Student;
  }

  let doc = await Model.findById(req.user._id);
  if (!doc && req.user.role === 'Student') {
    // Fallback: if not found in Student, try User
    Model = User;
    doc = await User.findById(req.user._id);
  }

  if (!doc) {
    res.status(404);
    throw new Error('User not found');
  }

  doc.subjects = subjects;
  await doc.save();
  res.json(doc.subjects);
});

const uploadPassportPhoto = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  let account = await Student.findById(targetId);
  if (!account) {
    account = await User.findById(targetId);
  }
  if (!account) {
    res.status(404);
    throw new Error('User not found');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('Passport image file is required');
  }
  const relativePath = `/uploads/passports/${req.file.filename}`;
  account.passportPhoto = relativePath;
  await account.save();
  res.json({ passportPhoto: relativePath });
});

// @desc    Bulk delete users
// @route   POST /api/users/bulk-delete
// @access  Private/Admin
const bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    res.status(400);
    throw new Error('userIds must be a non-empty array');
  }

  // Prevent admin from deleting themselves
  if (userIds.includes(req.user._id.toString())) {
    res.status(400);
    throw new Error('Admin cannot delete themselves');
  }

  // Delete from both User and Student models
  const userDeleteResult = await User.deleteMany({ _id: { $in: userIds } });
  const studentDeleteResult = await Student.deleteMany({ _id: { $in: userIds } });

  const totalDeleted = userDeleteResult.deletedCount + studentDeleteResult.deletedCount;

  res.json({
    message: `${totalDeleted} user(s) deleted successfully`,
    deletedCount: totalDeleted,
  });
});

module.exports = {
  registerUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  getMySubjects,
  updateMySubjects,
  uploadPassportPhoto,
  bulkDeleteUsers,
  passportUpload,
};
