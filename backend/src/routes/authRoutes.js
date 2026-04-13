
const express = require('express');
const router = express.Router();
const { registerUser, authUser } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);

// Example of a protected route
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});


module.exports = router;
