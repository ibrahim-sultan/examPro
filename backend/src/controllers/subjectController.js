const Subject = require('../models/subjectModel');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Subject name is required' });
    }

    const normalizedName = name.trim().toLowerCase();

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ name: normalizedName });
    if (existingSubject) {
      return res.json(existingSubject);
    }

    const subject = await Subject.create({
      name: normalizedName,
      displayName: name.trim(),
      createdBy: req.user._id,
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    await subject.deleteOne();

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  deleteSubject,
};
