
const express = require('express');
const router = express.Router();
const {
  registerUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/').post(registerUser).get(protect, admin, getUsers);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;
