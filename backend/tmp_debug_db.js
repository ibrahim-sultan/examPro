const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Group = require('./src/models/groupModel');
const Student = require('./src/models/studentModel');

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const groups = await Group.find({}).lean();
    console.log('groups', groups.map(g => ({ name: g.name, members: g.members.length })));
    const students = await Student.find({}).limit(20).lean();
    console.log('students sample', students.map((s) => ({
      name: s.name,
      email: s.email,
      admissionNumber: s.admissionNumber,
      classLevel: s.classLevel,
      department: s.department,
      groups: (s.groups || []).length,
    })));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
