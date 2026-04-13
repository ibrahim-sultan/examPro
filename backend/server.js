
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const questionRoutes = require('./src/routes/questionRoutes');
const examRoutes = require('./src/routes/examRoutes');
const resultRoutes = require('./src/routes/resultRoutes');
const userRoutes = require('./src/routes/userRoutes');
const groupRoutes = require('./src/routes/groupRoutes'); // Import group routes

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS (allow frontend to call the API when hosted on a different origin)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
app.use(
  cors({
    origin: FRONTEND_ORIGIN ? [FRONTEND_ORIGIN] : '*',
    credentials: false,
  })
);

// Body parser
app.use(express.json());

// Health check for Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple root route (useful in development)
app.get('/', (req, res) => {
  res.send('API is running');
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Use user routes
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes); // Use result routes
app.use('/api/groups', groupRoutes); // Use group routes
app.use('/api/monitor', require('./src/routes/monitorRoutes')); // Anti-cheat & monitoring
app.use('/api/bulk', require('./src/routes/bulkRoutes')); // Bulk uploads

// Serve frontend build in production from ../frontend/build
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'frontend', 'build');
  app.use(express.static(buildPath));

  // For any non-API route, serve index.html (SPA)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);
