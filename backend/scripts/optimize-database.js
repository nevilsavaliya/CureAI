/**
 * Database Optimization Script
 * Creates indexes and optimizes database performance
 */

const mongoose = require('mongoose');
const Case = require('../models/Case');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

async function optimizeDatabase() {
  try {
    console.log('Starting database optimization...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare');
    console.log('Connected to database');

    // Create indexes for Case model
    console.log('\nOptimizing Case indexes...');
    await Case.collection.createIndex({ patientId: 1, status: 1 });
    await Case.collection.createIndex({ doctorId: 1, status: 1 });
    await Case.collection.createIndex({ createdAt: -1 });
    await Case.collection.createIndex({ patientId: 1, doctorId: 1, status: 1 });
    await Case.collection.createIndex({ status: 1, createdAt: -1 });
    await Case.collection.createIndex({ lastMessageAt: -1 });
    console.log('✓ Case indexes created');

    // Create indexes for Message model
    console.log('\nOptimizing Message indexes...');
    await Message.collection.createIndex({ caseId: 1, createdAt: 1 });
    await Message.collection.createIndex({ caseId: 1, sentAt: 1 });
    await Message.collection.createIndex({ senderId: 1, recipientId: 1 });
    await Message.collection.createIndex({ recipientId: 1, isRead: 1 });
    await Message.collection.createIndex({ caseId: 1, isRead: 1 });
    console.log('✓ Message indexes created');

    // Create indexes for Notification model
    console.log('\nOptimizing Notification indexes...');
    await Notification.collection.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
    await Notification.collection.createIndex({ userId: 1, createdAt: -1 });
    await Notification.collection.createIndex({ userId: 1, type: 1 });
    await Notification.collection.createIndex({ caseId: 1 });
    await Notification.collection.createIndex({ userId: 1, isRead: 1 });
    console.log('✓ Notification indexes created');

    // Create indexes for Doctor model
    console.log('\nOptimizing Doctor indexes...');
    await Doctor.collection.createIndex({ email: 1 }, { unique: true });
    await Doctor.collection.createIndex({ subscriptionStatus: 1 });
    await Doctor.collection.createIndex({ specializations: 1 });
    await Doctor.collection.createIndex({ rating: -1 });
    await Doctor.collection.createIndex({ subscriptionStatus: 1, rating: -1 });
    console.log('✓ Doctor indexes created');

    // Create indexes for Patient model
    console.log('\nOptimizing Patient indexes...');
    await Patient.collection.createIndex({ email: 1 }, { unique: true });
    await Patient.collection.createIndex({ bloodGroup: 1 });
    console.log('✓ Patient indexes created');

    // Get index information
    console.log('\n=== Index Summary ===');
    
    const caseIndexes = await Case.collection.indexes();
    console.log(`\nCase indexes (${caseIndexes.length}):`);
    caseIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    const messageIndexes = await Message.collection.indexes();
    console.log(`\nMessage indexes (${messageIndexes.length}):`);
    messageIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    const notificationIndexes = await Notification.collection.indexes();
    console.log(`\nNotification indexes (${notificationIndexes.length}):`);
    notificationIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Get collection stats
    console.log('\n=== Collection Statistics ===');
    
    const caseStats = await Case.collection.stats();
    console.log(`\nCase collection:`);
    console.log(`  - Documents: ${caseStats.count}`);
    console.log(`  - Size: ${(caseStats.size / 1024).toFixed(2)} KB`);
    console.log(`  - Indexes: ${caseStats.nindexes}`);

    const messageStats = await Message.collection.stats();
    console.log(`\nMessage collection:`);
    console.log(`  - Documents: ${messageStats.count}`);
    console.log(`  - Size: ${(messageStats.size / 1024).toFixed(2)} KB`);
    console.log(`  - Indexes: ${messageStats.nindexes}`);

    const notificationStats = await Notification.collection.stats();
    console.log(`\nNotification collection:`);
    console.log(`  - Documents: ${notificationStats.count}`);
    console.log(`  - Size: ${(notificationStats.size / 1024).toFixed(2)} KB`);
    console.log(`  - Indexes: ${notificationStats.nindexes}`);

    console.log('\n✓ Database optimization complete!');
    
  } catch (error) {
    console.error('Error optimizing database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run optimization
if (require.main === module) {
  optimizeDatabase();
}

module.exports = optimizeDatabase;
