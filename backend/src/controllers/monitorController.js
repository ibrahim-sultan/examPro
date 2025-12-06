const Result = require('../models/resultModel');

// @desc Record anti-cheat event
// @route POST /api/monitor/events
// @access Private/Student
exports.recordEvent = async (req, res) => {
  try {
    const { resultId, type } = req.body; // 'visibilitychange' | 'blur' | 'focus' | 'copy' | 'paste' | 'cut'
    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    if (result.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    switch (type) {
      case 'visibilitychange':
        result.tabSwitchCount += 1; break;
      case 'blur':
        result.blurCount += 1; break;
      case 'focus':
        result.focusCount += 1; break;
      case 'copy':
      case 'paste':
      case 'cut':
        result.copyPasteAttempts += 1; break;
      default: break;
    }
    result.lastActivityAt = new Date();
    await result.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc Ongoing exams (monitoring)
// @route GET /api/monitor/ongoing?examId=
// @access Private/Admin
exports.getOngoing = async (req, res) => {
  try {
    const { examId } = req.query;
    const filter = { status: 'In Progress' };
    if (examId) filter.exam = examId;
    const results = await Result.find(filter)
      .populate('user', 'name email')
      .populate('exam', 'title');
    res.json(results);
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc Force submit an exam
// @route POST /api/monitor/force-submit/:resultId
// @access Private/Admin
exports.forceSubmit = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    result.status = 'Completed';
    result.forcedSubmit = true;
    result.endTime = new Date();
    result.submittedAt = new Date();
    await result.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc Suspend an exam
// @route POST /api/monitor/suspend/:resultId
// @access Private/Admin
exports.suspend = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    result.status = 'Suspended';
    await result.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};
