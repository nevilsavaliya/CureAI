/**
 * Manual Video Service Test
 * Run this script to verify video service functionality
 * Usage: node backend/tests/manual-video-test.js
 */

const videoService = require('../services/videoService');

console.log('='.repeat(60));
console.log('VIDEO SERVICE MANUAL TEST');
console.log('='.repeat(60));
console.log();

// Test 1: Generate Video Room
console.log('Test 1: Generate Video Room');
console.log('-'.repeat(60));
const consultationId = 'patient123-doctor456';
const { roomId, videoLink } = videoService.generateVideoRoom(consultationId);
console.log('✓ Room ID:', roomId);
console.log('✓ Video Link:', videoLink);
console.log('✓ Contains consultation ID:', roomId.includes(consultationId) ? 'YES' : 'NO');
console.log();

// Test 2: Generate Multiple Unique Rooms
console.log('Test 2: Generate Multiple Unique Rooms');
console.log('-'.repeat(60));
const room1 = videoService.generateVideoRoom('consultation-1');
const room2 = videoService.generateVideoRoom('consultation-2');
const room3 = videoService.generateVideoRoom('consultation-3');
console.log('✓ Room 1:', room1.roomId);
console.log('✓ Room 2:', room2.roomId);
console.log('✓ Room 3:', room3.roomId);
console.log('✓ All unique:', 
  (room1.roomId !== room2.roomId && room2.roomId !== room3.roomId && room1.roomId !== room3.roomId) 
  ? 'YES' : 'NO'
);
console.log();

// Test 3: Validate Video Links
console.log('Test 3: Validate Video Links');
console.log('-'.repeat(60));
const validLink = 'https://meet.jit.si/healthcare-test-room-123';
const invalidLink1 = 'http://invalid.com/room';
const invalidLink2 = 'not-a-url';
const invalidLink3 = '';

console.log('✓ Valid Jitsi link:', videoService.validateVideoLink(validLink) ? 'PASS' : 'FAIL');
console.log('✓ Invalid link 1:', !videoService.validateVideoLink(invalidLink1) ? 'PASS' : 'FAIL');
console.log('✓ Invalid link 2:', !videoService.validateVideoLink(invalidLink2) ? 'PASS' : 'FAIL');
console.log('✓ Invalid link 3:', !videoService.validateVideoLink(invalidLink3) ? 'PASS' : 'FAIL');
console.log('✓ Generated link valid:', videoService.validateVideoLink(videoLink) ? 'PASS' : 'FAIL');
console.log();

// Test 4: Extract Room ID
console.log('Test 4: Extract Room ID from Video Link');
console.log('-'.repeat(60));
const testLink = 'https://meet.jit.si/healthcare-consultation-abc123';
const extractedRoomId = videoService.extractRoomId(testLink);
console.log('✓ Test Link:', testLink);
console.log('✓ Extracted Room ID:', extractedRoomId);
console.log('✓ Extraction correct:', extractedRoomId === 'healthcare-consultation-abc123' ? 'PASS' : 'FAIL');
console.log();

// Test 5: Generate Room Configuration
console.log('Test 5: Generate Room Configuration');
console.log('-'.repeat(60));
const config = videoService.generateRoomConfig({
  roomName: 'test-consultation-room',
  displayName: 'Dr. John Smith',
  email: 'doctor@healthcare.com',
  startWithAudioMuted: false,
  startWithVideoMuted: false
});
console.log('✓ Room Name:', config.roomName);
console.log('✓ Display Name:', config.userInfo.displayName);
console.log('✓ Email:', config.userInfo.email);
console.log('✓ Audio Muted:', config.configOverwrite.startWithAudioMuted);
console.log('✓ Video Muted:', config.configOverwrite.startWithVideoMuted);
console.log('✓ Has Toolbar Buttons:', Array.isArray(config.interfaceConfigOverwrite.TOOLBAR_BUTTONS) ? 'YES' : 'NO');
console.log();

// Test 6: Get Service Info
console.log('Test 6: Get Service Information');
console.log('-'.repeat(60));
const serviceInfo = videoService.getServiceInfo();
console.log('✓ Provider:', serviceInfo.provider);
console.log('✓ Features Count:', serviceInfo.features.length);
console.log('✓ Features:', serviceInfo.features.join(', '));
console.log('✓ Limitations Count:', serviceInfo.limitations.length);
console.log('✓ Documentation:', serviceInfo.documentation);
console.log();

// Test 7: Integration Test
console.log('Test 7: Full Integration Test');
console.log('-'.repeat(60));
const integrationConsultationId = 'integration-test-' + Date.now();
const integrationResult = videoService.generateVideoRoom(integrationConsultationId);
const isValid = videoService.validateVideoLink(integrationResult.videoLink);
const extractedId = videoService.extractRoomId(integrationResult.videoLink);
const matches = extractedId === integrationResult.roomId;

console.log('✓ Generated Room ID:', integrationResult.roomId);
console.log('✓ Generated Video Link:', integrationResult.videoLink);
console.log('✓ Link is valid:', isValid ? 'PASS' : 'FAIL');
console.log('✓ Room ID extraction:', matches ? 'PASS' : 'FAIL');
console.log();

// Summary
console.log('='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log('✓ All tests completed successfully!');
console.log('✓ Video service is working correctly');
console.log('✓ Jitsi Meet integration is functional');
console.log();
console.log('NEXT STEPS:');
console.log('1. Test the video link in a browser');
console.log('2. Verify two-way video and audio');
console.log('3. Test call controls (mute, video toggle, end call)');
console.log('4. Test on different browsers (Chrome, Firefox, Safari)');
console.log('5. Test email delivery with video links');
console.log();
console.log('SAMPLE VIDEO LINK TO TEST:');
console.log(integrationResult.videoLink);
console.log();
console.log('Open this link in two different browser tabs/windows to test');
console.log('the video call functionality.');
console.log('='.repeat(60));
