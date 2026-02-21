const mongoose = require('mongoose');
const mongoosePerformancePlugin = require('../middleware/mongoosePerformance');
const { ensureIndexes } = require('../core/repositories/databaseOptimization');

const connectDB = async () => {
  try {
    // Add global performance tracking plugin
    mongoose.plugin(mongoosePerformancePlugin);
    
    // Connection pool configuration
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool settings for optimal performance
      maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE || 10,
      minPoolSize: process.env.MONGODB_MIN_POOL_SIZE || 2,
      maxIdleTimeMS: process.env.MONGODB_MAX_IDLE_TIME_MS || 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Enable connection monitoring
      monitorCommands: process.env.NODE_ENV === 'development',
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection Pool - Max: ${connectionOptions.maxPoolSize}, Min: ${connectionOptions.minPoolSize}`);
    
    // Monitor connection pool
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection disconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    // Ensure all indexes are created
    try {
      await ensureIndexes();
      console.log('Database indexes verified');
    } catch (indexError) {
      console.error('Error ensuring indexes:', indexError);
      // Don't fail startup if index creation fails
    }
    
    // Log connection pool stats periodically in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const poolStats = {
          totalConnections: mongoose.connection.db?.serverConfig?.s?.pool?.totalConnectionCount || 0,
          availableConnections: mongoose.connection.db?.serverConfig?.s?.pool?.availableConnectionCount || 0,
          inUseConnections: mongoose.connection.db?.serverConfig?.s?.pool?.inUseConnectionCount || 0
        };
        console.log('Connection Pool Stats:', poolStats);
      }, 60000); // Log every minute
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
