const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: logFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }),

  // General application logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
    level: 'info'
  }),

  // Error logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    level: 'error'
  }),

  // Hospital-specific logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'hospital-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    level: 'info'
  }),

  // API access logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'api-access-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    level: 'info'
  }),

  // Security logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '90d',
    format: fileFormat,
    level: 'warn'
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: logLevels,
  format: fileFormat,
  transports,
  exitOnError: false
});

// Hospital-specific logging methods
logger.hospital = {
  registration: (data) => {
    logger.info('Hospital registration attempt', {
      type: 'HOSPITAL_REGISTRATION',
      hospitalName: data.hospitalName,
      email: data.email,
      registrationNumber: data.registrationNumber,
      timestamp: new Date().toISOString(),
      ip: data.ip,
      userAgent: data.userAgent
    });
  },

  verification: (data) => {
    logger.info('Hospital verification action', {
      type: 'HOSPITAL_VERIFICATION',
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
      action: data.action, // 'verified' | 'rejected' | 'revoked'
      adminId: data.adminId,
      adminEmail: data.adminEmail,
      reason: data.reason,
      timestamp: new Date().toISOString(),
      ip: data.ip
    });
  },

  login: (data) => {
    logger.info('Hospital login attempt', {
      type: 'HOSPITAL_LOGIN',
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
      email: data.email,
      success: data.success,
      reason: data.reason,
      timestamp: new Date().toISOString(),
      ip: data.ip,
      userAgent: data.userAgent
    });
  },

  apiAccess: (data) => {
    logger.info('Hospital API access', {
      type: 'HOSPITAL_API_ACCESS',
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
      patientId: data.patientId,
      patientEmail: data.patientEmail,
      endpoint: data.endpoint,
      method: data.method,
      success: data.success,
      responseTime: data.responseTime,
      timestamp: new Date().toISOString(),
      ip: data.ip,
      userAgent: data.userAgent
    });
  },

  apiError: (data) => {
    logger.error('Hospital API error', {
      type: 'HOSPITAL_API_ERROR',
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
      endpoint: data.endpoint,
      method: data.method,
      error: data.error,
      statusCode: data.statusCode,
      timestamp: new Date().toISOString(),
      ip: data.ip,
      userAgent: data.userAgent
    });
  },

  credentialsGenerated: (data) => {
    logger.info('Hospital API credentials generated', {
      type: 'HOSPITAL_CREDENTIALS_GENERATED',
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
      apiKey: data.apiKey.substring(0, 10) + '...', // Log only first 10 chars for security
      adminId: data.adminId,
      timestamp: new Date().toISOString()
    });
  }
};

// Security logging methods
logger.security = {
  invalidApiCredentials: (data) => {
    logger.warn('Invalid API credentials attempt', {
      type: 'SECURITY_INVALID_API_CREDENTIALS',
      apiKey: data.apiKey ? data.apiKey.substring(0, 10) + '...' : 'missing',
      endpoint: data.endpoint,
      timestamp: new Date().toISOString(),
      ip: data.ip,
      userAgent: data.userAgent
    });
  },

  rateLimitExceeded: (data) => {
    logger.warn('Rate limit exceeded', {
      type: 'SECURITY_RATE_LIMIT_EXCEEDED',
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
      endpoint: data.endpoint,
      requestCount: data.requestCount,
      limit: data.limit,
      timestamp: new Date().toISOString(),
      ip: data.ip
    });
  },

  suspiciousActivity: (data) => {
    logger.warn('Suspicious activity detected', {
      type: 'SECURITY_SUSPICIOUS_ACTIVITY',
      activity: data.activity,
      details: data.details,
      hospitalId: data.hospitalId,
      timestamp: new Date().toISOString(),
      ip: data.ip,
      userAgent: data.userAgent
    });
  },

  unauthorizedAccess: (data) => {
    logger.warn('Unauthorized access attempt', {
      type: 'SECURITY_UNAUTHORIZED_ACCESS',
      endpoint: data.endpoint,
      method: data.method,
      reason: data.reason,
      hospitalId: data.hospitalId,
      timestamp: new Date().toISOString(),
      ip: data.ip,
      userAgent: data.userAgent
    });
  }
};

// API access logging methods
logger.api = {
  request: (data) => {
    logger.http('API request', {
      type: 'API_REQUEST',
      method: data.method,
      url: data.url,
      hospitalId: data.hospitalId,
      timestamp: new Date().toISOString(),
      ip: data.ip,
      userAgent: data.userAgent
    });
  },

  response: (data) => {
    logger.http('API response', {
      type: 'API_RESPONSE',
      method: data.method,
      url: data.url,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      hospitalId: data.hospitalId,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logging
logger.performance = {
  slowQuery: (data) => {
    logger.warn('Slow database query detected', {
      type: 'PERFORMANCE_SLOW_QUERY',
      query: data.query,
      executionTime: data.executionTime,
      collection: data.collection,
      timestamp: new Date().toISOString()
    });
  },

  slowApi: (data) => {
    logger.warn('Slow API response detected', {
      type: 'PERFORMANCE_SLOW_API',
      endpoint: data.endpoint,
      method: data.method,
      responseTime: data.responseTime,
      hospitalId: data.hospitalId,
      timestamp: new Date().toISOString()
    });
  }
};

// Helper method to get client IP
logger.getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
};

// Helper method to get user agent
logger.getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

module.exports = logger;