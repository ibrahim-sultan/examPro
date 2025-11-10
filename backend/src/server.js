
// ... existing code
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const examRoutes = require('./routes/examRoutes');
const resultRoutes = require('./routes/resultRoutes');
const groupRoutes = require('./routes/groupRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(express.json()); // to accept json data in the body

app.get('/', (req, res) => {
  res.send('API is running...');
});

// ... existing code
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middlewares
app.use(notFound);
// ... existing code

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
