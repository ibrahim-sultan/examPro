
const Group = require('../models/groupModel');
const User = require('../models/userModel');
const Exam = require('../models/examModel');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private/Admin
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    const groupExists = await Group.findOne({ name });
    if (groupExists) {
      return res
        .status(400)
        .json({ message: 'Group with this name already exists' });
    }

    const group = new Group({
      name,
      description,
      createdBy: req.user._id,
    });

    const createdGroup = await group.save();
    res.status(201).json(createdGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private/Admin
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({})
      .populate('createdBy', 'name')
      .populate('members', 'name email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private/Admin
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      'members',
      'name email'
    );
    if (group) {
      res.json(group);
    } else {
      res.status(404).json({ message: 'Group not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a group
// @route   PUT /api/groups/:id
// @access  Private/Admin
const updateGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findById(req.params.id);

    if (group) {
      group.name = name || group.name;
      group.description = description || group.description;

      const updatedGroup = await group.save();
      res.json(updatedGroup);
    } else {
      res.status(404).json({ message: 'Group not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private/Admin
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (group) {
      // Optional: Clean up references before deleting
      // Remove group from any users that are members
      await User.updateMany(
        { _id: { $in: group.members } },
        { $pull: { groups: group._id } }
      );
      // Remove group from any exams it was assigned to
      await Exam.updateMany(
        { assignedGroups: group._id },
        { $pull: { assignedGroups: group._id } }
      );

      await group.deleteOne();
      res.json({ message: 'Group removed' });
    } else {
      res.status(404).json({ message: 'Group not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a member to a group
// @route   POST /api/groups/:id/members
// @access  Private/Admin
const addMemberToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    const user = await User.findById(userId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'Student') {
      return res
        .status(400)
        .json({ message: 'Only students can be added to groups.' });
    }

    // Add user to group's members if not already there
    if (group.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: 'User is already in this group' });
    }
    group.members.push(userId);
    await group.save();

    // Add group to user's groups if not already there
    if (!user.groups.includes(group._id)) {
      user.groups.push(group._id);
      await user.save();
    }

    // Populate member details for the response
    const updatedGroup = await Group.findById(req.params.id).populate(
      'members',
      'name email'
    );

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Remove a member from a group
// @route   DELETE /api/groups/:groupId/members/:userId
// @access  Private/Admin
const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const group = await Group.findById(groupId);
    const user = await User.findById(userId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove user from group's members
    await Group.updateOne({ _id: groupId }, { $pull: { members: userId } });

    // Remove group from user's groups
    await User.updateOne({ _id: userId }, { $pull: { groups: groupId } });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
};
