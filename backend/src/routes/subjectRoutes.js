const express = require('express');
const router = express.Router();
const { getSubjects, createSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', getSubjects);
router.post('/', protect, admin, createSubject);
router.delete('/:id', protect, admin, deleteSubject);

module.exports = router;
