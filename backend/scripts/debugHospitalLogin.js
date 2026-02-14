#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');

async function debugHospitalLogin() {
    try {
        console.log('🔍 Debugging Hospital Login Issues');
        console.log('==================================');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        // Check if there are any hospitals in the database
        const totalHospitals = await Hospital.countDocuments();
        console.log(`📊 Total hospitals in database: ${totalHospitals}`);

        if (totalHospitals === 0) {
            console.log('❌ No hospitals found in database. You need to register a hospital first.');
            return;
        }

        // Get all hospitals and their status
        const hospitals = await Hospital.find({}, {
            name: 1,
            hospitalName: 1,
            email: 1,
            verificationStatus: 1,
            createdAt: 1,
            apiKey: 1
        }).sort({ createdAt: -1 });

        console.log('\n🏥 Hospitals in database:');
        hospitals.forEach((hospital, index) => {
            console.log(`\n   ${index + 1}. ${hospital.hospitalName}`);
            console.log(`      Contact: ${hospital.name}`);
            console.log(`      Email: ${hospital.email}`);
            console.log(`      Status: ${hospital.verificationStatus}`);
            console.log(`      API Key: ${hospital.apiKey ? 'Generated' : 'Not generated'}`);
            console.log(`      Created: ${hospital.createdAt.toLocaleDateString()}`);
        });

        // Check verification status breakdown
        const statusCounts = await Hospital.aggregate([
            {
                $group: {
                    _id: '$verificationStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📈 Hospital Status Breakdown:');
        statusCounts.forEach(status => {
            console.log(`   ${status._id}: ${status.count} hospitals`);
        });

        // Check if there are any verified hospitals
        const verifiedHospitals = await Hospital.find({ verificationStatus: 'verified' });

        if (verifiedHospitals.length === 0) {
            console.log('\n⚠️  ISSUE FOUND: No verified hospitals!');
            console.log('   - Hospitals must be verified by admin before they can login');
            console.log('   - Check the admin panel to verify pending hospitals');

            const pendingHospitals = await Hospital.find({ verificationStatus: 'pending' });
            if (pendingHospitals.length > 0) {
                console.log(`\n📋 ${pendingHospitals.length} hospitals are pending verification:`);
                pendingHospitals.forEach((hospital, index) => {
                    console.log(`   ${index + 1}. ${hospital.hospitalName} (${hospital.email})`);
                });
            }
        } else {
            console.log(`\n✅ ${verifiedHospitals.length} verified hospitals can login:`);
            verifiedHospitals.forEach((hospital, index) => {
                console.log(`   ${index + 1}. ${hospital.hospitalName} (${hospital.email})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
    }
}

debugHospitalLogin();