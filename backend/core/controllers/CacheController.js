/**
 * Cache Controller
 * Provides endpoints for cache monitoring and management
 */

const CacheService = require('../services/CacheService');
const CacheMonitor = require('../utils/cacheMonitor');

class CacheController {
  /**
   * Get cache health status
   * GET /api/cache/health
   */
  async getHealth(req, res) {
    try {
      const report = CacheMonitor.getHealthReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get cache health',
        message: error.message
      });
    }
  }

  /**
   * Get cache statistics
   * GET /api/cache/stats
   */
  async getStats(req, res) {
    try {
      const stats = CacheService.getStats();
      const memory = CacheService.getMemoryUsage();
      
      res.json({
        stats,
        memory,
        recommendations: CacheMonitor.getRecommendations()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get cache stats',
        message: error.message
      });
    }
  }

  /**
   * Clear cache (admin only)
   * POST /api/cache/clear
   */
  async clearCache(req, res) {
    try {
      await CacheService.clear();
      
      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to clear cache',
        message: error.message
      });
    }
  }

  /**
   * Evict LRU entries (admin only)
   * POST /api/cache/evict
   */
  async evictLRU(req, res) {
    try {
      const { count = 10 } = req.body;
      
      for (let i = 0; i < count; i++) {
        await CacheService.evictLRU();
      }
      
      res.json({
        success: true,
        message: `Evicted ${count} entries`,
        currentSize: CacheService.size()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to evict entries',
        message: error.message
      });
    }
  }
}

module.exports = new CacheController();
