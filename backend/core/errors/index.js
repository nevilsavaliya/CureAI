/**
 * Error handling module exports
 */

module.exports = {
  AppError: require('./AppError'),
  ValidationError: require('./ValidationError'),
  AuthenticationError: require('./AuthenticationError'),
  AuthorizationError: require('./AuthorizationError'),
  NotFoundError: require('./NotFoundError'),
  DatabaseError: require('./DatabaseError'),
  ExternalServiceError: require('./ExternalServiceError'),
  ErrorHandler: require('./ErrorHandler'),
  errorMiddleware: require('./errorMiddleware')
};
