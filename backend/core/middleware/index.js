/**
 * Core middleware module exports
 */

module.exports = {
  asyncHandler: require('./asyncHandler'),
  ...require('./validationMiddleware'),
  ...require('./rateLimitMiddleware'),
  ...require('./securityHeadersMiddleware'),
  ...require('./auditLoggingMiddleware'),
  ...require('./inputSanitizationMiddleware')
};
