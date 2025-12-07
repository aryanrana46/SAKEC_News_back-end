// Main server file that integrates everything and starts the application.

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const newsRoutes = require('./routes/newsRoutes');
const userRoutes = require('./routes/userRoutes'); // Import userRoutes
const cookieParser = require('cookie-parser'); // Import cookie-parser

dotenv.config();
const app = express();

console.log('The FRONTEND_URL is:', process.env.FRONTEND_URL);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/users', userRoutes); // Mount userRoutes

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// 404 handling for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
