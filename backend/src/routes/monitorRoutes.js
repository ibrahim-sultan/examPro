const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const { recordEvent, getOngoing, forceSubmit, suspend } = require('../controllers/monitorController');

// Student telemetry
router.post('/events', protect, recordEvent);

// Admin monitoring
router.get('/ongoing', protect, admin, getOngoing);
router.post('/force-submit/:resultId', protect, admin, forceSubmit);
router.post('/suspend/:resultId', protect, admin, suspend);

module.exports = router;
