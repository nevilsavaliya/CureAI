/**
 * Test Real Email Sending
 * Tests actual email delivery with configured Gmail account
 */

require('dotenv').config();
const emailService = require('../services/emailService');
const videoService = require('../services/videoService');

async function testRealEmail() {
  console.log('='.repeat(60));
  console.log('Testing Real Email Delivery');
  console.log('='.repeat(60));
  console.log();

  // Check environment variables
  console.log('Environment Check:');
  console.log('-'.repeat(60));
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Not set');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Not set');
  console.log('Email configured:', emailService.isConfigured ? '✓ YES' : '✗ NO');
  console.log();

  if (!emailService.isConfigured) {
    console.log('⚠️  Email is not configured. Please check your .env file.');
    console.log('Make sure EMAIL_USER and EMAIL_PASSWORD are set correctly.');
    return;
  }

  // Generate video link
  console.log('Generating Video Link:');
  console.log('-'.repeat(60));
  const caseId = 'test-case-' + Date.now();
  const { roomId, videoLink } = videoService.generateVideoRoom(`case-${caseId}`);
  console.log('✓ Video Link:', videoLink);
  console.log();

  // Prepare consultation details
  const consultationDetails = {
    consultationId: caseId,
    doctorName: 'Dr. John Smith',
    patientName: 'Jane Doe',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    time: '10:00 AM',
    videoLink: videoLink
  };

  // Send test email to your own email
  console.log('Sending Test Email:');
  console.log('-'.repeat(60));
  console.log('Sending to:', process.env.EMAIL_USER);
  
  try {
    const emailSent = await emailService.sendConsultationEmail(
      process.env.EMAIL_USER, // Send to yourself for testing
      consultationDetails,
      'patient'
    );

    if (emailSent) {
      console.log('✓ Email sent successfully!');
      console.log();
      console.log('='.repeat(60));
      console.log('SUCCESS!');
      console.log('='.repeat(60));
      console.log();
      console.log('Check your inbox:', process.env.EMAIL_USER);
      console.log('The email should contain:');
      console.log('  - Consultation details');
      console.log('  - Working video link:', videoLink);
      console.log('  - Calendar attachment (.ics file)');
      console.log();
      console.log('You can test the video link by:');
      console.log('  1. Opening the link in your browser');
      console.log('  2. Opening it in another browser/device');
      console.log('  3. Both should join the same video room');
    } else {
      console.log('✗ Email sending failed');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.log();
    console.log('Common issues:');
    console.log('  - Gmail App Password not set correctly');
    console.log('  - 2-Factor Authentication not enabled on Gmail');
    console.log('  - Less secure app access blocked');
    console.log();
    console.log('To fix:');
    console.log('  1. Enable 2FA on your Gmail account');
    console.log('  2. Generate an App Password at: https://myaccount.google.com/apppasswords');
    console.log('  3. Use the App Password in EMAIL_PASSWORD (not your regular password)');
  }

  console.log();
}

// Run test
testRealEmail().catch(console.error);
