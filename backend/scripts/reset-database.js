/**
 * Reset Database Script
 * Deletes all data from MongoDB to start fresh
 * 
 * WARNING: This will permanently delete ALL data!
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const Case = require('../models/Case');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Consultation = require('../models/Consultation');
const OTP = require('../models/OTP');
const User = require('../models/User');

async function resetDatabase() {
    try {
        console.log('='.repeat(60));
        console.log('DATABASE RESET SCRIPT');
        console.log('='.repeat(60));
        console.log();
        console.log('⚠️  WARNING: This will delete ALL data from the database!');
        console.log();

        // Connect to database
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-platform';
        console.log('Connecting to:', dbUri);
        await mongoose.connect(dbUri);
        console.log('✓ Connected to database');
        console.log();

        // Get collection stats before deletion
        console.log('Current Database State:');
        console.log('-'.repeat(60));

        const collections = [
            { name: 'Patients', model: Patient },
            { name: 'Doctors', model: Doctor },
            { name: 'Admins', model: Admin },
            { name: 'Cases', model: Case },
            { name: 'Messages', model: Message },
            { name: 'Notifications', model: Notification },
            { name: 'Consultations', model: Consultation },
            { name: 'OTPs', model: OTP },
            { name: 'Users', model: User }
        ];

        for (const collection of collections) {
            try {
                const count = await collection.model.countDocuments();
                console.log(`  ${collection.name}: ${count} documents`);
            } catch (error) {
                console.log(`  ${collection.name}: Collection doesn't exist`);
            }
        }

        console.log();
        console.log('Deleting all data...');
        console.log('-'.repeat(60));

        // Delete all data from each collection
        let totalDeleted = 0;
        for (const collection of collections) {
            try {
                // IMPORTANT: Preserve admin account (admin@gmail.com)
                if (collection.name === 'Admins') {
                    const result = await collection.model.deleteMany({ email: { $ne: 'admin@gmail.com' } });
                    console.log(`  ✓ ${collection.name}: ${result.deletedCount} documents deleted (admin@gmail.com preserved)`);
                    totalDeleted += result.deletedCount;
                } else {
                    const result = await collection.model.deleteMany({});
                    console.log(`  ✓ ${collection.name}: ${result.deletedCount} documents deleted`);
                    totalDeleted += result.deletedCount;
                }
            } catch (error) {
                console.log(`  ⚠ ${collection.name}: ${error.message}`);
            }
        }

        console.log();
        console.log('='.repeat(60));
        console.log('DATABASE RESET COMPLETE!');
        console.log('='.repeat(60));
        console.log();
        console.log(`Total documents deleted: ${totalDeleted}`);
        console.log();
        console.log('The database is now empty and ready for fresh data.');
        console.log('You can now:');
        console.log('  1. Start the backend server: npm start');
        console.log('  2. Create new users via signup');
        console.log('  3. Test the application from scratch');
        console.log();

    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the reset
console.log();
console.log('Starting database reset in 3 seconds...');
console.log('Press Ctrl+C to cancel');
console.log();

setTimeout(() => {
    resetDatabase();
}, 3000);
