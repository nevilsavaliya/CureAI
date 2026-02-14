#!/usr/bin/env node

const bcrypt = require('bcrypt');

async function testBcrypt() {
  try {
    console.log('🔍 Testing bcrypt functionality');
    console.log('==============================');
    
    const testPassword = 'TestPassword123!';
    console.log(`Test password: "${testPassword}"`);
    
    // Test hashing
    console.log('\n📋 Step 1: Testing password hashing...');
    const hash1 = await bcrypt.hash(testPassword, 10);
    console.log(`Hash 1: ${hash1}`);
    
    const hash2 = await bcrypt.hash(testPassword, 10);
    console.log(`Hash 2: ${hash2}`);
    
    // Test comparison
    console.log('\n📋 Step 2: Testing password comparison...');
    const match1 = await bcrypt.compare(testPassword, hash1);
    console.log(`Compare with hash1: ${match1 ? '✅' : '❌'}`);
    
    const match2 = await bcrypt.compare(testPassword, hash2);
    console.log(`Compare with hash2: ${match2 ? '✅' : '❌'}`);
    
    // Test with wrong password
    const wrongMatch = await bcrypt.compare('wrongpassword', hash1);
    console.log(`Compare wrong password: ${wrongMatch ? '❌ Should be false!' : '✅ Correctly false'}`);
    
    // Test bcrypt version
    console.log('\n📋 Step 3: bcrypt version info...');
    console.log(`bcrypt version: ${require('bcrypt/package.json').version}`);
    
    // Test synchronous version
    console.log('\n📋 Step 4: Testing synchronous bcrypt...');
    const syncHash = bcrypt.hashSync(testPassword, 10);
    const syncMatch = bcrypt.compareSync(testPassword, syncHash);
    console.log(`Sync hash: ${syncHash}`);
    console.log(`Sync compare: ${syncMatch ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ bcrypt test error:', error);
  }
}

testBcrypt();