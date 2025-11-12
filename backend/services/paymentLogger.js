const fs = require('fs');
const path = require('path');

/**
 * Payment Logger Service
 * Provides comprehensive logging for payment activities with structured format
 */
class PaymentLogger {
  constructor() {
    // Log directory
    this.logDir = path.join(__dirname, '../logs');
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Log file paths
    this.paymentLogFile = path.join(this.logDir, 'payment-activity.log');
    this.apiLogFile = path.join(this.logDir, 'kotak-api.log');
    this.errorLogFile = path.join(this.logDir, 'payment-errors.log');
  }

  /**
   * Format log entry with timestamp and structured data
   * @param {string} level - Log level (INFO, WARN, ERROR)
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @returns {string} - Formatted log entry
   */
  formatLogEntry(level, category, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      ...data
    };
    return JSON.stringify(logEntry) + '\n';
  }

  /**
   * Write log entry to file
   * @param {string} filePath - Log file path
   * @param {string} entry - Log entry
   */
  writeLog(filePath, entry) {
    try {
      fs.appendFileSync(filePath, entry, 'utf8');
    } catch (error) {
      console.error('Error writing to log file:', error.message);
    }
  }

  /**
   * Log payment initiation
   * @param {Object} params - Payment initiation parameters
   */
  logPaymentInitiation({ paymentId, txnId, doctorId, amount, planName, duration }) {
    const message = `Payment initiated: ${txnId}`;
    const data = {
      paymentId,
      txnId,
      doctorId: doctorId.toString(),
      amount,
      currency: 'INR',
      planName,
      duration,
      action: 'PAYMENT_INITIATED'
    };

    const entry = this.formatLogEntry('INFO', 'PAYMENT', message, data);
    this.writeLog(this.paymentLogFile, entry);
    
    console.log(`[PAYMENT] ${message}`, { paymentId, txnId, amount });
  }

  /**
   * Log Kotak API call
   * @param {Object} params - API call parameters
   */
  logKotakAPICall({ endpoint, method, txnId, requestData, responseData, duration, success, error }) {
    const message = `Kotak API ${method} ${endpoint}`;
    const data = {
      endpoint,
      method,
      txnId,
      requestData: this.sanitizeData(requestData),
      responseData: this.sanitizeData(responseData),
      duration,
      success,
      error: error ? error.message : undefined,
      action: 'KOTAK_API_CALL'
    };

    const level = success ? 'INFO' : 'ERROR';
    const entry = this.formatLogEntry(level, 'KOTAK_API', message, data);
    this.writeLog(this.apiLogFile, entry);
    
    if (success) {
      console.log(`[KOTAK_API] ${message}`, { txnId, duration, success });
    } else {
      console.error(`[KOTAK_API] ${message} FAILED`, { txnId, error: error?.message });
    }
  }

  /**
   * Log payment status change
   * @param {Object} params - Status change parameters
   */
  logStatusChange({ paymentId, txnId, oldStatus, newStatus, reason, verificationAttempts }) {
    const message = `Payment status changed: ${oldStatus} -> ${newStatus}`;
    const data = {
      paymentId,
      txnId,
      oldStatus,
      newStatus,
      reason,
      verificationAttempts,
      action: 'STATUS_CHANGE'
    };

    const entry = this.formatLogEntry('INFO', 'PAYMENT', message, data);
    this.writeLog(this.paymentLogFile, entry);
    
    console.log(`[PAYMENT] ${message}`, { paymentId, txnId, newStatus });
  }

  /**
   * Log payment error
   * @param {Object} params - Error parameters
   */
  logPaymentError({ paymentId, txnId, doctorId, operation, error, context }) {
    const message = `Payment error in ${operation}`;
    const data = {
      paymentId,
      txnId,
      doctorId: doctorId ? doctorId.toString() : undefined,
      operation,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.response?.status
      },
      context: this.sanitizeData(context),
      action: 'PAYMENT_ERROR'
    };

    const entry = this.formatLogEntry('ERROR', 'PAYMENT', message, data);
    this.writeLog(this.errorLogFile, entry);
    
    console.error(`[PAYMENT_ERROR] ${message}`, {
      paymentId,
      txnId,
      operation,
      error: error.message
    });
  }

  /**
   * Log subscription activation
   * @param {Object} params - Subscription activation parameters
   */
  logSubscriptionActivation({ paymentId, txnId, doctorId, subscriptionId, planName, expiryDate }) {
    const message = `Subscription activated for payment ${txnId}`;
    const data = {
      paymentId,
      txnId,
      doctorId: doctorId.toString(),
      subscriptionId: subscriptionId.toString(),
      planName,
      expiryDate,
      action: 'SUBSCRIPTION_ACTIVATED'
    };

    const entry = this.formatLogEntry('INFO', 'SUBSCRIPTION', message, data);
    this.writeLog(this.paymentLogFile, entry);
    
    console.log(`[SUBSCRIPTION] ${message}`, { subscriptionId, doctorId });
  }

  /**
   * Log verification polling activity
   * @param {Object} params - Polling parameters
   */
  logVerificationPoll({ paymentId, txnId, attemptCount, maxAttempts, status, elapsedTime }) {
    const message = `Verification poll attempt ${attemptCount}/${maxAttempts}`;
    const data = {
      paymentId,
      txnId,
      attemptCount,
      maxAttempts,
      status,
      elapsedTimeMs: elapsedTime,
      action: 'VERIFICATION_POLL'
    };

    const entry = this.formatLogEntry('INFO', 'VERIFICATION', message, data);
    this.writeLog(this.paymentLogFile, entry);
  }

  /**
   * Log verification timeout
   * @param {Object} params - Timeout parameters
   */
  logVerificationTimeout({ paymentId, txnId, attemptCount, elapsedTime }) {
    const message = `Payment verification timeout: ${txnId}`;
    const data = {
      paymentId,
      txnId,
      attemptCount,
      elapsedTimeMs: elapsedTime,
      action: 'VERIFICATION_TIMEOUT'
    };

    const entry = this.formatLogEntry('WARN', 'VERIFICATION', message, data);
    this.writeLog(this.paymentLogFile, entry);
    
    console.warn(`[VERIFICATION] ${message}`, { paymentId, attemptCount });
  }

  /**
   * Sanitize sensitive data from logs
   * @param {Object} data - Data to sanitize
   * @returns {Object} - Sanitized data
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = ['password', 'secret', 'token', 'accessToken', 'clientSecret', 'secretKey'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Get log file path for a specific log type
   * @param {string} logType - Type of log (payment, api, error)
   * @returns {string} - Log file path
   */
  getLogFilePath(logType) {
    switch (logType) {
      case 'payment':
        return this.paymentLogFile;
      case 'api':
        return this.apiLogFile;
      case 'error':
        return this.errorLogFile;
      default:
        return this.paymentLogFile;
    }
  }

  /**
   * Read recent log entries
   * @param {string} logType - Type of log
   * @param {number} lines - Number of lines to read
   * @returns {Array} - Array of log entries
   */
  readRecentLogs(logType = 'payment', lines = 100) {
    try {
      const filePath = this.getLogFilePath(logType);
      
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const allLines = content.trim().split('\n').filter(line => line);
      const recentLines = allLines.slice(-lines);
      
      return recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { raw: line };
        }
      });
    } catch (error) {
      console.error('Error reading log file:', error.message);
      return [];
    }
  }

  /**
   * Clear old log entries (keep last N days)
   * @param {number} daysToKeep - Number of days to keep
   */
  cleanOldLogs(daysToKeep = 30) {
    const logFiles = [this.paymentLogFile, this.apiLogFile, this.errorLogFile];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    for (const logFile of logFiles) {
      try {
        if (!fs.existsSync(logFile)) {
          continue;
        }

        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.trim().split('\n').filter(line => line);
        
        const filteredLines = lines.filter(line => {
          try {
            const entry = JSON.parse(line);
            const entryDate = new Date(entry.timestamp);
            return entryDate >= cutoffDate;
          } catch (e) {
            return true; // Keep lines that can't be parsed
          }
        });

        fs.writeFileSync(logFile, filteredLines.join('\n') + '\n', 'utf8');
        console.log(`Cleaned old logs from ${path.basename(logFile)}, kept ${filteredLines.length}/${lines.length} entries`);
      } catch (error) {
        console.error(`Error cleaning log file ${logFile}:`, error.message);
      }
    }
  }
}

// Export singleton instance
module.exports = new PaymentLogger();
