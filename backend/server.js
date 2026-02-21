require('dotenv').config();

// Validate configuration using ConfigService before starting
const { validateAndExit } = require('./core/config/startupValidation');
validateAndExit();

const express = require('express');
const cors = require('cors');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/database');
const socketService = require('./services/socketService');
const logger = require('./services/logger');
const sslConfig = require('./config/ssl');
const configService = require('./core/config/ConfigService');
const { securityHeaders, httpsRedirect } = require('./middleware/securityHeaders');
const { requestLogger, errorLogger, hospitalLogger } = require('./middleware/logging');
const { globalErrorTracking, hospitalErrorTracking } = require('./middleware/errorTracking');
const { 
  trackCriticalErrors, 
  trackAuthFailures, 
  trackSlowResponses,
  addAlertTracking,
  globalErrorHandler
} = require('./middleware/alertMiddleware');
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create HTTPS server if SSL is enabled
const httpsServer = sslConfig.createHTTPSServer(app);

// Connect to MongoDB
connectDB();

// Initialize cache system
const { initializeCache, shutdownCache } = require('./core/utils/initializeCache');
initializeCache({
  enableMonitoring: configService.isProduction(),
  monitoringInterval: 15, // Check every 15 minutes
  warmCache: true
});

// Initialize subscription scheduler
const { initializeScheduler } = require('./services/subscriptionScheduler');
initializeScheduler();

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  shutdownCache();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  shutdownCache();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Initialize Socket.IO on both HTTP and HTTPS servers
socketService.initialize(server);
if (httpsServer) {
  socketService.initialize(httpsServer);
}

// Initialize scheduled jobs for data cleanup and maintenance
const scheduledJobService = require('./services/scheduledJobService');
setTimeout(() => {
  try {
    scheduledJobService.initialize();
    logger.info('Scheduled jobs initialized successfully', {
      type: 'SCHEDULED_JOBS_INIT',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to initialize scheduled jobs', {
      type: 'SCHEDULED_JOBS_ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}, 5000); // Wait 5 seconds after server start to initialize jobs

// SSL and security middleware
if (sslConfig.sslEnabled) {
  app.use(httpsRedirect);
}
app.use(securityHeaders);

// Middleware
const corsOrigins = configService.getCorsOrigins();
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware (before other middleware)
app.use(requestLogger);
app.use(hospitalLogger);
app.use(hospitalErrorTracking);

// Response compression middleware (should be early in the stack)
const { createCompressionMiddleware } = require('./middleware/compressionMiddleware');
app.use(createCompressionMiddleware());

// Performance tracking middleware
const { performanceTracker } = require('./middleware/performanceTracker');
app.use(performanceTracker);

// Encryption middleware
const { ensureEncryption, addEncryptionHeaders } = require('./middleware/encryptionMiddleware');
app.use(ensureEncryption);
app.use(addEncryptionHeaders);

// Alert middleware
app.use(trackCriticalErrors);
app.use(trackAuthFailures);
app.use(trackSlowResponses);
app.use(addAlertTracking);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

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
const caseRoutes = require('./routes/caseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalAdminRoutes = require('./routes/hospitalAdminRoutes');
const logRoutes = require('./routes/logRoutes');
const errorTrackingRoutes = require('./routes/errorTrackingRoutes');
const apiMonitoringRoutes = require('./routes/apiMonitoringRoutes');
const alertRoutes = require('./routes/alertRoutes');
const adminUserManagementRoutes = require('./routes/adminUserManagementRoutes');
const adminSecurityRoutes = require('./routes/adminSecurityRoutes');
const testPaymentRoutes = require('./routes/testPaymentRoutes');
const healthRoutes = require('./routes/healthRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const doctorPaymentRoutes = require('./routes/doctorPayment');

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Healthcare Platform API Documentation',
  customfavIcon: '/favicon.ico'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check routes (should be first for load balancers)
app.use('/api/health', healthRoutes);

// Mount specific routes first (more specific paths should come before general ones)
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/test-payment', testPaymentRoutes); // Test payment endpoints for development
app.use('/api/doctor', doctorPaymentRoutes); // Doctor payment and profile routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/admin', hospitalAdminRoutes);
app.use('/api/admin/logs', logRoutes);
app.use('/api/admin/errors', errorTrackingRoutes);
app.use('/api/admin/monitoring', apiMonitoringRoutes);
app.use('/api/admin/alerts', alertRoutes);
app.use('/api/admin/security', adminSecurityRoutes);
app.use('/api/admin', performanceRoutes);
app.use('/api/admin', adminUserManagementRoutes);

// Mount general /api routes last
app.use('/api', profileRoutes);
app.use('/api', symptomRoutes);
app.use('/api', doctorRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', messageRoutes);
app.use('/api', consultationRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', adminRoutes);
app.use('/api', caseRoutes);
app.use('/api', notificationRoutes);

// Error handling middleware
app.use(errorLogger);
app.use(globalErrorTracking);

// Global error handler with alert integration
app.use(globalErrorHandler);

const PORT = configService.getPort();
const SSL_PORT = configService.getSslConfig().port;

// Start HTTP server
server.listen(PORT, () => {
  logger.info(`HTTP Server started on port ${PORT}`, {
    type: 'SERVER_START',
    port: PORT,
    protocol: 'HTTP',
    environment: configService.getNodeEnv(),
    timestamp: new Date().toISOString()
  });
});

// Start HTTPS server if SSL is enabled
if (httpsServer) {
  httpsServer.listen(SSL_PORT, () => {
    logger.info(`HTTPS Server started on port ${SSL_PORT}`, {
      type: 'SERVER_START',
      port: SSL_PORT,
      protocol: 'HTTPS',
      environment: configService.getNodeEnv(),
      timestamp: new Date().toISOString()
    });
    
    // Validate SSL certificate
    const certValidation = sslConfig.validateCertificate();
    if (certValidation.valid) {
      logger.info('SSL certificate is valid', {
        type: 'SSL_CERT_VALID',
        expiryDate: certValidation.expiryDate,
        daysUntilExpiry: certValidation.daysUntilExpiry
      });
    } else {
      logger.warn('SSL certificate validation failed', {
        type: 'SSL_CERT_INVALID',
        reason: certValidation.reason
      });
    }
  });
  
  httpsServer.on('error', (error) => {
    logger.error('HTTPS server error', {
      type: 'SSL_SERVER_ERROR',
      error: error.message,
      port: SSL_PORT
    });
  });
}

logger.info('Socket.IO server initialized', {
  type: 'SOCKET_INIT',
  timestamp: new Date().toISOString()
});

module.exports = { app, server, httpsServer };
