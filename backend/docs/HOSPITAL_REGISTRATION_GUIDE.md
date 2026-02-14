# Hospital Registration Guide

## Overview

This guide walks you through the process of registering your hospital with our Healthcare Platform to gain API access for emergency patient data retrieval.

## Prerequisites

Before starting the registration process, ensure you have:

- Valid hospital registration certificate
- Medical license documentation
- Official hospital email address
- Complete hospital information (address, specializations, facilities)
- Contact person details with authority to represent the hospital

## Step-by-Step Registration Process

### Step 1: Access Registration Form

1. Navigate to the hospital registration page: `/hospital/register`
2. You'll see a multi-step registration form with 5 sections

### Step 2: Basic Information

Fill out the contact person details:

- **Contact Person Name**: Full name of the authorized representative
- **Email Address**: Official hospital email (this will be your login email)
- **Password**: Strong password (minimum 8 characters)
- **Confirm Password**: Re-enter the same password

**Important Notes:**
- Use an official hospital email address
- The email must be unique (not already registered)
- Password should include uppercase, lowercase, numbers, and special characters

### Step 3: Hospital Details

Provide comprehensive hospital information:

- **Hospital Name**: Official registered name of your hospital
- **Registration Number**: Government-issued hospital registration number
- **Website**: Hospital's official website (optional)
- **Number of Beds**: Total bed capacity

**Validation Requirements:**
- Hospital registration number must be unique
- All fields except website are mandatory

### Step 4: Contact & Address Information

Enter complete contact details:

- **Contact Number**: Primary hospital phone number
- **Emergency Contact**: 24/7 emergency contact number
- **Address**: Complete hospital address including:
  - Street address
  - City
  - State/Province
  - ZIP/Postal code
  - Country

### Step 5: Specializations & Facilities

Select your hospital's capabilities:

**Specializations** (select all that apply):
- Cardiology
- Neurology
- Orthopedics
- Pediatrics
- Gynecology
- Emergency Medicine
- Internal Medicine
- Surgery
- Oncology
- Psychiatry
- Radiology
- Pathology

**Facilities** (select all available):
- ICU
- Emergency Room
- Operating Theater
- Laboratory
- Radiology
- Pharmacy
- Blood Bank
- Ambulance Service
- 24/7 Emergency Care

### Step 6: Document Upload

Upload required documentation:

1. **Hospital Registration Certificate** (PDF, max 5MB)
2. **Medical License** (PDF, max 5MB)
3. **Additional Certificates** (optional, PDF, max 5MB each)

**Document Requirements:**
- Files must be in PDF format
- Maximum file size: 5MB per document
- Documents should be clear and legible
- All text should be readable

### Step 7: Review & Submit

1. Review all entered information carefully
2. Ensure all required documents are uploaded
3. Check the terms and conditions checkbox
4. Click "Submit Registration"

## After Submission

### Immediate Confirmation

After successful submission, you will:

1. See a success message with your application reference number
2. Receive a confirmation email at the registered email address
3. Your application status will be set to "Pending Verification"

### Verification Process

**Timeline**: Typically 24-48 hours (business days)

**What Happens Next:**
1. Our admin team reviews your application
2. Documents are verified for authenticity
3. Hospital details are cross-checked with official records
4. Decision is made to approve or reject

### Possible Outcomes

#### ✅ **Approved**
- You'll receive an email with:
  - API credentials (API Key and Secret)
  - Access instructions
  - API documentation link
- You can now log in to your hospital dashboard
- API access is immediately available

#### ❌ **Rejected**
- You'll receive an email with:
  - Reason for rejection
  - Required corrections
  - Instructions to reapply
- You can submit a new application after addressing the issues

## Logging In After Approval

### Access Hospital Dashboard

1. Go to `/hospital/login`
2. Enter your registered email and password
3. Click "Login"

### Dashboard Features

Once logged in, you can:

- View your API credentials
- Monitor API usage statistics
- Access API documentation
- Update hospital profile
- View recent API requests

## API Credentials

### What You'll Receive

After approval, you'll get:

- **API Key**: Format `HK_[32-character-hex]`
  - Example: `HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **API Secret**: 64-character hexadecimal string
  - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### Security Guidelines

🔒 **Keep Credentials Secure:**
- Never share API credentials publicly
- Store them in secure environment variables
- Don't commit them to version control
- Rotate credentials if compromised

🔒 **Access Control:**
- Limit API access to authorized personnel only
- Use credentials only for emergency patient data access
- Monitor API usage regularly

## Using the API

### Basic Patient Data Request

```bash
curl -X POST https://api.healthcareplatform.com/api/hospitals/api/patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "HK_your_api_key_here",
    "apiSecret": "your_api_secret_here",
    "patientEmail": "patient@example.com"
  }'
```

### Response Format

```json
{
  "success": true,
  "patient": {
    "id": "...",
    "name": "John Doe",
    "age": 35,
    "bloodGroup": "O+",
    "allergies": ["Penicillin", "Peanuts"],
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+1234567890"
    },
    "chronicConditions": [...],
    "currentMedications": [...],
    "pastSurgeries": [...],
    "extractedSymptoms": [...],
    "vitalSigns": [...],
    "labResults": [...]
  },
  "accessedBy": {
    "hospital": "Your Hospital Name",
    "accessTime": "2024-11-18T10:30:00Z"
  }
}
```

## Rate Limits

- **Limit**: 100 API requests per hour
- **Reset**: Every hour on the hour
- **Headers**: Response includes rate limit information

## Troubleshooting

### Common Registration Issues

**Problem**: Email already exists
- **Solution**: Use a different email or contact support if you believe this is an error

**Problem**: Registration number already exists
- **Solution**: Verify your registration number or contact support

**Problem**: Document upload fails
- **Solution**: 
  - Check file size (max 5MB)
  - Ensure PDF format
  - Try a different browser

**Problem**: Form validation errors
- **Solution**: 
  - Fill all required fields
  - Check email format
  - Ensure password meets requirements

### Login Issues

**Problem**: Cannot log in after approval
- **Solution**: 
  - Check email and password
  - Ensure hospital is verified
  - Clear browser cache

**Problem**: "Pending verification" message
- **Solution**: Wait for admin approval (24-48 hours)

**Problem**: "Application rejected" message
- **Solution**: Check rejection email for specific reasons

### API Issues

**Problem**: Authentication failed
- **Solution**: 
  - Verify API credentials
  - Check for typos in API key/secret
  - Ensure hospital is still active

**Problem**: Rate limit exceeded
- **Solution**: 
  - Wait for rate limit reset
  - Monitor usage in dashboard
  - Contact support for higher limits if needed

**Problem**: Patient not found
- **Solution**: 
  - Verify patient email address
  - Ensure patient is registered in system

## Support

### Contact Information

- **Email**: hospital-support@healthcareplatform.com
- **Phone**: 1-800-HEALTH-1 (1-800-432-5841)
- **Hours**: Monday-Friday, 9 AM - 6 PM EST

### Documentation

- **API Documentation**: `/hospital/api-docs`
- **Interactive API Explorer**: Available in hospital dashboard
- **Code Examples**: Multiple programming languages available

### Emergency Support

For urgent API access issues during emergencies:
- **Emergency Hotline**: 1-800-URGENT-1 (1-800-874-3681)
- **Available**: 24/7
- **Response Time**: Within 30 minutes

## Best Practices

### Security
- Use HTTPS for all API requests
- Implement proper error handling
- Log API access for audit purposes
- Regularly review API usage

### Integration
- Test API integration in development environment first
- Implement retry logic for failed requests
- Cache patient data appropriately (respect privacy)
- Handle rate limits gracefully

### Compliance
- Ensure HIPAA compliance in your implementation
- Maintain audit logs of patient data access
- Follow your hospital's data privacy policies
- Report any security incidents immediately

## Frequently Asked Questions

### Q: How long does verification take?
**A**: Typically 24-48 hours during business days. Complex cases may take longer.

### Q: Can I update my hospital information after registration?
**A**: Yes, you can update most information through your hospital dashboard. Some changes may require re-verification.

### Q: What if I forget my API credentials?
**A**: You can view them in your hospital dashboard. If you need new credentials, contact support.

### Q: Is there a cost for API access?
**A**: No, API access is provided free of charge for verified hospitals.

### Q: Can I access data for patients from other hospitals?
**A**: Yes, if the patient is registered in our system, regardless of their primary hospital.

### Q: What happens if my hospital's verification is revoked?
**A**: API access will be immediately suspended. You'll receive notification with the reason and steps to restore access.

### Q: Can I integrate this with my hospital's EMR system?
**A**: Yes, our API is designed for integration. Contact our technical team for assistance.

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Document ID**: HRG-001