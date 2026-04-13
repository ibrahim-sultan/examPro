
const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
} = require('../controllers/groupController');
const { protect, admin } = require('../middlewares/authMiddleware');

// All routes in this file are protected and admin-only
router.use(protect, admin);

router.route('/').get(getGroups).post(createGroup);
router
  .route('/:id')
  .get(getGroupById)
  .put(updateGroup)
  .delete(deleteGroup);

router.route('/:id/members').post(addMemberToGroup);
router.route('/:groupId/members/:userId').delete(removeMemberFromGroup);

module.exports = router;
