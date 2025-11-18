/**
 * Quick Reset Script
 * Immediately deletes all data without confirmation delay
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function quickReset() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform';
    await mongoose.connect(dbUri);
    
    console.log('Resetting database...');
    
    // Drop entire database (fastest method)
    await mongoose.connection.db.dropDatabase();
    
    console.log('✓ Database reset complete!');
    console.log('All collections and data have been deleted.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

quickReset();
