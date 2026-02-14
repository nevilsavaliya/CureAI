const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/healthcare-platform').then(async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections in healthcare-platform:\n');
  
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count} documents`);
  }
  
  await mongoose.disconnect();
}).catch(err => console.error('Error:', err));
