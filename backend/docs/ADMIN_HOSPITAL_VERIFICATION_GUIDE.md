# Admin Hospital Verification Guide

## Overview

This guide provides step-by-step instructions for administrators to review, verify, or reject hospital registration applications and manage hospital access to the Healthcare Platform API.

## Prerequisites

- Admin account with hospital management permissions
- Access to the admin dashboard
- Understanding of hospital verification criteria
- Knowledge of healthcare regulations and compliance requirements

## Accessing Hospital Management

### Login to Admin Dashboard

1. Navigate to the admin login page
2. Enter your admin credentials
3. Access the "Hospitals" section from the main navigation

### Hospital Management Interface

The hospital management interface provides:

- **Pending Applications**: New registrations awaiting review
- **Verified Hospitals**: Currently active hospitals
- **Rejected Applications**: Previously rejected applications
- **Statistics Dashboard**: Overview of hospital metrics

## Hospital Verification Process

### Step 1: Review Pending Applications

#### Accessing Pending List

1. Click on "Hospitals" in the admin navigation
2. Select the "Pending" tab (shows count badge)
3. View list of hospitals awaiting verification

#### Application Information Display

Each pending application shows:

- **Hospital Name**: Official registered name
- **Contact Person**: Primary contact details
- **Registration Number**: Government-issued ID
- **Submission Date**: When application was submitted
- **Status Badge**: "Pending" in orange
- **Action Buttons**: View Details, Verify, Reject

### Step 2: Detailed Application Review

#### Opening Hospital Details

1. Click "View Details" on any pending application
2. A modal dialog opens with comprehensive information

#### Information to Review

**Basic Information:**
- Contact person name and email
- Hospital name and registration number
- Contact details and address

**Hospital Details:**
- Specializations offered
- Number of beds
- Available facilities
- Website (if provided)

**Uploaded Documents:**
- Hospital registration certificate
- Medical license
- Additional certifications
- Document preview and download options

**Verification Checklist:**
- [ ] Hospital name matches registration certificate
- [ ] Registration number is valid and unique
- [ ] Contact information is complete and accurate
- [ ] Documents are clear and legible
- [ ] Specializations align with license
- [ ] Address matches official records

### Step 3: Verification Decision

#### Option A: Approve Hospital

**When to Approve:**
- All documents are authentic and complete
- Hospital information is accurate
- Registration number is valid
- No red flags in background check

**Approval Process:**
1. Click "Verify" button in the hospital details modal
2. Confirm the verification action
3. System automatically:
   - Generates unique API credentials
   - Sends email with credentials to hospital
   - Updates status to "Verified"
   - Records verification timestamp and admin ID

**Generated Credentials:**
- **API Key**: Format `HK_[32-char-hex]`
- **API Secret**: 64-character hexadecimal string
- Credentials are automatically included in the notification email

#### Option B: Reject Application

**When to Reject:**
- Invalid or fraudulent documents
- Incomplete information
- Hospital not properly licensed
- Duplicate registration
- Suspicious activity

**Rejection Process:**
1. Click "Reject" button in the hospital details modal
2. **Required**: Enter detailed rejection reason
3. Select rejection category:
   - Invalid Documentation
   - Incomplete Information
   - License Issues
   - Duplicate Registration
   - Other (specify)
4. Confirm rejection
5. System automatically:
   - Sends rejection email with reason
   - Updates status to "Rejected"
   - Records rejection timestamp and admin ID

**Rejection Reason Guidelines:**
- Be specific and actionable
- Explain what needs to be corrected
- Provide guidance for reapplication
- Maintain professional tone

### Step 4: Post-Verification Management

#### Monitoring Verified Hospitals

**Verified Hospitals Tab:**
- Lists all currently active hospitals
- Shows verification date and admin
- Displays API usage statistics
- Provides access management options

**Available Actions:**
- View hospital profile
- Monitor API usage
- Revoke access (if needed)
- Update hospital status

#### Revoking Hospital Access

**When to Revoke:**
- Violation of terms of service
- Suspicious API usage patterns
- License expiration or revocation
- Hospital closure
- Security concerns

**Revocation Process:**
1. Navigate to verified hospitals list
2. Click "Revoke Access" for the target hospital
3. Select revocation reason:
   - Terms of Service Violation
   - License Expired/Revoked
   - Security Concern
   - Hospital Closed
   - Other (specify)
4. Enter detailed explanation
5. Confirm revocation
6. System automatically:
   - Disables API access immediately
   - Sends notification email
   - Updates status to "Revoked"
   - Logs the action

## Verification Criteria & Standards

### Document Verification

**Hospital Registration Certificate:**
- Must be issued by recognized government authority
- Should be current and not expired
- Hospital name must match exactly
- Registration number must be unique in system

**Medical License:**
- Valid and current license
- Covers the specializations claimed
- Issued by appropriate medical board
- No disciplinary actions noted

**Additional Certifications:**
- Accreditation certificates (JCI, NABH, etc.)
- Specialty certifications
- Quality certifications (ISO, etc.)

### Information Validation

**Hospital Details:**
- Physical address verification
- Contact number validation
- Website verification (if provided)
- Specialization alignment with license

**Contact Person:**
- Authority to represent hospital
- Valid contact information
- Professional email domain
- Appropriate title/position

### Red Flags to Watch For

**Document Issues:**
- Blurry or illegible documents
- Suspicious formatting or fonts
- Missing official seals or signatures
- Inconsistent information across documents

**Information Discrepancies:**
- Mismatched names or addresses
- Invalid registration numbers
- Unrealistic facility claims
- Suspicious email domains

**Behavioral Red Flags:**
- Multiple applications from same entity
- Rushed or incomplete submissions
- Evasive responses to clarification requests
- Unusual contact patterns

## Communication Templates

### Approval Email Template

```
Subject: Hospital Registration Approved - API Credentials Enclosed

Dear [Contact Person Name],

Congratulations! Your hospital registration for [Hospital Name] has been approved.

Your API credentials are:
- API Key: [Generated API Key]
- API Secret: [Generated API Secret]

IMPORTANT SECURITY NOTES:
- Keep these credentials secure and confidential
- Do not share them publicly or commit to version control
- Use them only for authorized emergency patient data access

Next Steps:
1. Log in to your hospital dashboard: [Dashboard URL]
2. Review the API documentation: [API Docs URL]
3. Test your integration in our sandbox environment

Rate Limits:
- 100 API requests per hour
- Monitor usage in your dashboard

Support:
- Technical Support: hospital-support@healthcareplatform.com
- Emergency Hotline: 1-800-URGENT-1

Welcome to the Healthcare Platform!

Best regards,
Healthcare Platform Admin Team
```

### Rejection Email Template

```
Subject: Hospital Registration - Additional Information Required

Dear [Contact Person Name],

Thank you for your interest in joining the Healthcare Platform. After reviewing your application for [Hospital Name], we need additional information before we can proceed with verification.

Reason for Request:
[Specific rejection reason]

Required Actions:
[Detailed list of what needs to be corrected]

To Reapply:
1. Address the issues mentioned above
2. Gather the required documentation
3. Submit a new registration application
4. Reference this email in your resubmission

Timeline:
- You may reapply immediately after addressing the issues
- New applications are typically reviewed within 24-48 hours

Support:
If you have questions about these requirements, please contact:
- Email: hospital-support@healthcareplatform.com
- Phone: 1-800-HEALTH-1

We appreciate your understanding and look forward to your resubmission.

Best regards,
Healthcare Platform Admin Team
```

## Dashboard Analytics

### Hospital Statistics

**Overview Metrics:**
- Total registered hospitals
- Pending applications count
- Verification rate (approved/total)
- Average verification time
- API usage statistics

**Trend Analysis:**
- Registration trends over time
- Verification success rates
- Geographic distribution
- Specialization breakdown

**Performance Metrics:**
- Admin response time
- Application completion rates
- API adoption rates
- Support ticket volume

### Monitoring Tools

**Real-time Alerts:**
- New hospital registrations
- Unusual API usage patterns
- Failed verification attempts
- System errors or issues

**Reporting Features:**
- Weekly verification reports
- Monthly hospital statistics
- API usage summaries
- Compliance reports

## Best Practices

### Verification Efficiency

**Time Management:**
- Review applications within 24 hours
- Batch similar reviews together
- Use verification checklists
- Maintain consistent standards

**Quality Assurance:**
- Double-check critical information
- Verify documents thoroughly
- Cross-reference with external databases
- Maintain detailed review notes

### Communication Standards

**Professional Communication:**
- Use clear, professional language
- Provide specific, actionable feedback
- Respond promptly to inquiries
- Maintain consistent tone

**Documentation:**
- Record all verification decisions
- Maintain audit trails
- Document unusual cases
- Keep communication records

### Security Considerations

**Data Protection:**
- Handle sensitive information securely
- Follow HIPAA compliance guidelines
- Maintain confidentiality
- Report security incidents

**Access Control:**
- Use strong authentication
- Log all admin actions
- Regular access reviews
- Principle of least privilege

## Troubleshooting

### Common Issues

**Problem**: Document won't open or display
- **Solution**: Check file format, try different browser, contact hospital for re-upload

**Problem**: Duplicate registration number
- **Solution**: Verify with hospital, check for data entry errors, investigate potential fraud

**Problem**: Unable to generate API credentials
- **Solution**: Check system status, retry operation, contact technical support

**Problem**: Email notifications not sending
- **Solution**: Verify email configuration, check spam filters, use alternative communication

### Escalation Procedures

**Technical Issues:**
1. Document the problem
2. Check system status
3. Contact technical support
4. Escalate to development team if needed

**Policy Questions:**
1. Consult verification guidelines
2. Discuss with senior admin
3. Escalate to management
4. Document decision for future reference

**Legal/Compliance Issues:**
1. Stop verification process
2. Consult legal team
3. Document all actions
4. Follow compliance procedures

## Support & Resources

### Internal Support

- **Technical Team**: tech-support@internal.com
- **Legal Team**: legal@internal.com
- **Management**: admin-management@internal.com

### External Resources

- **Healthcare Licensing Boards**: [State-specific links]
- **Hospital Accreditation Bodies**: JCI, NABH, etc.
- **Government Databases**: Registration verification systems

### Training Materials

- **New Admin Onboarding**: Complete training program
- **Verification Guidelines**: Detailed criteria and standards
- **System Training**: Platform-specific procedures
- **Compliance Training**: HIPAA and healthcare regulations

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Document ID**: AHVG-001