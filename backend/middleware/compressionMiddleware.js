/**
 * Response Compression Middleware
 * Implements gzip compression for API responses to reduce bandwidth usage
 */

const compression = require('compression');

/**
 * Compression filter function
 * Determines which responses should be compressed
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {boolean} - Whether to compress the response
 */
function shouldCompress(req, res) {
  // Don't compress if client doesn't support it
  if (req.headers['x-no-compression']) {
    return false;
  }
  
  // Don't compress already compressed content
  const contentType = res.getHeader('Content-Type');
  if (contentType) {
    const type = contentType.toString().toLowerCase();
    
    // Skip compression for already compressed formats
    if (
      type.includes('image/') ||
      type.includes('video/') ||
      type.includes('audio/') ||
      type.includes('application/zip') ||
      type.includes('application/gzip') ||
      type.includes('application/x-gzip') ||
      type.includes('application/pdf')
    ) {
      return false;
    }
  }
  
  // Use compression's default filter for everything else
  return compression.filter(req, res);
}

/**
 * Create compression middleware with optimized settings
 * 
 * @returns {Function} Express middleware
 */
function createCompressionMiddleware() {
  return compression({
    // Custom filter function
    filter: shouldCompress,
    
    // Compression level (0-9, where 6 is default)
    // Level 6 provides good balance between compression ratio and speed
    level: process.env.COMPRESSION_LEVEL || 6,
    
    // Minimum response size to compress (in bytes)
    // Don't compress responses smaller than 1KB as overhead isn't worth it
    threshold: process.env.COMPRESSION_THRESHOLD || 1024,
    
    // Memory level (1-9, where 8 is default)
    // Higher values use more memory but may improve compression
    memLevel: 8,
    
    // Compression strategy
    // Z_DEFAULT_STRATEGY is suitable for most data
    strategy: compression.Z_DEFAULT_STRATEGY
  });
}

/**
 * Compression statistics middleware
 * Logs compression ratio for monitoring
 */
function compressionStatsMiddleware(req, res, next) {
  // Only track in development or if explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !process.env.TRACK_COMPRESSION_STATS) {
    return next();
  }
  
  const originalWrite = res.write;
  const originalEnd = res.end;
  let originalSize = 0;
  let compressedSize = 0;
  
  // Track original size
  res.write = function(chunk, ...args) {
    if (chunk) {
      originalSize += Buffer.byteLength(chunk);
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };
  
  res.end = function(chunk, ...args) {
    if (chunk) {
      originalSize += Buffer.byteLength(chunk);
    }
    
    // Log compression stats
    const contentEncoding = res.getHeader('Content-Encoding');
    if (contentEncoding && contentEncoding.includes('gzip')) {
      const ratio = originalSize > 0 ? ((1 - (compressedSize / originalSize)) * 100).toFixed(2) : 0;
      console.log(`[Compression] ${req.method} ${req.path} - Original: ${originalSize}B, Ratio: ${ratio}%`);
    }
    
    return originalEnd.apply(res, [chunk, ...args]);
  };
  
  next();
}

/**
 * Get compression configuration
 * @returns {Object} Compression configuration
 */
function getCompressionConfig() {
  return {
    enabled: true,
    level: process.env.COMPRESSION_LEVEL || 6,
    threshold: process.env.COMPRESSION_THRESHOLD || 1024,
    memLevel: 8,
    strategy: 'Z_DEFAULT_STRATEGY'
  };
}

module.exports = {
  createCompressionMiddleware,
  compressionStatsMiddleware,
  shouldCompress,
  getCompressionConfig
};
