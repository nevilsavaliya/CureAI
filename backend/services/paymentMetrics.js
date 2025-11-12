const Payment = require('../models/Payment');

/**
 * Payment Metrics Service
 * Tracks and calculates payment-related metrics for monitoring and analytics
 */
class PaymentMetrics {
  constructor() {
    // In-memory metrics cache
    this.metricsCache = {
      lastUpdated: null,
      data: null
    };
    
    // Cache duration: 5 minutes
    this.cacheDuration = 5 * 60 * 1000;
    
    // Real-time counters (reset daily)
    this.dailyCounters = {
      date: new Date().toISOString().split('T')[0],
      initiated: 0,
      completed: 0,
      failed: 0,
      timeout: 0,
      apiErrors: 0,
      totalAmount: 0,
      completedAmount: 0
    };
  }

  /**
   * Increment daily counter
   * @param {string} counter - Counter name
   * @param {number} value - Value to add (default 1)
   */
  incrementCounter(counter, value = 1) {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset counters if it's a new day
    if (this.dailyCounters.date !== today) {
      this.resetDailyCounters();
    }
    
    if (this.dailyCounters.hasOwnProperty(counter)) {
      this.dailyCounters[counter] += value;
    }
  }

  /**
   * Reset daily counters
   */
  resetDailyCounters() {
    const today = new Date().toISOString().split('T')[0];
    this.dailyCounters = {
      date: today,
      initiated: 0,
      completed: 0,
      failed: 0,
      timeout: 0,
      apiErrors: 0,
      totalAmount: 0,
      completedAmount: 0
    };
  }

  /**
   * Get daily counters
   * @returns {Object} - Daily counters
   */
  getDailyCounters() {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset if it's a new day
    if (this.dailyCounters.date !== today) {
      this.resetDailyCounters();
    }
    
    return { ...this.dailyCounters };
  }

  /**
   * Calculate payment success rate
   * @param {Date} startDate - Start date for calculation
   * @param {Date} endDate - End date for calculation
   * @returns {Promise<Object>} - Success rate metrics
   */
  async calculateSuccessRate(startDate = null, endDate = null) {
    try {
      // Default to last 30 days if no dates provided
      if (!endDate) {
        endDate = new Date();
      }
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      const query = {
        initiatedAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      // Get payment counts by status
      const totalPayments = await Payment.countDocuments(query);
      const completedPayments = await Payment.countDocuments({ ...query, status: 'completed' });
      const failedPayments = await Payment.countDocuments({ ...query, status: 'failed' });
      const timeoutPayments = await Payment.countDocuments({ ...query, status: 'timeout' });
      const pendingPayments = await Payment.countDocuments({ ...query, status: 'pending' });

      // Calculate rates
      const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;
      const failureRate = totalPayments > 0 ? (failedPayments / totalPayments) * 100 : 0;
      const timeoutRate = totalPayments > 0 ? (timeoutPayments / totalPayments) * 100 : 0;

      return {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        total: totalPayments,
        completed: completedPayments,
        failed: failedPayments,
        timeout: timeoutPayments,
        pending: pendingPayments,
        successRate: parseFloat(successRate.toFixed(2)),
        failureRate: parseFloat(failureRate.toFixed(2)),
        timeoutRate: parseFloat(timeoutRate.toFixed(2))
      };
    } catch (error) {
      console.error('Error calculating success rate:', error.message);
      throw error;
    }
  }

  /**
   * Calculate average verification time
   * @param {Date} startDate - Start date for calculation
   * @param {Date} endDate - End date for calculation
   * @returns {Promise<Object>} - Verification time metrics
   */
  async calculateAverageVerificationTime(startDate = null, endDate = null) {
    try {
      // Default to last 30 days if no dates provided
      if (!endDate) {
        endDate = new Date();
      }
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      const query = {
        initiatedAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed',
        completedAt: { $exists: true }
      };

      const completedPayments = await Payment.find(query).select('initiatedAt completedAt verificationAttempts');

      if (completedPayments.length === 0) {
        return {
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          count: 0,
          averageTimeSeconds: 0,
          averageAttempts: 0,
          minTimeSeconds: 0,
          maxTimeSeconds: 0
        };
      }

      // Calculate verification times
      const verificationTimes = completedPayments.map(payment => {
        const timeMs = new Date(payment.completedAt) - new Date(payment.initiatedAt);
        return {
          timeSeconds: timeMs / 1000,
          attempts: payment.verificationAttempts || 0
        };
      });

      const totalTime = verificationTimes.reduce((sum, v) => sum + v.timeSeconds, 0);
      const totalAttempts = verificationTimes.reduce((sum, v) => sum + v.attempts, 0);
      const times = verificationTimes.map(v => v.timeSeconds);

      return {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        count: completedPayments.length,
        averageTimeSeconds: parseFloat((totalTime / completedPayments.length).toFixed(2)),
        averageAttempts: parseFloat((totalAttempts / completedPayments.length).toFixed(2)),
        minTimeSeconds: parseFloat(Math.min(...times).toFixed(2)),
        maxTimeSeconds: parseFloat(Math.max(...times).toFixed(2))
      };
    } catch (error) {
      console.error('Error calculating average verification time:', error.message);
      throw error;
    }
  }

  /**
   * Calculate API error rate
   * @param {Date} startDate - Start date for calculation
   * @param {Date} endDate - End date for calculation
   * @returns {Promise<Object>} - API error rate metrics
   */
  async calculateAPIErrorRate(startDate = null, endDate = null) {
    try {
      // Default to last 30 days if no dates provided
      if (!endDate) {
        endDate = new Date();
      }
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      const query = {
        initiatedAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      // Get all payments in period
      const allPayments = await Payment.find(query).select('status kotakResponse verificationAttempts');

      if (allPayments.length === 0) {
        return {
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          totalPayments: 0,
          paymentsWithErrors: 0,
          errorRate: 0,
          errorsByCode: {}
        };
      }

      // Count payments with API errors
      let paymentsWithErrors = 0;
      const errorsByCode = {};

      for (const payment of allPayments) {
        if (payment.kotakResponse && payment.kotakResponse.error) {
          paymentsWithErrors++;
          
          const errorCode = payment.kotakResponse.responseCode || 'UNKNOWN';
          errorsByCode[errorCode] = (errorsByCode[errorCode] || 0) + 1;
        }
      }

      const errorRate = (paymentsWithErrors / allPayments.length) * 100;

      return {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        totalPayments: allPayments.length,
        paymentsWithErrors,
        errorRate: parseFloat(errorRate.toFixed(2)),
        errorsByCode
      };
    } catch (error) {
      console.error('Error calculating API error rate:', error.message);
      throw error;
    }
  }

  /**
   * Calculate revenue metrics
   * @param {Date} startDate - Start date for calculation
   * @param {Date} endDate - End date for calculation
   * @returns {Promise<Object>} - Revenue metrics
   */
  async calculateRevenueMetrics(startDate = null, endDate = null) {
    try {
      // Default to last 30 days if no dates provided
      if (!endDate) {
        endDate = new Date();
      }
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      const query = {
        initiatedAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      // Aggregate revenue data
      const revenueData = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      // Process results
      const metrics = {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        totalInitiated: 0,
        totalCompleted: 0,
        totalFailed: 0,
        amountInitiated: 0,
        amountCompleted: 0,
        amountFailed: 0
      };

      for (const item of revenueData) {
        metrics.totalInitiated += item.count;
        metrics.amountInitiated += item.totalAmount;

        if (item._id === 'completed') {
          metrics.totalCompleted = item.count;
          metrics.amountCompleted = item.totalAmount;
        } else if (item._id === 'failed') {
          metrics.totalFailed = item.count;
          metrics.amountFailed = item.totalAmount;
        }
      }

      return metrics;
    } catch (error) {
      console.error('Error calculating revenue metrics:', error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive payment metrics
   * @param {Date} startDate - Start date for calculation
   * @param {Date} endDate - End date for calculation
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} - Comprehensive metrics
   */
  async getComprehensiveMetrics(startDate = null, endDate = null, useCache = true) {
    try {
      // Check cache
      if (useCache && this.metricsCache.lastUpdated) {
        const cacheAge = Date.now() - this.metricsCache.lastUpdated;
        if (cacheAge < this.cacheDuration) {
          console.log('Returning cached metrics');
          return this.metricsCache.data;
        }
      }

      console.log('Calculating fresh metrics...');

      // Calculate all metrics in parallel
      const [successRate, verificationTime, apiErrorRate, revenue] = await Promise.all([
        this.calculateSuccessRate(startDate, endDate),
        this.calculateAverageVerificationTime(startDate, endDate),
        this.calculateAPIErrorRate(startDate, endDate),
        this.calculateRevenueMetrics(startDate, endDate)
      ]);

      const metrics = {
        generatedAt: new Date().toISOString(),
        period: successRate.period,
        successRate,
        verificationTime,
        apiErrorRate,
        revenue,
        dailyCounters: this.getDailyCounters()
      };

      // Update cache
      this.metricsCache.lastUpdated = Date.now();
      this.metricsCache.data = metrics;

      return metrics;
    } catch (error) {
      console.error('Error getting comprehensive metrics:', error.message);
      throw error;
    }
  }

  /**
   * Clear metrics cache
   */
  clearCache() {
    this.metricsCache.lastUpdated = null;
    this.metricsCache.data = null;
    console.log('Metrics cache cleared');
  }

  /**
   * Get payment trends (daily breakdown)
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Array>} - Daily payment trends
   */
  async getPaymentTrends(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await Payment.aggregate([
        {
          $match: {
            initiatedAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$initiatedAt' } },
              status: '$status'
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);

      // Organize by date
      const trendsByDate = {};
      for (const trend of trends) {
        const date = trend._id.date;
        if (!trendsByDate[date]) {
          trendsByDate[date] = {
            date,
            total: 0,
            completed: 0,
            failed: 0,
            timeout: 0,
            pending: 0,
            totalAmount: 0,
            completedAmount: 0
          };
        }

        trendsByDate[date].total += trend.count;
        trendsByDate[date].totalAmount += trend.totalAmount;
        trendsByDate[date][trend._id.status] = trend.count;

        if (trend._id.status === 'completed') {
          trendsByDate[date].completedAmount = trend.totalAmount;
        }
      }

      return Object.values(trendsByDate);
    } catch (error) {
      console.error('Error getting payment trends:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new PaymentMetrics();
