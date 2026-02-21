const AuditLog = require('../models/AuditLog');
const configService = require('../core/config/ConfigService');

class EmailNotificationService {
  constructor() {
    // Get configuration from ConfigService
    const mailersendConfig = configService.getMailerSendConfig();
    
    // Check if MailerSend is configured
    this.isConfigured = mailersendConfig.apiKey && mailersendConfig.fromEmail;

    if (this.isConfigured) {
      // Configure MailerSend using ConfigService
      this.mailersendConfig = {
        apiKey: mailersendConfig.apiKey,
        fromEmail: mailersendConfig.fromEmail,
        fromName: mailersendConfig.fromName,
        apiUrl: mailersendConfig.apiUrl
      };

      console.log('✅ MailerSend email service is ready');
    } else {
      console.log('⚠️  Email not configured - using console logging for notifications');
      if (!mailersendConfig.apiKey) {
        console.log('   Missing: MAILERSEND_API_KEY');
      }
      if (!mailersendConfig.fromEmail) {
        console.log('   Missing: MAILERSEND_FROM_EMAIL');
      }
    }

    // Email delivery tracking
    this.deliveryStats = {
      sent: 0,
      failed: 0,
      retries: 0
    };
  }

  /**
   * Send user removal notification email
   * @param {Object} userData - User data
   * @param {string} reason - Reason for removal
   * @param {string} adminName - Name of admin who removed the user
   * @param {Object} options - Additional options
   * @returns {boolean} Success status
   */
  async sendUserRemovalNotification(userData, reason = '', adminName = 'Administrator', options = {}) {
    try {
      const { email, name, userType } = userData;
      const supportEmail = options.supportEmail || configService.getSupportEmail();
      const { appealProcess = true } = options;

      // If email not configured, log to console
      if (!this.isConfigured) {
        console.log('\n=================================');
        console.log('📧 USER REMOVAL NOTIFICATION (Console Mode)');
        console.log('=================================');
        console.log(`To: ${email}`);
        console.log(`User: ${name} (${userType})`);
        console.log(`Reason: ${reason || 'No reason provided'}`);
        console.log(`Removed by: ${adminName}`);
        console.log('=================================\n');
        return true;
      }

      const userTypeDisplay = this._getUserTypeDisplay(userType);
      const subject = `Account Deactivation Notice - Healthcare Platform`;

      const mailOptions = {
        from: configService.getDefaultFromEmail(),
        to: email,
        subject,
        html: this._generateUserRemovalTemplate({
          name,
          userType: userTypeDisplay,
          reason,
          adminName,
          supportEmail,
          appealProcess
        })
      };

      const result = await this._sendEmailWithRetry(mailOptions, 'USER_REMOVAL_NOTIFICATION');

      if (result.success) {
        console.log(`✅ User removal notification sent to ${email}`);
      } else {
        console.error(`❌ Failed to send user removal notification to ${email}`);
      }

      return result.success;

    } catch (error) {
      console.error('Error sending user removal notification:', error);
      this.deliveryStats.failed++;
      return false;
    }
  }

  /**
   * Send new admin welcome email
   * @param {Object} adminData - Admin data
   * @param {string} temporaryPassword - Temporary password
   * @param {string} createdByName - Name of admin who created the account
   * @param {Object} options - Additional options
   * @returns {boolean} Success status
   */
  async sendNewAdminWelcomeEmail(adminData, temporaryPassword, createdByName = 'Root Administrator', options = {}) {
    try {
      const { email, name } = adminData;
      const loginUrl = options.loginUrl || `${configService.getFrontendUrl()}/admin/login`;
      const supportEmail = options.supportEmail || configService.getSupportEmail();
      const { passwordChangeRequired = true } = options;

      // If email not configured, log to console
      if (!this.isConfigured) {
        console.log('\n=================================');
        console.log('📧 NEW ADMIN WELCOME EMAIL (Console Mode)');
        console.log('=================================');
        console.log(`To: ${email}`);
        console.log(`Admin: ${name}`);
        console.log(`Temporary Password: ${temporaryPassword}`);
        console.log(`Created by: ${createdByName}`);
        console.log(`Login URL: ${loginUrl}`);
        console.log('=================================\n');
        return true;
      }

      const subject = `Welcome to Healthcare Platform - Admin Account Created`;

      const mailOptions = {
        from: configService.getDefaultFromEmail(),
        to: email,
        subject,
        html: this._generateAdminWelcomeTemplate({
          name,
          email,
          temporaryPassword,
          createdByName,
          loginUrl,
          supportEmail,
          passwordChangeRequired
        })
      };

      const result = await this._sendEmailWithRetry(mailOptions, 'ADMIN_WELCOME');

      if (result.success) {
        console.log(`✅ Admin welcome email sent to ${email}`);
      } else {
        console.error(`❌ Failed to send admin welcome email to ${email}`);
      }

      return result.success;

    } catch (error) {
      console.error('Error sending admin welcome email:', error);
      this.deliveryStats.failed++;
      return false;
    }
  }

  /**
   * Send user restoration notification email
   * @param {Object} userData - User data
   * @param {string} restoredByName - Name of admin who restored the user
   * @param {string} notes - Restoration notes
   * @param {Object} options - Additional options
   * @returns {boolean} Success status
   */
  async sendUserRestorationNotification(userData, restoredByName = 'Administrator', notes = '', options = {}) {
    try {
      const { email, name, userType } = userData;
      const loginUrl = options.loginUrl || this._getLoginUrl(userType);
      const supportEmail = options.supportEmail || configService.getSupportEmail();

      // If email not configured, log to console
      if (!this.isConfigured) {
        console.log('\n=================================');
        console.log('📧 USER RESTORATION NOTIFICATION (Console Mode)');
        console.log('=================================');
        console.log(`To: ${email}`);
        console.log(`User: ${name} (${userType})`);
        console.log(`Restored by: ${restoredByName}`);
        console.log(`Notes: ${notes || 'No notes provided'}`);
        console.log(`Login URL: ${loginUrl}`);
        console.log('=================================\n');
        return true;
      }

      const userTypeDisplay = this._getUserTypeDisplay(userType);
      const subject = `Account Restored - Healthcare Platform`;

      const mailOptions = {
        from: configService.getDefaultFromEmail(),
        to: email,
        subject,
        html: this._generateUserRestorationTemplate({
          name,
          userType: userTypeDisplay,
          restoredByName,
          notes,
          loginUrl,
          supportEmail
        })
      };

      const result = await this._sendEmailWithRetry(mailOptions, 'USER_RESTORATION_NOTIFICATION');

      if (result.success) {
        console.log(`✅ User restoration notification sent to ${email}`);
      } else {
        console.error(`❌ Failed to send user restoration notification to ${email}`);
      }

      return result.success;

    } catch (error) {
      console.error('Error sending user restoration notification:', error);
      this.deliveryStats.failed++;
      return false;
    }
  }

  /**
   * Send bulk operation summary email to admin
   * @param {string} adminEmail - Admin email
   * @param {Object} operationSummary - Summary of bulk operation
   * @param {Object} options - Additional options
   * @returns {boolean} Success status
   */
  async sendBulkOperationSummary(adminEmail, operationSummary, options = {}) {
    try {
      const {
        operation,
        userType,
        totalRequested,
        successful,
        failed,
        failedUsers = [],
        reason = ''
      } = operationSummary;

      // If email not configured, log to console
      if (!this.isConfigured) {
        console.log('\n=================================');
        console.log('📧 BULK OPERATION SUMMARY (Console Mode)');
        console.log('=================================');
        console.log(`To: ${adminEmail}`);
        console.log(`Operation: ${operation}`);
        console.log(`User Type: ${userType}`);
        console.log(`Total Requested: ${totalRequested}`);
        console.log(`Successful: ${successful}`);
        console.log(`Failed: ${failed}`);
        console.log('=================================\n');
        return true;
      }

      const subject = `Bulk ${operation} Operation Summary - Healthcare Platform`;

      const mailOptions = {
        from: configService.getDefaultFromEmail(),
        to: adminEmail,
        subject,
        html: this._generateBulkOperationSummaryTemplate({
          operation,
          userType: this._getUserTypeDisplay(userType),
          totalRequested,
          successful,
          failed,
          failedUsers,
          reason
        })
      };

      const result = await this._sendEmailWithRetry(mailOptions, 'BULK_OPERATION_SUMMARY');

      if (result.success) {
        console.log(`✅ Bulk operation summary sent to ${adminEmail}`);
      } else {
        console.error(`❌ Failed to send bulk operation summary to ${adminEmail}`);
      }

      return result.success;

    } catch (error) {
      console.error('Error sending bulk operation summary:', error);
      this.deliveryStats.failed++;
      return false;
    }
  }

  /**
   * Get email delivery statistics
   * @returns {Object} Delivery statistics
   */
  getDeliveryStatistics() {
    return {
      ...this.deliveryStats,
      successRate: this.deliveryStats.sent + this.deliveryStats.failed > 0
        ? ((this.deliveryStats.sent / (this.deliveryStats.sent + this.deliveryStats.failed)) * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Send email with retry mechanism using MailerSend API
   * @private
   * @param {Object} mailOptions - Email options
   * @param {string} emailType - Type of email for logging
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Object} Result with success status
   */
  async _sendEmailWithRetry(mailOptions, emailType, maxRetries = 3) {
    const axios = require('axios');
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Build MailerSend request payload
        const payload = {
          from: {
            email: this.mailersendConfig.fromEmail,
            name: this.mailersendConfig.fromName
          },
          to: [{
            email: mailOptions.to,
            name: this._extractNameFromEmail(mailOptions.to)
          }],
          subject: mailOptions.subject,
          html: mailOptions.html
        };

        // Send via MailerSend API
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

        // Extract message ID from response headers or body
        const messageId = response.headers['x-message-id'] || response.data?.message_id || 'unknown';

        // Update sent counter after successful MailerSend API response
        this.deliveryStats.sent++;

        // Log successful email delivery
        await this._logEmailDelivery(mailOptions.to, emailType, 'success', {
          messageId,
          attempt
        });

        return { success: true, messageId };

      } catch (error) {
        lastError = error;
        
        // Increment retries counter for each retry attempt in the loop
        if (attempt > 1) {
          this.deliveryStats.retries++;
        }

        // Determine if error is retryable
        const isRetryable = this._isRetryableError(error);
        
        console.warn(
          `Email delivery attempt ${attempt}/${maxRetries} failed for ${mailOptions.to}: ${error.message}`
        );

        // Don't retry client errors (4xx except 429)
        if (!isRetryable) {
          console.error(`Non-retryable error encountered, stopping retry attempts`);
          break;
        }

        // Wait before retry (exponential backoff: 2s, 4s, 8s)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Update failed counter after all retry attempts exhausted
    this.deliveryStats.failed++;

    // Log failed email delivery
    await this._logEmailDelivery(mailOptions.to, emailType, 'failed', {
      error: lastError.message,
      attempts: maxRetries
    });

    return { success: false, error: lastError.message };
  }

  /**
   * Determine if an error should trigger a retry
   * @private
   * @param {Error} error - The error to classify
   * @returns {boolean} True if error is retryable
   */
  _isRetryableError(error) {
    // Network errors - retry
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND') {
      return true;
    }

    // HTTP 5xx errors - retry
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // HTTP 429 (rate limit) - retry
    if (error.response && error.response.status === 429) {
      return true;
    }

    // HTTP 4xx errors (except 429) - don't retry
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }

    // Unknown errors - retry to be safe
    return true;
  }

  /**
   * Extract name from email address
   * @private
   * @param {string} email - Email address
   * @returns {string} Extracted name or default
   */
  _extractNameFromEmail(email) {
    // Extract username part before @ symbol as fallback name
    if (typeof email === 'string' && email.includes('@')) {
      return email.split('@')[0];
    }
    // Return 'User' as default if email is invalid or empty
    return 'User';
  }

  /**
   * Log email delivery for audit purposes
   * @private
   * @param {string} recipient - Email recipient
   * @param {string} emailType - Type of email
   * @param {string} status - Delivery status ('success' or 'failed')
   * @param {Object} details - Additional details (messageId, attempt, error, attempts)
   */
  async _logEmailDelivery(recipient, emailType, status, details = {}) {
    try {
      // Build audit log data with all required fields
      const auditLogData = {
        adminId: 'system',
        adminEmail: 'system@email-service',
        action: 'EMAIL_NOTIFICATION',
        targetUserEmail: recipient,
        details: {
          emailType,
          recipient,
          status,
          timestamp: new Date().toISOString(),
          ipAddress: 'system',
          userAgent: 'email-service',
          additionalData: {
            // Include MailerSend message ID for successful deliveries
            messageId: details.messageId || null,
            // Include number of delivery attempts
            deliveryAttempts: details.attempt || details.attempts || 1,
            // Include error message for failed deliveries
            errorMessage: status === 'failed' ? details.error : null,
            // Include any other details passed
            ...details
          }
        },
        status: status === 'success' ? 'success' : 'failed',
        errorMessage: status === 'failed' ? details.error : null
      };

      await AuditLog.logAction(auditLogData);
      
      // Log to console for visibility
      if (status === 'success') {
        console.log(`📧 Audit: ${emailType} sent to ${recipient} (Message ID: ${details.messageId || 'N/A'}, Attempt: ${details.attempt || 1})`);
      } else {
        console.error(`📧 Audit: ${emailType} failed for ${recipient} after ${details.attempts || 1} attempts - ${details.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to log email delivery:', error);
    }
  }

  /**
   * Get user type display name
   * @private
   * @param {string} userType - User type
   * @returns {string} Display name
   */
  _getUserTypeDisplay(userType) {
    const typeMap = {
      patient: 'Patient',
      doctor: 'Doctor',
      hospital: 'Hospital',
      admin: 'Administrator'
    };
    return typeMap[userType] || userType;
  }

  /**
   * Get login URL based on user type
   * @private
   * @param {string} userType - User type
   * @returns {string} Login URL
   */
  _getLoginUrl(userType) {
    const baseUrl = configService.getFrontendUrl();
    const urlMap = {
      patient: `${baseUrl}/login`,
      doctor: `${baseUrl}/login`,
      hospital: `${baseUrl}/hospital/login`,
      admin: `${baseUrl}/admin/login`
    };
    return urlMap[userType] || `${baseUrl}/login`;
  }

  /**
   * Generate user removal email template
   * @private
   */
  _generateUserRemovalTemplate(data) {
    const { name, userType, reason, adminName, supportEmail, appealProcess } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deactivation Notice</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">⚠️ Account Deactivated</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Healthcare Platform</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 20px 0; line-height: 1.6;">
              Dear ${name},
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 25px 0;">
              We are writing to inform you that your ${userType} account on Healthcare Platform has been deactivated by our administrative team.
            </p>
            
            <!-- Account Details -->
            <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 10px; padding: 25px; margin: 0 0 25px 0;">
              <h2 style="color: #dc2626; margin: 0 0 15px 0; font-size: 18px;">📋 Deactivation Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px; width: 35%;">Account Type:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${userType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Deactivated By:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${adminName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${new Date().toLocaleDateString()}</td>
                </tr>
                ${reason ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px; vertical-align: top;">Reason:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; line-height: 1.5;">${reason}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <!-- What This Means -->
            <div style="background: #f9fafb; border-left: 4px solid #6b7280; padding: 20px; margin: 0 0 25px 0; border-radius: 5px;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">What This Means:</h3>
              <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>You can no longer access your account</li>
                <li>Your profile and data have been preserved</li>
                <li>Any active consultations or appointments have been handled appropriately</li>
                <li>Your personal information remains secure and confidential</li>
              </ul>
            </div>
            
            ${appealProcess ? `
            <!-- Appeal Process -->
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 25px 0; border-radius: 5px;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📝 Appeal Process</h3>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                If you believe this deactivation was made in error or would like to appeal this decision, 
                please contact our support team at <strong>${supportEmail}</strong> within 30 days of this notice.
              </p>
            </div>
            ` : ''}
            
            <!-- Support -->
            <div style="text-align: center; padding: 20px 0; border-top: 2px solid #e5e7eb; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Questions or concerns? Contact our support team
              </p>
              <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">
                ${supportEmail}
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
  }

  /**
   * Generate admin welcome email template
   * @private
   */
  _generateAdminWelcomeTemplate(data) {
    const { name, email, temporaryPassword, createdByName, loginUrl, supportEmail, passwordChangeRequired } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Healthcare Platform - Admin Account</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🎉 Welcome Admin!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Healthcare Platform</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 20px 0; line-height: 1.6;">
              Dear ${name},
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 25px 0;">
              Welcome to Healthcare Platform! Your administrator account has been created by ${createdByName}. 
              You now have access to the admin dashboard and user management features.
            </p>
            
            <!-- Login Credentials -->
            <div style="background: #f0f4ff; border: 2px solid #667eea; border-radius: 10px; padding: 25px; margin: 0 0 25px 0;">
              <h2 style="color: #667eea; margin: 0 0 20px 0; font-size: 18px;">🔑 Your Login Credentials</h2>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #667eea; display: block; margin-bottom: 5px;">Email:</strong>
                <code style="background: white; padding: 10px; display: block; border-radius: 5px; color: #333; font-size: 14px;">${email}</code>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #667eea; display: block; margin-bottom: 5px;">Temporary Password:</strong>
                <code style="background: white; padding: 10px; display: block; border-radius: 5px; color: #333; font-size: 14px; word-break: break-all;">${temporaryPassword}</code>
              </div>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="${loginUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 50px; 
                          display: inline-block; 
                          font-weight: 600; 
                          font-size: 16px;
                          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);">
                  🚀 Access Admin Dashboard
                </a>
              </div>
            </div>
            
            ${passwordChangeRequired ? `
            <!-- Security Notice -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 25px 0; border-radius: 5px;">
              <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">🔒 Security Notice</h3>
              <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                <strong>Important:</strong> You will be required to change your password upon first login. 
                Please choose a strong password that includes uppercase letters, lowercase letters, numbers, and special characters.
              </p>
            </div>
            ` : ''}
            
            <!-- Admin Permissions -->
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 0 0 25px 0; border-radius: 5px;">
              <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 16px;">👑 Your Admin Permissions</h3>
              <ul style="color: #047857; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Manage patient accounts and data</li>
                <li>Manage doctor accounts and verifications</li>
                <li>Manage hospital registrations and API access</li>
                <li>View system analytics and reports</li>
                <li>Access audit logs and user activity</li>
                <li>Handle support requests and feedback</li>
              </ul>
            </div>
            
            <!-- Getting Started -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">🚀 Getting Started</h3>
              <ol style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Click the "Access Admin Dashboard" button above</li>
                <li>Log in with your email and temporary password</li>
                <li>Change your password when prompted</li>
                <li>Explore the admin dashboard and familiarize yourself with the features</li>
                <li>Review the user management guidelines and policies</li>
              </ol>
            </div>
            
            <!-- Support -->
            <div style="text-align: center; padding: 20px 0; border-top: 2px solid #e5e7eb; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Need help getting started? Contact our support team
              </p>
              <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">
                ${supportEmail}
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
  }

  /**
   * Generate user restoration email template
   * @private
   */
  _generateUserRestorationTemplate(data) {
    const { name, userType, restoredByName, notes, loginUrl, supportEmail } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Restored - Healthcare Platform</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">✅ Account Restored!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Healthcare Platform</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 20px 0; line-height: 1.6;">
              Dear ${name},
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 25px 0;">
              Great news! Your ${userType} account on Healthcare Platform has been successfully restored by our administrative team. 
              You can now access your account and resume using our services.
            </p>
            
            <!-- Restoration Details -->
            <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 10px; padding: 25px; margin: 0 0 25px 0;">
              <h2 style="color: #047857; margin: 0 0 15px 0; font-size: 18px;">📋 Restoration Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px; width: 35%;">Account Type:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${userType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Restored By:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${restoredByName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${new Date().toLocaleDateString()}</td>
                </tr>
                ${notes ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600; font-size: 14px; vertical-align: top;">Notes:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; line-height: 1.5;">${notes}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <!-- Access Your Account -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                        color: white; 
                        padding: 18px 50px; 
                        text-decoration: none; 
                        border-radius: 50px; 
                        display: inline-block; 
                        font-weight: 700; 
                        font-size: 17px;
                        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
                        letter-spacing: 0.3px;">
                🚀 Access Your Account
              </a>
              <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 13px;">
                Click the button above to log in to your account
              </p>
            </div>
            
            <!-- What's Available -->
            <div style="background: #f9fafb; border-left: 4px solid #6b7280; padding: 20px; margin: 0 0 25px 0; border-radius: 5px;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">What's Available Now:</h3>
              <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Full access to your account and profile</li>
                <li>All your previous data and history have been preserved</li>
                <li>Ability to resume consultations and appointments</li>
                <li>Access to all platform features based on your account type</li>
              </ul>
            </div>
            
            <!-- Welcome Back -->
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 25px 0; border-radius: 5px;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">🎉 Welcome Back!</h3>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                We're glad to have you back on Healthcare Platform. If you have any questions about your account restoration 
                or need assistance getting started again, please don't hesitate to contact our support team.
              </p>
            </div>
            
            <!-- Support -->
            <div style="text-align: center; padding: 20px 0; border-top: 2px solid #e5e7eb; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Questions or need assistance? Contact our support team
              </p>
              <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">
                ${supportEmail}
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
  }

  /**
   * Generate bulk operation summary email template
   * @private
   */
  _generateBulkOperationSummaryTemplate(data) {
    const { operation, userType, totalRequested, successful, failed, failedUsers, reason } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bulk Operation Summary</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">📊 Operation Summary</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Bulk ${operation} Completed</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 25px 0;">
              Your bulk ${operation} operation for ${userType} accounts has been completed. Here's a summary of the results:
            </p>
            
            <!-- Summary Stats -->
            <div style="display: flex; margin: 0 0 30px 0;">
              <div style="flex: 1; text-align: center; padding: 20px; background: #f0fdf4; border-radius: 10px; margin-right: 10px;">
                <div style="font-size: 32px; font-weight: 700; color: #047857; margin-bottom: 5px;">${successful}</div>
                <div style="font-size: 14px; color: #047857; font-weight: 600;">Successful</div>
              </div>
              <div style="flex: 1; text-align: center; padding: 20px; background: #fef2f2; border-radius: 10px; margin-left: 10px;">
                <div style="font-size: 32px; font-weight: 700; color: #dc2626; margin-bottom: 5px;">${failed}</div>
                <div style="font-size: 14px; color: #dc2626; font-weight: 600;">Failed</div>
              </div>
            </div>
            
            <!-- Operation Details -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 25px; margin: 0 0 25px 0;">
              <h2 style="color: #334155; margin: 0 0 20px 0; font-size: 18px;">📋 Operation Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px; width: 35%;">Operation:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-transform: capitalize;">${operation}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px;">User Type:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${userType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px;">Total Requested:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${totalRequested}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px;">Success Rate:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${((successful / totalRequested) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px;">Date:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${new Date().toLocaleString()}</td>
                </tr>
                ${reason ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px; vertical-align: top;">Reason:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px; line-height: 1.5;">${reason}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${failed > 0 && failedUsers.length > 0 ? `
            <!-- Failed Operations -->
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 25px; margin: 0 0 25px 0;">
              <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">❌ Failed Operations</h3>
              <div style="max-height: 200px; overflow-y: auto;">
                ${failedUsers.map(user => `
                  <div style="padding: 10px; background: white; border-radius: 5px; margin-bottom: 10px; border-left: 3px solid #dc2626;">
                    <div style="font-weight: 600; color: #dc2626; font-size: 14px;">User ID: ${user.userId}</div>
                    <div style="color: #6b7280; font-size: 13px; margin-top: 2px;">Error: ${user.error}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            <!-- Next Steps -->
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 25px 0; border-radius: 5px;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📝 Next Steps</h3>
              <ul style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Review the operation results above</li>
                ${failed > 0 ? '<li>Investigate and resolve any failed operations if needed</li>' : ''}
                <li>Check the audit logs for detailed operation history</li>
                <li>Verify that all intended changes have been applied</li>
              </ul>
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
  }
  /**
   * Send suspicious activity alert to root admin
   * @param {string} rootAdminEmail - Root admin email address
   * @param {Object} activityData - Suspicious activity details
   * @returns {boolean} Email delivery status
   */
  async sendSuspiciousActivityAlert(rootAdminEmail, activityData) {
    try {
      // If email not configured, log to console
      if (!this.isConfigured) {
        console.log('\n=================================');
        console.log('🚨 SUSPICIOUS ACTIVITY ALERT (Console Mode)');
        console.log('=================================');
        console.log(`To: ${rootAdminEmail}`);
        console.log(`Admin: ${activityData.adminName} (${activityData.adminEmail})`);
        console.log(`Risk Score: ${activityData.riskScore}/10`);
        console.log(`Indicators: ${activityData.indicators.join(', ')}`);
        console.log(`Timestamp: ${activityData.timestamp.toLocaleString()}`);
        console.log('=================================\n');
        return true;
      }

      const subject = `🚨 Security Alert: Suspicious Admin Activity Detected`;

      const mailOptions = {
        from: configService.getDefaultFromEmail(),
        to: rootAdminEmail,
        subject,
        html: this._generateSuspiciousActivityAlertTemplate(activityData)
      };

      const result = await this._sendEmailWithRetry(mailOptions, 'SUSPICIOUS_ACTIVITY_ALERT');

      if (result.success) {
        console.log(`✅ Suspicious activity alert sent to ${rootAdminEmail}`);
      } else {
        console.error(`❌ Failed to send suspicious activity alert to ${rootAdminEmail}`);
      }

      return result.success;

    } catch (error) {
      console.error('Error sending suspicious activity alert:', error);
      this.deliveryStats.failed++;
      return false;
    }
  }

  /**
   * Generate suspicious activity alert email template
   * @private
   * @param {Object} activityData - Activity data
   * @returns {string} HTML template
   */
  _generateSuspiciousActivityAlertTemplate(activityData) {
    const indicatorDescriptions = {
      'IP_ADDRESS_CHANGE': 'Login from a different IP address',
      'USER_AGENT_CHANGE': 'Login from a different device/browser',
      'RAPID_LOGIN': 'Multiple rapid login attempts',
      'OFF_HOURS_LOGIN': 'Login outside normal business hours'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚨 Security Alert</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Suspicious Admin Activity Detected</p>
        </div>
        
        <div style="padding: 30px; background-color: white;">
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
            <strong style="color: #856404;">⚠️ Immediate Attention Required</strong>
            <p style="margin: 5px 0 0 0; color: #856404;">
              Suspicious activity has been detected for an admin account. Please review immediately.
            </p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Activity Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 12px 0; font-weight: bold; color: #495057;">Admin:</td>
              <td style="padding: 12px 0; color: #212529;">${activityData.adminName} (${activityData.adminEmail})</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 12px 0; font-weight: bold; color: #495057;">Risk Score:</td>
              <td style="padding: 12px 0;">
                <span style="color: ${activityData.riskScore >= 5 ? '#dc3545' : '#ffc107'}; font-weight: bold;">
                  ${activityData.riskScore}/10 (${activityData.riskScore >= 5 ? 'High' : 'Medium'} Risk)
                </span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 12px 0; font-weight: bold; color: #495057;">Timestamp:</td>
              <td style="padding: 12px 0; color: #212529;">${activityData.timestamp.toLocaleString()}</td>
            </tr>
          </table>
          
          <h3 style="color: #dc3545; margin-bottom: 15px;">Suspicious Indicators:</h3>
          <ul style="list-style-type: none; padding: 0; margin-bottom: 25px;">
            ${activityData.indicators.map(indicator => `
              <li style="padding: 8px 0; border-bottom: 1px solid #f8f9fa; color: #6c757d;">
                <span style="color: #dc3545; margin-right: 8px;">⚠️</span>
                ${indicatorDescriptions[indicator] || indicator}
              </li>
            `).join('')}
          </ul>
          
          <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #495057; font-size: 18px;">Recommended Actions:</h3>
            <ul style="color: #6c757d; margin-bottom: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Review the admin's recent activity in the audit logs</li>
              <li style="margin-bottom: 8px;">Contact the admin to verify the activity</li>
              <li style="margin-bottom: 8px;">Consider temporarily locking the account if necessary</li>
              <li style="margin-bottom: 8px;">Require 2FA verification for sensitive operations</li>
            </ul>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              This is an automated security alert from the Healthcare Management System.
              <br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
        
        <div style="background-color: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Healthcare Management System - Security Monitoring</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Healthcare Platform. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}

module.exports = new EmailNotificationService();