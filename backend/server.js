require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/database');
const socketService = require('./services/socketService');
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
socketService.initialize(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const symptomRoutes = require('./routes/symptomRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const adminRoutes = require('./routes/adminRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const testPaymentRoutes = require('./routes/testPaymentRoutes');
const caseRoutes = require('./routes/caseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Healthcare Platform API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', symptomRoutes);
app.use('/api', doctorRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', messageRoutes);
app.use('/api', consultationRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', adminRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/test-payment', testPaymentRoutes);
app.use('/api', caseRoutes);
app.use('/api', notificationRoutes);

// Error handling middleware will be added here

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server is ready`);
});

module.exports = { app, server };
