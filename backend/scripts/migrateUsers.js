require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const migrateUsers = async () => {
  try {
    console.log('Starting user data migration...\n');

    // Drop problematic indexes if they exist
    try {
      await Patient.collection.dropIndex('userId_1');
      console.log('✓ Dropped old userId index from patients collection');
    } catch (error) {
      // Index doesn't exist, that's fine
    }

    try {
      await Doctor.collection.dropIndex('userId_1');
      console.log('✓ Dropped old userId index from doctors collection');
    } catch (error) {
      // Index doesn't exist, that's fine
    }

    try {
      await Admin.collection.dropIndex('userId_1');
      console.log('✓ Dropped old userId index from admins collection');
    } catch (error) {
      // Index doesn't exist, that's fine
    }

    console.log('');

    // Check if User collection exists and has data
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in User collection`);

    if (userCount === 0) {
      console.log('No users to migrate. User collection is empty.');
      
      // Check if admin already exists in Admin collection
      const adminExists = await Admin.findOne({ email: 'admin@gmail.com' });
      if (!adminExists) {
        console.log('\nCreating hardcoded admin user...');
        await Admin.create({
          name: 'Admin User',
          email: 'admin@gmail.com',
          password: 'admin@123'
        });
        console.log('✓ Created admin user: admin@gmail.com / admin@123');
      } else {
        console.log('✓ Admin user already exists');
      }
      
      console.log('\nMigration complete!');
      process.exit(0);
      return;
    }

    // Fetch all users
    const users = await User.find({});
    
    let patientsCreated = 0;
    let doctorsCreated = 0;
    let adminsCreated = 0;
    let skipped = 0;

    console.log('\nMigrating users to separate collections...\n');

    for (const user of users) {
      try {
        if (user.role === 'patient') {
          // Check if patient already exists
          const existingPatient = await Patient.findOne({ email: user.email });
          if (existingPatient) {
            console.log(`⊘ Skipped patient: ${user.email} (already exists)`);
            skipped++;
            continue;
          }

          // Create patient record
          await Patient.create({
            name: user.name,
            email: user.email,
            password: user.password, // Already hashed
            dateOfBirth: user.dateOfBirth || new Date('1990-01-01'),
            bloodGroup: user.bloodGroup || 'O+',
            gender: user.gender,
            contactNumber: user.contactNumber,
            address: user.address,
            medicalHistory: user.medicalHistory,
            allergies: user.allergies || [],
            lastLogin: user.lastLogin,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          });
          console.log(`✓ Migrated patient: ${user.email}`);
          patientsCreated++;

        } else if (user.role === 'doctor') {
          // Check if doctor already exists
          const existingDoctor = await Doctor.findOne({ email: user.email });
          if (existingDoctor) {
            console.log(`⊘ Skipped doctor: ${user.email} (already exists)`);
            skipped++;
            continue;
          }

          // Create doctor record
          await Doctor.create({
            name: user.name,
            email: user.email,
            password: user.password, // Already hashed
            dateOfBirth: user.dateOfBirth || new Date('1980-01-01'),
            degree: user.degree || 'MBBS',
            speciality: user.speciality || 'General Medicine',
            experienceYears: user.experienceYears || 5,
            contactNumber: user.contactNumber,
            clinicAddress: user.clinicAddress,
            licenseNumber: user.licenseNumber,
            rating: user.rating || 0,
            totalReviews: user.totalReviews || 0,
            subscriptionStatus: user.subscriptionStatus || 'pending',
            subscriptionStartDate: user.subscriptionStartDate,
            subscriptionExpiryDate: user.subscriptionExpiryDate,
            paymentInfo: user.paymentInfo,
            lastLogin: user.lastLogin,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          });
          console.log(`✓ Migrated doctor: ${user.email}`);
          doctorsCreated++;

        } else if (user.role === 'admin') {
          // Check if admin already exists
          const existingAdmin = await Admin.findOne({ email: user.email });
          if (existingAdmin) {
            console.log(`⊘ Skipped admin: ${user.email} (already exists)`);
            skipped++;
            continue;
          }

          // Create admin record
          await Admin.create({
            name: user.name,
            email: user.email,
            password: user.password, // Already hashed
            lastLogin: user.lastLogin,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          });
          console.log(`✓ Migrated admin: ${user.email}`);
          adminsCreated++;
        }
      } catch (error) {
        console.error(`✗ Error migrating user ${user.email}:`, error.message);
      }
    }

    // Create hardcoded admin if it doesn't exist
    const adminExists = await Admin.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      console.log('\nCreating hardcoded admin user...');
      await Admin.create({
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: 'admin@123'
      });
      console.log('✓ Created admin user: admin@gmail.com / admin@123');
      adminsCreated++;
    } else {
      console.log('\n✓ Hardcoded admin user already exists');
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Patients created: ${patientsCreated}`);
    console.log(`Doctors created: ${doctorsCreated}`);
    console.log(`Admins created: ${adminsCreated}`);
    console.log(`Skipped (already exist): ${skipped}`);
    console.log(`Total processed: ${users.length}`);
    console.log('========================\n');

    // Ask user if they want to delete the old User collection
    console.log('IMPORTANT: The User collection still exists with old data.');
    console.log('To remove it, run: db.users.drop() in MongoDB shell');
    console.log('Or manually delete it from your database.\n');

    console.log('Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

connectDB().then(() => migrateUsers());
