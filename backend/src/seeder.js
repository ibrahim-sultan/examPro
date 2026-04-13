const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const connectDB = require('./config/db');

dotenv.config();

// Connect to MongoDB
connectDB();

const seedAdmin = async () => {
  try {
    // First, check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@exampro.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@exampro.com',
      password: 'admin123',
      role: 'Super Admin',
      isActive: true
    });

    console.log('Admin user created successfully:');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: admin123`);
    console.log('You can now log in with these credentials');

    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

// Run the seeder
seedAdmin();