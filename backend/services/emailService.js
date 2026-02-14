const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Check if email is configured
    this.isConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && 
                        process.env.EMAIL_USER !== 'your-email@gmail.com';
    
    if (this.isConfigured) {
      // Determine SMTP provider (default to Gmail)
      const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
      
      // SMTP configurations for different providers
      const smtpConfigs = {
        gmail: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true
        },
        sendgrid: {
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false
        },
        mailgun: {
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false
        },
        ses: {
          host: process.env.SES_SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
          port: 587,
          secure: false
        },
        custom: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true'
        }
      };

      const config = smtpConfigs[emailProvider] || smtpConfigs.gmail;

      // Create transporter
      this.transporter = nodemailer.createTransport({
        ...config,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 30000, // Increased timeout for cloud servers
        socketTimeout: 30000,
        greetingTimeout: 30000,
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email transporter verification failed:', error.message);
        } else {
          console.log('✅ Email server is ready to send messages');
        }
      });
    } else {
      console.log('⚠️  Email not configured - using console logging for OTPs');
    }
  }

  // Send OTP email (for password reset)
  async sendOTP(email, otp) {
    // If email not configured, just log to console for testing
    if (!this.isConfigured) {
      console.log('\n=================================');
      console.log('📧 OTP EMAIL (Console Mode)');
      console.log('=================================');
      console.log(`To: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`Expires: 10 minutes`);
      console.log('=================================\n');
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'Healthcare Platform <noreply@healthcare.com>',
      to: email,
      subject: 'Password Reset OTP - Healthcare Platform',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Password Reset Request</h2>
          <p>You have requested to reset your password. Use the OTP below to proceed:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #667eea; font-size: 36px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">Healthcare Platform - Your Health, Our Priority</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending OTP email:', error.message);
      return false;
    }
  }

  // Send Signup Verification OTP email
  async sendSignupOTP(email, otp) {
    // If email not configured, just log to console for testing
    if (!this.isConfigured) {
      console.log('\n=================================');
      console.log('📧 SIGNUP OTP EMAIL (Console Mode)');
      console.log('=================================');
      console.log(`To: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`Expires: 10 minutes`);
      console.log('=================================\n');
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'Healthcare Platform <noreply@healthcare.com>',
      to: email,
      subject: 'Email Verification OTP - Healthcare Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🏥 Healthcare Platform</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Your Health, Our Priority</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for signing up! To complete your registration, please verify your email address using the OTP below:
              </p>
              
              <!-- OTP Box -->
              <div style="background: #f0f4ff; padding: 30px; text-align: center; margin: 30px 0; border-radius: 10px; border: 3px solid #667eea; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);">
                <p style="color: #667eea; margin: 0 0 10px 0; font-size: 14px; font-weight: 600; letter-spacing: 1px;">YOUR VERIFICATION CODE</p>
                <h1 style="color: #667eea; font-size: 48px; margin: 0; letter-spacing: 8px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">${otp}</h1>
              </div>
              
              <!-- Instructions -->
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
                  <strong>📌 Important:</strong><br>
                  • This OTP will expire in <strong>10 minutes</strong><br>
                  • Enter this code on the verification page to complete your signup<br>
                  • Do not share this code with anyone
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you didn't request this verification, please ignore this email or contact our support team.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">
                Healthcare Platform - Your Health, Our Priority
              </p>
              <p style="color: #999; font-size: 11px; margin: 0;">
                This is an automated email. Please do not reply.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Signup OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending signup OTP email:', error.message);
      return false;
    }
  }

  // Send consultation confirmation email
  async sendConsultationEmail(email, consultationDetails, recipientRole = 'patient') {
    const { doctorName, patientName, date, time, videoLink, consultationId } = consultationDetails;
    
    // If email not configured, just log to console for testing
    if (!this.isConfigured) {
      console.log('\n=================================');
      console.log(`📧 CONSULTATION EMAIL (Console Mode) - ${recipientRole.toUpperCase()}`);
      console.log('=================================');
      console.log(`To: ${email}`);
      console.log(`Doctor: ${doctorName}`);
      console.log(`Patient: ${patientName}`);
      console.log(`Date: ${new Date(date).toLocaleDateString()}`);
      console.log(`Time: ${time}`);
      console.log(`Video Link: ${videoLink}`);
      console.log(`Consultation ID: ${consultationId}`);
      console.log('=================================\n');
      return true;
    }

    const greeting = recipientRole === 'doctor' 
      ? `Dear Dr. ${doctorName},` 
      : `Dear ${patientName},`;
    
    const message = recipientRole === 'doctor'
      ? `You have successfully scheduled a consultation with ${patientName}.`
      : `Your consultation with Dr. ${doctorName} has been successfully booked.`;

    // Generate calendar event (iCalendar format)
    const calendarEvent = this.generateCalendarEvent({
      doctorName,
      patientName,
      date,
      time,
      videoLink,
      recipientRole
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'Healthcare Platform <noreply@healthcare.com>',
      to: email,
      subject: '🎥 Video Consultation Scheduled - Healthcare Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Video Consultation Scheduled</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                🏥 Healthcare Platform
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                Your Health, Our Priority
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; background: #f9fafb;">
              <!-- Success Badge -->
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                  ✓ Consultation Confirmed
                </div>
              </div>

              <h2 style="color: #11998e; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                Video Consultation Scheduled!
              </h2>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 10px 0;">${greeting}</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 30px 0;">${message}</p>
              
              <!-- Consultation Details Card -->
              <div style="background: white; padding: 30px; margin: 0 0 30px 0; border-radius: 12px; border-left: 5px solid #11998e; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                <h3 style="margin: 0 0 20px 0; color: #11998e; font-size: 18px; font-weight: 600;">
                  📅 Consultation Details
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px; width: 35%;">
                      👨‍⚕️ Doctor:
                    </td>
                    <td style="padding: 12px 0; color: #111827; font-size: 15px; font-weight: 500;">
                      Dr. ${doctorName}
                    </td>
                  </tr>
                  <tr style="border-top: 1px solid #f3f4f6;">
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px;">
                      👤 Patient:
                    </td>
                    <td style="padding: 12px 0; color: #111827; font-size: 15px; font-weight: 500;">
                      ${patientName}
                    </td>
                  </tr>
                  <tr style="border-top: 1px solid #f3f4f6;">
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px;">
                      📆 Date:
                    </td>
                    <td style="padding: 12px 0; color: #111827; font-size: 15px; font-weight: 500;">
                      ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                  </tr>
                  <tr style="border-top: 1px solid #f3f4f6;">
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px;">
                      🕐 Time:
                    </td>
                    <td style="padding: 12px 0; color: #111827; font-size: 15px; font-weight: 500;">
                      ${time}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Primary CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${videoLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 18px 50px; 
                          text-decoration: none; 
                          border-radius: 50px; 
                          display: inline-block; 
                          font-weight: 700; 
                          font-size: 17px;
                          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                          letter-spacing: 0.3px;">
                  🎥 Join Video Consultation
                </a>
                <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 13px;">
                  Click the button above to join the video call
                </p>
              </div>

              <!-- Video Link Box -->
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 25px 0; border: 1px dashed #d1d5db;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 600;">
                  🔗 Direct Video Link:
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${videoLink}" style="color: #667eea; text-decoration: none; font-size: 14px;">
                    ${videoLink}
                  </a>
                </p>
              </div>

              <!-- Important Notice -->
              <div style="background: #dbeafe; padding: 20px; border-radius: 10px; border-left: 4px solid #3b82f6; margin: 0 0 20px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  <strong style="font-size: 15px;">📌 Important:</strong><br>
                  • Join the consultation 5 minutes before the scheduled time<br>
                  • Ensure you have a stable internet connection<br>
                  • Test your camera and microphone beforehand<br>
                  • Use headphones for better audio quality
                </p>
              </div>

              <!-- Helpful Tip -->
              <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b; margin: 0 0 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong style="font-size: 15px;">💡 Helpful Tips:</strong><br>
                  • The video link remains active throughout the consultation<br>
                  • You can rejoin if disconnected<br>
                  • Use Chrome or Firefox for best experience<br>
                  • Keep your medical records handy
                </p>
              </div>

              <!-- Technical Requirements -->
              <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 0 0 20px 0;">
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">
                  💻 Technical Requirements:
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                  • Modern web browser (Chrome, Firefox, Safari, Edge)<br>
                  • Working webcam and microphone<br>
                  • Stable internet connection (minimum 2 Mbps)<br>
                  • No additional software installation required
                </p>
              </div>

              <!-- Support Section -->
              <div style="text-align: center; padding: 20px 0; border-top: 2px solid #e5e7eb; margin-top: 30px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                  Need help? Having technical issues?
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">
                  Contact Support: support@healthcare.com
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #1f2937; padding: 30px; text-align: center; border-radius: 0 0 10px 10px;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px 0; font-weight: 500;">
                Healthcare Platform - Your Health, Our Priority
              </p>
              <p style="color: #6b7280; font-size: 11px; margin: 0 0 15px 0;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="color: #6b7280; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} Healthcare Platform. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Attach calendar event
      icalEvent: {
        filename: 'consultation.ics',
        method: 'request',
        content: calendarEvent
      }
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Consultation email sent successfully to ${email} (${recipientRole})`);
      console.log(`   Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send consultation email to ${email} (${recipientRole})`);
      console.error(`   Error: ${error.message}`);
      return false; // Don't throw, just return false
    }
  }

  // Generate iCalendar event for calendar integration
  generateCalendarEvent(details) {
    const { doctorName, patientName, date, time, videoLink, recipientRole } = details;
    
    // Parse date and time
    const consultationDate = new Date(date);
    const [hours, minutes] = time.split(':');
    consultationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Calculate end time (assume 30 minutes consultation)
    const endDate = new Date(consultationDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    
    // Format dates for iCalendar (YYYYMMDDTHHMMSS)
    const formatDate = (d) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const summary = recipientRole === 'doctor' 
      ? `Video Consultation with ${patientName}`
      : `Video Consultation with Dr. ${doctorName}`;
    
    const description = `Healthcare Platform Video Consultation\\n\\n` +
      `Doctor: Dr. ${doctorName}\\n` +
      `Patient: ${patientName}\\n` +
      `Date: ${consultationDate.toLocaleDateString()}\\n` +
      `Time: ${time}\\n\\n` +
      `Join Video Call: ${videoLink}\\n\\n` +
      `Please join 5 minutes before the scheduled time.`;
    
    // Generate iCalendar format
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Healthcare Platform//Video Consultation//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:consultation-${Date.now()}@healthcare.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(consultationDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${videoLink}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Video consultation in 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    return icsContent;
  }

  // Send Hospital Verification Email with API Credentials
  async sendHospitalVerificationEmail(email, hospitalData) {
    const { hospitalName, apiKey, apiSecret } = hospitalData;
    
    // If email not configured, just log to console
    if (!this.isConfigured) {
      console.log('\n=================================');
      console.log('📧 HOSPITAL VERIFICATION EMAIL (Console Mode)');
      console.log('=================================');
      console.log(`To: ${email}`);
      console.log(`Hospital: ${hospitalName}`);
      console.log(`API Key: ${apiKey}`);
      console.log(`API Secret: ${apiSecret}`);
      console.log('=================================\n');
      return true;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'Healthcare Platform <noreply@healthcare.com>',
      to: email,
      subject: '✅ Hospital Verified - API Credentials - Healthcare Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Hospital Verification Successful</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🏥 Hospital Verified!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your API Access is Now Active</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                Dear ${hospitalName} Team,
              </p>
              
              <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 25px 0;">
                Congratulations! Your hospital has been successfully verified by our admin team. 
                You now have access to our Patient Data API for emergency medical information retrieval.
              </p>
              
              <!-- API Credentials Box -->
              <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 10px; padding: 25px; margin: 0 0 25px 0;">
                <h2 style="color: #047857; margin: 0 0 20px 0; font-size: 20px;">🔑 Your API Credentials</h2>
                
                <div style="margin-bottom: 15px;">
                  <strong style="color: #047857; display: block; margin-bottom: 5px;">API Key:</strong>
                  <code style="background: white; padding: 10px; display: block; border-radius: 5px; color: #333; font-size: 13px; word-break: break-all;">${apiKey}</code>
                </div>
                
                <div>
                  <strong style="color: #047857; display: block; margin-bottom: 5px;">API Secret:</strong>
                  <code style="background: white; padding: 10px; display: block; border-radius: 5px; color: #333; font-size: 13px; word-break: break-all;">${apiSecret}</code>
                </div>
              </div>
              
              <!-- Important Notice -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 25px 0; border-radius: 5px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important:</strong> Keep these credentials secure. Never share them publicly or commit them to version control.
                </p>
              </div>
              
              <!-- API Usage -->
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📡 API Usage</h3>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
                <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;"><strong>Endpoint:</strong></p>
                <code style="background: white; padding: 10px; display: block; border-radius: 5px; color: #333; font-size: 13px; margin-bottom: 15px;">POST /api/hospitals/api/patient-data</code>
                
                <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;"><strong>Request Body:</strong></p>
                <pre style="background: white; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; margin: 0;">{
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "patientEmail": "patient@example.com"
}</pre>
              </div>
              
              <!-- What You Can Access -->
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📋 Patient Data Available</h3>
              <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
                <li>Blood Group & Allergies</li>
                <li>Emergency Contact Information</li>
                <li>Medical History & Chronic Conditions</li>
                <li>Current Medications</li>
                <li>Past Surgeries & Procedures</li>
                <li>Recent Symptoms (extracted from chats)</li>
                <li>Vital Signs History</li>
                <li>Lab Results</li>
                <li>Recent Consultation History</li>
              </ul>
              
              <!-- Support -->
              <div style="text-align: center; padding: 20px 0; border-top: 2px solid #e5e7eb; margin-top: 30px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                  Need help? Contact our support team
                </p>
                <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">
                  support@healthcare.com
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Healthcare Platform. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Hospital verification email sent to ${email}`);
      console.log(`   Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send hospital verification email to ${email}`);
      console.error(`   Error: ${error.message}`);
      return false;
    }
  }
}

module.exports = new EmailService();
