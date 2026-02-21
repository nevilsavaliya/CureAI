/**
 * Core module - Central exports for all core functionality
 */

module.exports = {
  // Configuration
  ...require('./config'),
  
  // Error handling
  ...require('./errors'),
  
  // Services
  ...require('./services'),
  
  // Repositories
  ...require('./repositories'),
  
  // Middleware
  ...require('./middleware'),
  
  // Utilities
  ...require('./utils')
};
