const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const miningRoutes = require('./routes/mining');
const userRoutes = require('./routes/users');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: 'https://cosmofy-frontend-00d9ca88cc7d.herokuapp.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// CORS pre-flight OPTIONS işlemlerini ele almak için özel ara katman
app.options('*', (req, res) => {
  console.log('OPTIONS request received in server.js');
  res.header('Access-Control-Allow-Origin', 'https://cosmofy-frontend-00d9ca88cc7d.herokuapp.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

app.use(express.json());
app.use(morgan('dev'));

// Set port
const PORT = process.env.PORT || 3000;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Telegram Mining Mini App API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 