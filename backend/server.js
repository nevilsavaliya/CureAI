require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const kotakConfig = require('./config/kotakConfig');

const app = express();

// Connect to MongoDB
connectDB();

// Validate Kotak API Configuration
try {
  kotakConfig.validate();
  console.log('✓ Kotak API configuration validated successfully');
  console.log('Kotak Config:', kotakConfig.getSanitizedConfig());
} catch (error) {
  console.warn('⚠ Kotak API Configuration Warning:');
  console.warn(error.message);
  console.warn('\nKotak UPI payment integration will be disabled.');
  console.warn('The application will continue to run with other payment methods.\n');
}

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
const kotakPaymentRoutes = require('./routes/kotakPaymentRoutes');
const paymentMetricsRoutes = require('./routes/paymentMetricsRoutes');

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
app.use('/api', kotakPaymentRoutes);
app.use('/api/payment-metrics', paymentMetricsRoutes);

// Error handling middleware will be added here

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
