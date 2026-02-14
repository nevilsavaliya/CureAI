const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/healthcare-platform').then(async () => {
  const conversations = await mongoose.connection.db.collection('symptomconversations').find({}).toArray();
  
  console.log('Symptom Conversations:\n');
  conversations.forEach(conv => {
    console.log('Conversation ID:', conv._id);
    console.log('Patient ID:', conv.patientId);
    console.log('Initial Symptom:', conv.initialSymptom);
    console.log('Status:', conv.status);
    console.log('Extracted Symptoms:', conv.extractedSymptoms);
    console.log('\n');
  });
  
  const predictions = await mongoose.connection.db.collection('predictions').find({}).toArray();
  console.log('Predictions:\n');
  predictions.forEach(pred => {
    console.log('Conversation ID:', pred.conversationId);
    console.log('Predictions:', JSON.stringify(pred.predictions, null, 2));
    console.log('\n');
  });
  
  await mongoose.disconnect();
}).catch(err => console.error('Error:', err));
