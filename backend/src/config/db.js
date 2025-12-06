
const mongoose = require('mongoose');

// Robust connection that does not crash the process on failure.
// This keeps the web service alive so Render's health checks don't 502,
// while still retrying DB connection in the background.
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set. The API will run but DB operations will fail.');
    return;
  }

  const maxAttempts = 5;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      attempt += 1;
      const delayMs = Math.min(30000, 2000 * attempt);
      console.error(`Mongo connection attempt ${attempt} failed: ${error.message}. Retrying in ${Math.round(delayMs/1000)}s...`);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  console.error('Failed to connect to MongoDB after multiple attempts. Continuing without DB.');
};

module.exports = connectDB;
