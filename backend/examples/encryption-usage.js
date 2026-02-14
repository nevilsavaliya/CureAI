/**
 * Example usage of E2E encryption for messaging
 * This demonstrates how to use the encryption utilities
 */

const encryption = require('../utils/encryption');

// Example: Basic message encryption
async function exampleBasicEncryption() {
  console.log('📝 Basic Message Encryption Example');
  console.log('==================================\n');

  const message = "Patient reports chest pain and shortness of breath.";
  const patientId = "patient_12345";
  const doctorId = "doctor_67890";

  console.log(`Original message: "${message}"`);

  // Encrypt the message
  const encryptedData = encryption.encryptMessage(message, patientId, doctorId);
  console.log(`Encrypted: ${encryptedData.substring(0, 100)}...`);

  // Decrypt the message
  const decryptedMessage = encryption.decryptMessage(encryptedData, patientId, doctorId);
  console.log(`Decrypted: "${decryptedMessage}"`);

  console.log(`✅ Encryption successful: ${message === decryptedMessage}\n`);
}

// Example: Using with Message model
async function exampleDatabaseEncryption() {
  console.log('💾 Database Integration Example');
  console.log('==============================\n');

  // This would be used in your message controller
  const messageData = {
    senderId: "patient_12345",
    senderModel: "Patient",
    recipientId: "doctor_67890", 
    recipientModel: "Doctor",
    content: "I've been experiencing severe headaches for the past week."
  };

  console.log('Creating encrypted message in database...');
  console.log(`Original content: "${messageData.content}"`);

  // In your controller, you would use:
  // const message = await Message.createEncrypted(messageData);
  // const decryptedContent = message.getDecryptedContent();

  console.log('✅ Message would be encrypted in database');
  console.log('✅ Content would be decrypted when retrieved\n');
}

// Example: Conversation security
async function exampleConversationSecurity() {
  console.log('🔒 Conversation Security Example');
  console.log('================================\n');

  const patient1 = "patient_111";
  const patient2 = "patient_222";
  const doctor = "doctor_333";

  // Different conversations have different encryption
  const conv1Id = encryption.generateConversationId(patient1, doctor);
  const conv2Id = encryption.generateConversationId(patient2, doctor);

  console.log(`Patient1-Doctor conversation ID: ${conv1Id}`);
  console.log(`Patient2-Doctor conversation ID: ${conv2Id}`);
  console.log(`✅ Different conversations: ${conv1Id !== conv2Id}`);

  // Same conversation, different message order
  const conv3Id = encryption.generateConversationId(doctor, patient1);
  console.log(`Doctor-Patient1 conversation ID: ${conv3Id}`);
  console.log(`✅ Consistent conversation ID: ${conv1Id === conv3Id}\n`);
}

// Example: Security features
async function exampleSecurityFeatures() {
  console.log('🛡️  Security Features Example');
  console.log('=============================\n');

  const message = "Confidential medical information";
  const sender = "patient_123";
  const recipient = "doctor_456";

  // Same message encrypted twice produces different results
  const encrypted1 = encryption.encryptMessage(message, sender, recipient);
  const encrypted2 = encryption.encryptMessage(message, sender, recipient);

  console.log('Same message encrypted twice:');
  console.log(`Encryption 1: ${encrypted1.substring(0, 50)}...`);
  console.log(`Encryption 2: ${encrypted2.substring(0, 50)}...`);
  console.log(`✅ Different ciphertext: ${encrypted1 !== encrypted2}`);

  // Both decrypt to the same message
  const decrypted1 = encryption.decryptMessage(encrypted1, sender, recipient);
  const decrypted2 = encryption.decryptMessage(encrypted2, sender, recipient);

  console.log(`✅ Same plaintext: ${decrypted1 === decrypted2 && decrypted1 === message}\n`);
}

// Run all examples
async function runExamples() {
  console.log('🔐 E2E Encryption Usage Examples');
  console.log('=================================\n');

  await exampleBasicEncryption();
  await exampleDatabaseEncryption();
  await exampleConversationSecurity();
  await exampleSecurityFeatures();

  console.log('🎉 All examples completed successfully!');
}

// Export for use in other files
module.exports = {
  exampleBasicEncryption,
  exampleDatabaseEncryption,
  exampleConversationSecurity,
  exampleSecurityFeatures,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}