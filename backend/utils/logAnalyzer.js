const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Log Analysis Utility
 * Provides methods to analyze and extract insights from log files
 */
class LogAnalyzer {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
  }

  /**
   * Get all log files in the logs directory
   */
  getLogFiles() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return [];
      }

      return fs.readdirSync(this.logsDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logsDir, file),
          size: fs.statSync(path.join(this.logsDir, file)).size,
          modified: fs.statSync(path.join(this.logsDir, file)).mtime
        }));
    } catch (error) {
      console.error('Error getting log files:', error);
      return [];
    }
  }

  /**
   * Parse log entries from a file
   */
  async parseLogFile(filePath, limit = 1000) {
    const entries = [];
    
    try {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let count = 0;
      for await (const line of rl) {
        if (count >= limit) break;
        
        try {
          const entry = JSON.parse(line);
          entries.push(entry);
          count++;
        } catch (parseError) {
          // Skip invalid JSON lines
          continue;
        }
      }
    } catch (error) {
      console.error('Error parsing log file:', error);
    }

    return entries.reverse(); // Most recent first
  }

  /**
   * Get hospital activity summary
   */
  async getHospitalActivitySummary(days = 7) {
    const hospitalLogFile = path.join(this.logsDir, 'hospital-' + new Date().toISOString().split('T')[0] + '.log');
    
    if (!fs.existsSync(hospitalLogFile)) {
      return {
        totalRegistrations: 0,
        totalLogins: 0,
        totalApiCalls: 0,
        uniqueHospitals: 0,
        topHospitals: []
      };
    }

    const entries = await this.parseLogFile(hospitalLogFile);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const registrations = entries.filter(e => 
      e.type === 'HOSPITAL_REGISTRATION' && 
      new Date(e.timestamp) > cutoffDate
    );

    const logins = entries.filter(e => 
      e.type === 'HOSPITAL_LOGIN' && 
      e.success === true &&
      new Date(e.timestamp) > cutoffDate
    );

    const apiCalls = entries.filter(e => 
      e.type === 'HOSPITAL_API_ACCESS' && 
      e.success === true &&
      new Date(e.timestamp) > cutoffDate
    );

    // Count API calls by hospital
    const hospitalApiCounts = {};
    apiCalls.forEach(call => {
      const hospitalId = call.hospitalId;
      if (hospitalId) {
        hospitalApiCounts[hospitalId] = (hospitalApiCounts[hospitalId] || 0) + 1;
      }
    });

    const topHospitals = Object.entries(hospitalApiCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([hospitalId, count]) => ({
        hospitalId,
        apiCallCount: count
      }));

    return {
      totalRegistrations: registrations.length,
      totalLogins: logins.length,
      totalApiCalls: apiCalls.length,
      uniqueHospitals: Object.keys(hospitalApiCounts).length,
      topHospitals
    };
  }

  /**
   * Get security events summary
   */
  async getSecurityEventsSummary(days = 7) {
    const securityLogFile = path.join(this.logsDir, 'security-' + new Date().toISOString().split('T')[0] + '.log');
    
    if (!fs.existsSync(securityLogFile)) {
      return {
        totalEvents: 0,
        invalidCredentials: 0,
        rateLimitExceeded: 0,
        suspiciousActivity: 0,
        unauthorizedAccess: 0,
        topIPs: []
      };
    }

    const entries = await this.parseLogFile(securityLogFile);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentEvents = entries.filter(e => new Date(e.timestamp) > cutoffDate);

    const invalidCredentials = recentEvents.filter(e => e.type === 'SECURITY_INVALID_API_CREDENTIALS');
    const rateLimitExceeded = recentEvents.filter(e => e.type === 'SECURITY_RATE_LIMIT_EXCEEDED');
    const suspiciousActivity = recentEvents.filter(e => e.type === 'SECURITY_SUSPICIOUS_ACTIVITY');
    const unauthorizedAccess = recentEvents.filter(e => e.type === 'SECURITY_UNAUTHORIZED_ACCESS');

    // Count events by IP
    const ipCounts = {};
    recentEvents.forEach(event => {
      const ip = event.ip;
      if (ip && ip !== 'unknown') {
        ipCounts[ip] = (ipCounts[ip] || 0) + 1;
      }
    });

    const topIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, eventCount: count }));

    return {
      totalEvents: recentEvents.length,
      invalidCredentials: invalidCredentials.length,
      rateLimitExceeded: rateLimitExceeded.length,
      suspiciousActivity: suspiciousActivity.length,
      unauthorizedAccess: unauthorizedAccess.length,
      topIPs
    };
  }

  /**
   * Get API performance metrics
   */
  async getApiPerformanceMetrics(days = 7) {
    const apiLogFile = path.join(this.logsDir, 'api-access-' + new Date().toISOString().split('T')[0] + '.log');
    
    if (!fs.existsSync(apiLogFile)) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        topEndpoints: []
      };
    }

    const entries = await this.parseLogFile(apiLogFile);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const responses = entries.filter(e => 
      e.type === 'API_RESPONSE' && 
      new Date(e.timestamp) > cutoffDate &&
      e.responseTime !== undefined
    );

    if (responses.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        topEndpoints: []
      };
    }

    const totalResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0);
    const averageResponseTime = Math.round(totalResponseTime / responses.length);
    const slowRequests = responses.filter(r => r.responseTime > 1000).length;
    const errorResponses = responses.filter(r => r.statusCode >= 400).length;
    const errorRate = Math.round((errorResponses / responses.length) * 100);

    // Count requests by endpoint
    const endpointCounts = {};
    responses.forEach(response => {
      const endpoint = response.url;
      if (endpoint) {
        endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
      }
    });

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, requestCount: count }));

    return {
      totalRequests: responses.length,
      averageResponseTime,
      slowRequests,
      errorRate,
      topEndpoints
    };
  }

  /**
   * Generate a comprehensive log report
   */
  async generateReport(days = 7) {
    const [hospitalActivity, securityEvents, apiPerformance] = await Promise.all([
      this.getHospitalActivitySummary(days),
      this.getSecurityEventsSummary(days),
      this.getApiPerformanceMetrics(days)
    ]);

    return {
      reportDate: new Date().toISOString(),
      periodDays: days,
      hospitalActivity,
      securityEvents,
      apiPerformance,
      logFiles: this.getLogFiles()
    };
  }

  /**
   * Search logs for specific patterns
   */
  async searchLogs(pattern, logType = 'all', limit = 100) {
    const logFiles = this.getLogFiles();
    const results = [];

    for (const logFile of logFiles) {
      if (logType !== 'all' && !logFile.name.includes(logType)) {
        continue;
      }

      const entries = await this.parseLogFile(logFile.path, limit);
      const matches = entries.filter(entry => {
        const entryStr = JSON.stringify(entry).toLowerCase();
        return entryStr.includes(pattern.toLowerCase());
      });

      results.push(...matches.map(match => ({
        ...match,
        logFile: logFile.name
      })));

      if (results.length >= limit) {
        break;
      }
    }

    return results.slice(0, limit);
  }
}

module.exports = LogAnalyzer;