/**
 * Database Optimization Utilities
 * Provides utilities for optimizing database queries and adding indexes
 */

const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const Case = require('../../models/Case');
const Consultation = require('../../models/Consultation');
const Message = require('../../models/Message');
const Notification = require('../../models/Notification');
const Hospital = require('../../models/Hospital');
const Subscription = require('../../models/Subscription');
const Symptom = require('../../models/Symptom');
const Feedback = require('../../models/Feedback');

/**
 * Ensure all indexes are created for optimal query performance
 * This should be run during application startup or deployment
 */
async function ensureIndexes() {
  try {
    console.log('Creating database indexes...');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isActive: 1 });
    await User.collection.createIndex({ role: 1, isActive: 1 });
    
    // Doctor indexes
    await Doctor.collection.createIndex({ email: 1 }, { unique: true });
    await Doctor.collection.createIndex({ specializations: 1 });
    await Doctor.collection.createIndex({ subscriptionStatus: 1 });
    await Doctor.collection.createIndex({ isActive: 1, subscriptionStatus: 1 });
    await Doctor.collection.createIndex({ rating: -1 });
    
    // Patient indexes
    await Patient.collection.createIndex({ email: 1 }, { unique: true });
    await Patient.collection.createIndex({ isActive: 1 });
    
    // Case indexes (most are already in model, but ensure they exist)
    await Case.collection.createIndex({ patientId: 1 });
    await Case.collection.createIndex({ doctorId: 1 });
    await Case.collection.createIndex({ status: 1 });
    await Case.collection.createIndex({ patientId: 1, status: 1 });
    await Case.collection.createIndex({ doctorId: 1, status: 1 });
    await Case.collection.createIndex({ createdAt: -1 });
    await Case.collection.createIndex({ patientId: 1, doctorId: 1, status: 1 });
    await Case.collection.createIndex({ symptomConversationId: 1 });
    await Case.collection.createIndex({ lastMessageAt: -1 });
    
    // Consultation indexes
    await Consultation.collection.createIndex({ patientId: 1 });
    await Consultation.collection.createIndex({ doctorId: 1 });
    await Consultation.collection.createIndex({ status: 1 });
    await Consultation.collection.createIndex({ scheduledDate: 1 });
    await Consultation.collection.createIndex({ doctorId: 1, scheduledDate: 1 });
    
    // Message indexes
    await Message.collection.createIndex({ caseId: 1 });
    await Message.collection.createIndex({ senderId: 1, recipientId: 1 });
    await Message.collection.createIndex({ sentAt: -1 });
    await Message.collection.createIndex({ recipientId: 1, recipientModel: 1 });
    await Message.collection.createIndex({ caseId: 1, createdAt: 1 });
    await Message.collection.createIndex({ caseId: 1, sentAt: 1 });
    await Message.collection.createIndex({ recipientId: 1, isRead: 1 });
    await Message.collection.createIndex({ contentHash: 1 });
    
    // Notification indexes
    await Notification.collection.createIndex({ userId: 1 });
    await Notification.collection.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
    await Notification.collection.createIndex({ userId: 1, createdAt: -1 });
    await Notification.collection.createIndex({ userId: 1, type: 1 });
    await Notification.collection.createIndex({ caseId: 1 });
    await Notification.collection.createIndex({ isRead: 1 });
    
    // Hospital indexes
    await Hospital.collection.createIndex({ email: 1 }, { unique: true });
    await Hospital.collection.createIndex({ registrationNumber: 1 }, { unique: true });
    await Hospital.collection.createIndex({ apiKey: 1 }, { unique: true, sparse: true });
    await Hospital.collection.createIndex({ verificationStatus: 1 });
    await Hospital.collection.createIndex({ isActive: 1 });
    await Hospital.collection.createIndex({ verificationStatus: 1, isActive: 1 });
    
    // Subscription indexes
    await Subscription.collection.createIndex({ doctorId: 1 }, { unique: true });
    await Subscription.collection.createIndex({ isActive: 1 });
    await Subscription.collection.createIndex({ expiryDate: 1 });
    await Subscription.collection.createIndex({ isActive: 1, expiryDate: 1 });
    
    // Symptom indexes
    await Symptom.collection.createIndex({ patientId: 1 });
    await Symptom.collection.createIndex({ submittedAt: -1 });
    await Symptom.collection.createIndex({ patientId: 1, submittedAt: -1 });
    
    // Feedback indexes
    await Feedback.collection.createIndex({ consultationId: 1, userRole: 1 });
    await Feedback.collection.createIndex({ userId: 1 });
    await Feedback.collection.createIndex({ submittedAt: -1 });
    await Feedback.collection.createIndex({ rating: 1 });
    
    console.log('Database indexes created successfully');
    return true;
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

/**
 * Get index information for all collections
 * Useful for debugging and monitoring
 */
async function getIndexInfo() {
  const models = [
    { name: 'User', model: User },
    { name: 'Doctor', model: Doctor },
    { name: 'Patient', model: Patient },
    { name: 'Case', model: Case },
    { name: 'Consultation', model: Consultation },
    { name: 'Message', model: Message },
    { name: 'Notification', model: Notification },
    { name: 'Hospital', model: Hospital },
    { name: 'Subscription', model: Subscription },
    { name: 'Symptom', model: Symptom },
    { name: 'Feedback', model: Feedback }
  ];
  
  const indexInfo = {};
  
  for (const { name, model } of models) {
    try {
      const indexes = await model.collection.getIndexes();
      indexInfo[name] = indexes;
    } catch (error) {
      console.error(`Error getting indexes for ${name}:`, error);
      indexInfo[name] = { error: error.message };
    }
  }
  
  return indexInfo;
}

/**
 * Analyze slow queries and provide optimization suggestions
 * This is a placeholder for future implementation with MongoDB profiler
 */
async function analyzeSlowQueries() {
  // This would integrate with MongoDB's profiler to identify slow queries
  // For now, return a placeholder
  return {
    message: 'Query analysis requires MongoDB profiler to be enabled',
    recommendation: 'Enable profiling with: db.setProfilingLevel(1, { slowms: 100 })'
  };
}

/**
 * Query optimization helpers
 */
const QueryOptimization = {
  /**
   * Use lean queries for read-only operations
   * Lean queries return plain JavaScript objects instead of Mongoose documents
   * This is faster and uses less memory
   */
  useLean: true,
  
  /**
   * Use projection to select only needed fields
   * This reduces data transfer and memory usage
   */
  selectFields: (fields) => {
    return fields.join(' ');
  },
  
  /**
   * Use aggregation pipelines for complex queries
   * Aggregation is more efficient than multiple queries
   */
  buildAggregationPipeline: (stages) => {
    return stages;
  },
  
  /**
   * Batch operations for better performance
   * Use bulkWrite instead of multiple individual operations
   */
  batchSize: 1000
};

module.exports = {
  ensureIndexes,
  getIndexInfo,
  analyzeSlowQueries,
  QueryOptimization
};
