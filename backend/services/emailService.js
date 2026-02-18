class EmailService {
  constructor() {
    // Check if MailerSend is configured
    this.isConfigured = process.env.MAILERSEND_API_KEY;

    if (this.isConfigured) {
      // Configure MailerSend with multiple sender addresses
      this.mailersendConfig = {
        apiKey: process.env.MAILERSEND_API_KEY,
        fromEmails: {
          otp: process.env.MAILERSEND_FROM_EMAIL_OTP || 'otp@nevil.engineer',
          apiCredentials: process.env.MAILERSEND_FROM_EMAIL_API_CREDENTIALS || 'api-credentials@nevil.engineer',
          videoCall: process.env.MAILERSEND_FROM_EMAIL_VIDEO_CALL || 'video-call@nevil.engineer',
          default: process.env.MAILERSEND_FROM_EMAIL_DEFAULT || 'no-reply@nevil.engineer'
        },
        fromName: process.env.MAILERSEND_FROM_NAME || 'CureAI App',
        apiUrl: 'https://api.mailersend.com/v1/email'
      };

      console.log('✅ MailerSend email service is ready');
      console.log('   📧 OTP emails from:', this.mailersendConfig.fromEmails.otp);
      console.log('   🔑 API credentials from:', this.mailersendConfig.fromEmails.apiCredentials);
      console.log('   📹 Video call emails from:', this.mailersendConfig.fromEmails.videoCall);
      console.log('   📨 Default emails from:', this.mailersendConfig.fromEmails.default);
    } else {
      console.log('⚠️  MailerSend not configured');
    }

    // Check if Gmail SMTP fallback is configured
    this.gmailConfigured = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
    
    if (this.gmailConfigured) {
      const nodemailer = require('nodemailer');
      
      // Configure Gmail SMTP transporter
      this.gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '') // Remove spaces from app password
        }
      });

      console.log('✅ Gmail SMTP fallback is ready');
      console.log('   📧 Gmail account:', process.env.GMAIL_USER);
    } else {
      console.log('⚠️  Gmail SMTP fallback not configured');
    }

    if (!this.isConfigured && !this.gmailConfigured) {
      console.log('⚠️  No email service configured - using console logging only');
    }
  }

  /**
   * Send email using MailerSend API with Gmail fallback
   * @private
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @param {string} emailType - Type of email (otp, apiCredentials, videoCall, default)
   */
  async _sendEmail(to, subject, html, emailType = 'default') {
    // Try MailerSend first if configured
    if (this.isConfigured) {
      const axios = require('axios');

      try {
        // Select the appropriate sender email based on type
        const fromEmail = this.mailersendConfig.fromEmails[emailType] || this.mailersendConfig.fromEmails.default;

        const payload = {
          from: {
            email: fromEmail,
            name: this.mailersendConfig.fromName
          },
          to: [{
            email: to,
            name: this._extractNameFromEmail(to)
          }],
          subject: subject,
          html: html
        };

        const response = await axios.post(
          this.mailersendConfig.apiUrl,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${this.mailersendConfig.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const messageId = response.headers['x-message-id'] || response.data?.message_id || 'unknown';
        console.log(`✅ Email sent via MailerSend to ${to}`);
        return { success: true, messageId, provider: 'mailersend' };
      } catch (error) {
        console.error('❌ MailerSend failed:', error.response?.data?.message || error.message);
        
        // If MailerSend fails and Gmail is configured, try Gmail fallback
        if (this.gmailConfigured) {
          console.log('🔄 Trying Gmail SMTP fallback...');
          return await this._sendEmailViaGmail(to, subject, html);
        }
        
        return { success: false, error: error.message, provider: 'mailersend' };
      }
    }
    
    // If MailerSend not configured, try Gmail directly
    if (this.gmailConfigured) {
      return await this._sendEmailViaGmail(to, subject, html);
    }
    
    // No email service configured
    return { success: false, error: 'No email service configured' };
  }

  /**
   * Send email using Gmail SMTP
   * @private
   */
  async _sendEmailViaGmail(to, subject, html) {
    try {
      const mailOptions = {
        from: `"${process.env.GMAIL_FROM_NAME || 'CureAI App'}" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html
      };

      const info = await this.gmailTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent via Gmail to ${to}`);
      console.log(`   Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, provider: 'gmail' };
    } catch (error) {
      console.error('❌ Gmail SMTP failed:', error.message);
      return { success: false, error: error.message, provider: 'gmail' };
    }
  }

  /**
   * Extract name from email address
   * @private
   */
  _extractNameFromEmail(email) {
    if (typeof email === 'string' && email.includes('@')) {
      return email.split('@')[0];
    }
    return 'User';
  }

  /**
   * Send OTP email (for password reset)
   */
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

    const subject = 'Password Reset OTP - Healthcare Platform';
    const html = `
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
    `;

    try {
      const result = await this._sendEmail(email, subject, html, 'otp');
      if (result.success) {
        console.log(`✅ OTP sent to ${email}`);
        return true;
      } else {
        console.error('❌ Error sending OTP email:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending OTP email:', error.message);
      return false;
    }
  }

  /**
   * Send Signup Verification OTP email
   */
  async sendSignupOTP(email, otp) {
    console.log('🔵 [EMAIL] sendSignupOTP called for:', email);
    console.log('🔵 [EMAIL] isConfigured:', this.isConfigured);
    
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

    const subject = 'Email Verification OTP - Healthcare Platform';
    const html = `
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
    `;

    try {
      const result = await this._sendEmail(email, subject, html, 'otp');
      if (result.success) {
        console.log(`✅ Signup OTP sent to ${email}`);
        return true;
      } else {
        console.error('❌ Error sending signup OTP email:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending signup OTP email:', error.message);
      return false;
    }
  }

  /**
   * Send consultation confirmation email
   */
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

    const subject = '🎥 Video Consultation Scheduled - Healthcare Platform';
    const html = `
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
    `;

    try {
      const result = await this._sendEmail(email, subject, html, 'videoCall');
      if (result.success) {
        console.log(`✅ Consultation email sent successfully to ${email} (${recipientRole})`);
        console.log(`   Message ID: ${result.messageId}`);
        return true;
      } else {
        console.error(`❌ Failed to send consultation email to ${email} (${recipientRole})`);
        console.error(`   Error: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to send consultation email to ${email} (${recipientRole})`);
      console.error(`   Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate iCalendar event for calendar integration
   * Note: MailerSend doesn't support attachments in the same way as Nodemailer
   * This method is kept for potential future use or alternative implementation
   */
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

  /**
   * Generic send email method for backward compatibility
   */
  async sendEmail(to, subject, html) {
    // If email not configured, just log to console
    if (!this.isConfigured) {
      console.log('\n=================================');
      console.log('📧 EMAIL (Console Mode)');
      console.log('=================================');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('=================================\n');
      return true;
    }

    try {
      const result = await this._sendEmail(to, subject, html);
      if (result.success) {
        console.log(`✅ Email sent to ${to}`);
        return true;
      } else {
        console.error('❌ Error sending email:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      return false;
    }
  }

  /**
   * Send Hospital Verification Email with API Credentials
   */
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

    const subject = '✅ Hospital Verified - API Credentials - Healthcare Platform';
    const html = `
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
    `;

    try {
      const result = await this._sendEmail(email, subject, html, 'apiCredentials');
      if (result.success) {
        console.log(`✅ Hospital verification email sent to ${email}`);
        console.log(`   Message ID: ${result.messageId}`);
        return true;
      } else {
        console.error(`❌ Failed to send hospital verification email to ${email}`);
        console.error(`   Error: ${result.error}`);
        // Fallback to console output
        console.log('\n=================================');
        console.log('📧 HOSPITAL VERIFICATION EMAIL (Fallback - Email Failed)');
        console.log('=================================');
        console.log(`To: ${email}`);
        console.log(`Hospital: ${hospitalName}`);
        console.log(`API Key: ${apiKey}`);
        console.log(`API Secret: ${apiSecret}`);
        console.log('=================================\n');
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to send hospital verification email to ${email}`);
      console.error(`   Error: ${error.message}`);
      // Fallback to console output
      console.log('\n=================================');
      console.log('📧 HOSPITAL VERIFICATION EMAIL (Fallback - Email Failed)');
      console.log('=================================');
      console.log(`To: ${email}`);
      console.log(`Hospital: ${hospitalName}`);
      console.log(`API Key: ${apiKey}`);
      console.log(`API Secret: ${apiSecret}`);
      console.log('=================================\n');
      return false;
    }
  }

  /**
   * Send generic email (for alerts and other system emails)
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email (or array of emails)
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content (optional)
   * @returns {Promise<boolean>} Success status
   */
  async sendEmail(options) {
    try {
      // Handle array of recipients (use first one for now, MailerSend trial has limits)
      const recipient = Array.isArray(options.to) ? options.to[0] : options.to;
      
      // If email not configured, log to console
      if (!this.isConfigured) {
        console.log('\n=================================');
        console.log('📧 GENERIC EMAIL (Console Mode)');
        console.log('=================================');
        console.log(`To: ${recipient}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Content: ${options.text || options.html?.substring(0, 200) + '...'}`);
        console.log('=================================\n');
        return true;
      }

      // Use HTML content if available, otherwise use text
      const htmlContent = options.html || `<pre>${options.text}</pre>`;
      
      const result = await this._sendEmail(recipient, options.subject, htmlContent);
      
      if (result.success) {
        console.log(`✅ Email sent to ${recipient}`);
        console.log(`   Subject: ${options.subject}`);
        console.log(`   Message ID: ${result.messageId}`);
        return true;
      } else {
        console.error(`❌ Failed to send email to ${recipient}`);
        console.error(`   Error: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error sending email:`, error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
