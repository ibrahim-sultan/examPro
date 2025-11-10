
const User = require('../models/userModel');
const Exam = require('../models/examModel');
const Question = require('../models/questionModel');
const Group = require('../models/groupModel');
const Result = require('../models/resultModel');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalExams = await Exam.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalGroups = await Group.countDocuments();

    // Get 5 most recent exam submissions
    const recentResults = await Result.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'name email')
      .populate('exam', 'title');

    res.json({
      totalStudents,
      totalExams,
      totalQuestions,
      totalGroups,
      recentResults,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
