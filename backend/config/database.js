const mongoose = require('mongoose');
const mongoosePerformancePlugin = require('../middleware/mongoosePerformance');

const connectDB = async () => {
  try {
    // Add global performance tracking plugin
    mongoose.plugin(mongoosePerformancePlugin);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
