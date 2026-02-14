const { trackDatabaseQuery } = require('./performanceTracker');

// Mongoose plugin to track query performance
function mongoosePerformancePlugin(schema) {
  // Track query execution time
  schema.pre(/^find/, function() {
    this.start = Date.now();
  });

  schema.post(/^find/, function() {
    if (this.start) {
      const queryTime = Date.now() - this.start;
      trackDatabaseQuery(queryTime);
    }
  });

  // Track save operations
  schema.pre('save', function() {
    this.start = Date.now();
  });

  schema.post('save', function() {
    if (this.start) {
      const queryTime = Date.now() - this.start;
      trackDatabaseQuery(queryTime);
    }
  });

  // Track update operations
  schema.pre(/^update/, function() {
    this.start = Date.now();
  });

  schema.post(/^update/, function() {
    if (this.start) {
      const queryTime = Date.now() - this.start;
      trackDatabaseQuery(queryTime);
    }
  });

  // Track delete operations
  schema.pre(/^delete/, function() {
    this.start = Date.now();
  });

  schema.post(/^delete/, function() {
    if (this.start) {
      const queryTime = Date.now() - this.start;
      trackDatabaseQuery(queryTime);
    }
  });
}

module.exports = mongoosePerformancePlugin;