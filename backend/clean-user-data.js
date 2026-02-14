const mongoose = require('mongoose');

async function cleanUserData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/healthcare-platform');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Collections to clean (all user-related data)
    const collectionsToClean = [
      'patients',
      'doctors',
      'users',
      'cases',
      'consultations',
      'messages',
      'notifications',
      'symptoms',
      'symptomconversations',
      'predictions',
      'feedbacks',
      'subscriptions',
      'otps',
      'payments',
      'auditlogs',
      'removedusers',
      'hospitals'
    ];

    console.log('🗑️  Cleaning user-related collections...\n');

    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`✅ Deleted ${result.deletedCount} documents from ${collectionName}`);
        } else {
          console.log(`⏭️  ${collectionName} is already empty`);
        }
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} does not exist or error: ${error.message}`);
      }
    }

    // Verify admin collection is intact
    const adminCount = await db.collection('admins').countDocuments();
    console.log(`\n✅ Admin collection preserved: ${adminCount} admin(s) remaining`);

    console.log('\n✅ Database cleanup completed successfully!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanUserData();
