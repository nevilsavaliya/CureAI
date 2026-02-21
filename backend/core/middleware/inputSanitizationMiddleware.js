/**
 * Enhanced Input Sanitization Middleware
 * Prevents XSS, SQL injection, and other injection attacks
 * Validates and sanitizes all user inputs
 */

const logger = require('../../services/logger');

/**
 * Sanitize string to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  return str
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    // Remove embed tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (except for images)
    .replace(/data:(?!image\/)/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove link tags
    .replace(/<link\b[^<]*>/gi, '');
}

/**
 * Sanitize object recursively
 * @param {*} obj - Object to sanitize
 * @param {number} depth - Current recursion depth
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj, depth = 0, maxDepth = 10) {
  // Prevent deep recursion
  if (depth > maxDepth) {
    logger.warn('Maximum sanitization depth reached', {
      type: 'SANITIZATION_DEPTH_EXCEEDED',
      depth
    });
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1, maxDepth));
  } else if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        logger.security.prototypePollutionAttempt({
          type: 'PROTOTYPE_POLLUTION_ATTEMPT',
          key,
          timestamp: new Date().toISOString()
        });
        continue;
      }
      sanitized[key] = sanitizeObject(obj[key], depth + 1, maxDepth);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Validate SQL injection patterns
 * @param {string} str - String to validate
 * @returns {boolean} True if SQL injection pattern detected
 */
function detectSQLInjection(str) {
  if (typeof str !== 'string') {
    return false;
  }
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /(OR\s+1\s*=\s*1)/gi,
    /(AND\s+1\s*=\s*1)/gi,
    /('|\"|;|--|\*|\/\*|\*\/)/g,
    /(xp_cmdshell|sp_executesql)/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(str));
}

/**
 * Validate NoSQL injection patterns
 * @param {*} value - Value to validate
 * @returns {boolean} True if NoSQL injection pattern detected
 */
function detectNoSQLInjection(value) {
  if (typeof value === 'object' && value !== null) {
    const dangerousKeys = ['$where', '$regex', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin'];
    
    for (const key in value) {
      if (dangerousKeys.includes(key)) {
        return true;
      }
      if (detectNoSQLInjection(value[key])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Sanitize input middleware
 * Sanitizes all user inputs to prevent XSS attacks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function sanitizeInput(req, res, next) {
  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Input sanitization error', {
      type: 'SANITIZATION_ERROR',
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl
    });
    
    // Continue on error (fail open)
    next();
  }
}

/**
 * Validate against SQL injection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function preventSQLInjection(req, res, next) {
  try {
    const checkValue = (value, path = '') => {
      if (typeof value === 'string' && detectSQLInjection(value)) {
        logger.security.sqlInjectionAttempt({
          type: 'SQL_INJECTION_ATTEMPT',
          value,
          path,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
        
        return true;
      } else if (Array.isArray(value)) {
        return value.some((item, index) => checkValue(item, `${path}[${index}]`));
      } else if (value !== null && typeof value === 'object') {
        return Object.entries(value).some(([key, val]) => 
          checkValue(val, path ? `${path}.${key}` : key)
        );
      }
      return false;
    };
    
    if (checkValue(req.body, 'body') || 
        checkValue(req.query, 'query') || 
        checkValue(req.params, 'params')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input detected',
        error: {
          code: 'INVALID_INPUT',
          message: 'Request contains potentially malicious content'
        }
      });
    }
    
    next();
  } catch (error) {
    logger.error('SQL injection validation error', {
      type: 'SQL_INJECTION_VALIDATION_ERROR',
      error: error.message,
      endpoint: req.originalUrl
    });
    
    // Continue on error (fail open)
    next();
  }
}

/**
 * Validate against NoSQL injection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function preventNoSQLInjection(req, res, next) {
  try {
    if (detectNoSQLInjection(req.body) || 
        detectNoSQLInjection(req.query) || 
        detectNoSQLInjection(req.params)) {
      
      logger.security.nosqlInjectionAttempt({
        type: 'NOSQL_INJECTION_ATTEMPT',
        body: req.body,
        query: req.query,
        params: req.params,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid input detected',
        error: {
          code: 'INVALID_INPUT',
          message: 'Request contains potentially malicious content'
        }
      });
    }
    
    next();
  } catch (error) {
    logger.error('NoSQL injection validation error', {
      type: 'NOSQL_INJECTION_VALIDATION_ERROR',
      error: error.message,
      endpoint: req.originalUrl
    });
    
    // Continue on error (fail open)
    next();
  }
}

/**
 * Validate request format and structure
 * Ensures request has valid structure before processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateRequestFormat(req, res, next) {
  try {
    // Basic request validation
    if (req.body) {
      // Remove any potentially dangerous properties
      delete req.body.__proto__;
      delete req.body.constructor;
      delete req.body.prototype;
    }
    
    // Validate content-type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('content-type');
      if (contentType && 
          !contentType.includes('application/json') && 
          !contentType.includes('multipart/form-data') &&
          !contentType.includes('application/x-www-form-urlencoded')) {
        return res.status(415).json({
          success: false,
          message: 'Unsupported content type',
          error: {
            code: 'UNSUPPORTED_CONTENT_TYPE',
            acceptedTypes: ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded']
          }
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Request validation error', {
      type: 'REQUEST_VALIDATION_ERROR',
      error: error.message,
      endpoint: req.originalUrl
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid request format',
      error: {
        code: 'INVALID_REQUEST'
      }
    });
  }
}

/**
 * Validate file upload
 * Ensures uploaded files are safe
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
function validateFileUpload(options = {}) {
  const {
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFileSize = 5 * 1024 * 1024, // 5MB
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  } = options;
  
  return (req, res, next) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return next();
      }
      
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
      
      for (const file of files) {
        // Check file size
        if (file.size > maxFileSize) {
          logger.security.fileSizeExceeded({
            type: 'FILE_SIZE_EXCEEDED',
            fileName: file.name,
            fileSize: file.size,
            maxSize: maxFileSize,
            endpoint: req.originalUrl,
            ip: req.ip
          });
          
          return res.status(413).json({
            success: false,
            message: 'File size exceeds maximum allowed size',
            error: {
              code: 'FILE_TOO_LARGE',
              fileName: file.name,
              maxSize: maxFileSize
            }
          });
        }
        
        // Check MIME type
        if (!allowedMimeTypes.includes(file.mimetype)) {
          logger.security.invalidFileType({
            type: 'INVALID_FILE_TYPE',
            fileName: file.name,
            mimeType: file.mimetype,
            allowedTypes: allowedMimeTypes,
            endpoint: req.originalUrl,
            ip: req.ip
          });
          
          return res.status(400).json({
            success: false,
            message: 'Invalid file type',
            error: {
              code: 'INVALID_FILE_TYPE',
              fileName: file.name,
              allowedTypes: allowedMimeTypes
            }
          });
        }
        
        // Check file extension
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
          logger.security.invalidFileExtension({
            type: 'INVALID_FILE_EXTENSION',
            fileName: file.name,
            extension: fileExtension,
            allowedExtensions,
            endpoint: req.originalUrl,
            ip: req.ip
          });
          
          return res.status(400).json({
            success: false,
            message: 'Invalid file extension',
            error: {
              code: 'INVALID_FILE_EXTENSION',
              fileName: file.name,
              allowedExtensions
            }
          });
        }
        
        // Sanitize file name
        file.name = sanitizeString(file.name);
      }
      
      next();
    } catch (error) {
      logger.error('File upload validation error', {
        type: 'FILE_UPLOAD_VALIDATION_ERROR',
        error: error.message,
        endpoint: req.originalUrl
      });
      
      res.status(500).json({
        success: false,
        message: 'File upload validation failed',
        error: {
          code: 'FILE_VALIDATION_ERROR'
        }
      });
    }
  };
}

/**
 * Combined security middleware chain
 * Applies multiple security checks in sequence
 * @returns {Array<Function>} Array of middleware functions
 */
function securityChain() {
  return [
    validateRequestFormat,
    sanitizeInput,
    preventSQLInjection,
    preventNoSQLInjection
  ];
}

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeObject,
  preventSQLInjection,
  preventNoSQLInjection,
  validateRequestFormat,
  validateFileUpload,
  securityChain,
  detectSQLInjection,
  detectNoSQLInjection
};
