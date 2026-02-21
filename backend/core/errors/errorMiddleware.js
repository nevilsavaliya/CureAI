/**
 * Error handling middleware for Express
 * Catches all errors and delegates to ErrorHandler
 */

const ErrorHandler = require('./ErrorHandler');

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
const errorMiddleware = (err, req, res, next) => {
  ErrorHandler.handleError(err, req, res);
};

/**
 * 404 Not Found handler
 * Should be registered after all routes but before error middleware
 */
const notFoundHandler = (req, res, next) => {
  const NotFoundError = require('./NotFoundError');
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
};

module.exports = errorMiddleware;
module.exports.notFoundHandler = notFoundHandler;
