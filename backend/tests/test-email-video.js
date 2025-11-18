/**
 * Test Email and Video Link Generation
 * Tests that emails are sent with working video links
 */

const emailService = require('../services/emailService');
const videoService = require('../services/videoService');

async function testEmailAndVideo() {
  console.log('='.repeat(60));
  console.log('Testing Email and Video Link Generation');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Generate video link
  console.log('Test 1: Generate Video Link');
  console.log('-'.repeat(60));
  const caseId = 'test-case-123';
  const { roomId, videoLink } = videoService.generateVideoRoom(`case-${caseId}`);
  console.log('✓ Room ID:', roomId);
  console.log('✓ Video Link:', videoLink);
  console.log('✓ Link is valid:', videoService.validateVideoLink(videoLink) ? 'YES' : 'NO');
  console.log();

  // Test 2: Send consultation email
  console.log('Test 2: Send Consultation Email');
  console.log('-'.repeat(60));
  
  const consultationDetails = {
    consultationId: caseId,
    doctorName: 'Dr. John Smith',
    patientName: 'Jane Doe',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    time: '10:00 AM',
    videoLink: videoLink
  };

  try {
    // Send to patient
    const patientEmailSent = await emailService.sendConsultationEmail(
      'patient-test@example.com',
      consultationDetails,
      'patient'
    );
    console.log('✓ Patient email sent:', patientEmailSent ? 'YES' : 'NO');

    // Send to doctor
    const doctorEmailSent = await emailService.sendConsultationEmail(
      'doctor-test@example.com',
      consultationDetails,
      'doctor'
    );
    console.log('✓ Doctor email sent:', doctorEmailSent ? 'YES' : 'NO');
  } catch (error) {
    console.error('✗ Error sending emails:', error.message);
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Test Complete!');
  console.log('='.repeat(60));
  console.log();
  console.log('If email is configured, check your inbox for:');
  console.log('  - patient-test@example.com');
  console.log('  - doctor-test@example.com');
  console.log();
  console.log('The email should contain a working video link:');
  console.log(videoLink);
  console.log();
  console.log('You can test the video link by opening it in your browser.');
  console.log('It will open a Jitsi Meet room that both patient and doctor can join.');
}

// Run test
testEmailAndVideo().catch(console.error);
