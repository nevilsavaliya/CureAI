# Hospital Document Upload - User Guide

## Overview
This guide explains how the document upload feature works in the hospital registration process.

## For Hospitals (Registration)

### Step 5: Document Upload

When you reach Step 5 of the registration form, you'll see:

```
┌─────────────────────────────────────────────────────────┐
│  Step 5: Document Upload                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Required Documents *                                    │
│  Please upload: Registration Certificate, Medical       │
│  License, and any other relevant documents              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │              📄                                     │ │
│  │                                                     │ │
│  │     Click to upload or drag and drop               │ │
│  │     PDF, JPG, PNG (Max 10MB each)                  │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Uploaded Documents (3)                                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📎 registration-certificate.pdf (245 KB)      ✕   │ │
│  │ 📎 medical-license.jpg (1.2 MB)               ✕   │ │
│  │ 📎 accreditation.pdf (890 KB)                 ✕   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [← Previous]                    [Submit Registration]  │
└─────────────────────────────────────────────────────────┘
```

### How to Upload Documents

1. **Click the upload area** or **drag files** into it
2. **Select one or multiple files** (up to 10 files)
3. **Supported formats:** PDF, JPG, JPEG, PNG
4. **Maximum size:** 10MB per file
5. **Review uploaded files** in the list below
6. **Remove files** by clicking the ✕ button if needed
7. **Submit registration** when ready

### Required Documents

You should upload at least:
- ✅ Hospital Registration Certificate
- ✅ Medical License
- ✅ Accreditation Certificate (if applicable)
- ✅ Any other relevant documents

### Validation Rules

- ❌ **At least 1 document required** - You cannot submit without documents
- ❌ **File type must be PDF, JPG, or PNG** - Other formats will be rejected
- ❌ **File size must be under 10MB** - Larger files will be rejected
- ❌ **Maximum 10 files** - Cannot upload more than 10 documents

### After Submission

Once you submit:
1. ✅ Your documents are securely uploaded
2. ✅ You receive a confirmation email
3. ✅ Admin team reviews your application
4. ✅ You'll be notified when verified

## For Admins (Review)

### Viewing Hospital Documents

When reviewing a hospital application:

```
┌─────────────────────────────────────────────────────────┐
│  Hospital Details - City General Hospital               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Basic Information                                       │
│  Name: Dr. John Smith                                    │
│  Email: admin@citygeneral.com                           │
│  Registration: REG123456                                 │
│                                                          │
│  Documents                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     📄       │  │     📄       │  │     📄       │  │
│  │              │  │              │  │              │  │
│  │ Certificate  │  │   License    │  │ Accreditation│  │
│  │              │  │              │  │              │  │
│  │ [View/Download] [View/Download] [View/Download]  │  │
│  │              │  │              │  │              │  │
│  │ Uploaded:    │  │ Uploaded:    │  │ Uploaded:    │  │
│  │ Nov 30, 2024 │  │ Nov 30, 2024 │  │ Nov 30, 2024 │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  [Verify Hospital]  [Reject Application]                │
└─────────────────────────────────────────────────────────┘
```

### Document Review Process

1. **Click "View Details"** on a hospital card
2. **Scroll to Documents section**
3. **Click document links** to view/download
4. **Verify authenticity** of documents
5. **Check all required documents** are present
6. **Approve or reject** based on review

### Document Information Shown

For each document:
- 📄 **Document icon**
- 📝 **Document type** (if categorized)
- 📅 **Upload date**
- 🔗 **Download link**

## Technical Details

### File Storage

- **Location:** `backend/uploads/hospital-documents/`
- **Naming:** `originalname-timestamp-random.ext`
- **Example:** `license-1701456789-123456789.pdf`

### Database Storage

Documents are stored in the Hospital model:
```javascript
{
  documents: [
    {
      type: 'other',
      url: '/uploads/hospital-documents/license-1701456789-123456789.pdf',
      uploadedAt: '2024-12-01T10:30:00.000Z'
    }
  ]
}
```

### Security Features

- ✅ **File type validation** - Only safe formats allowed
- ✅ **File size limits** - Prevents large uploads
- ✅ **Unique filenames** - Prevents overwrites
- ✅ **Admin-only access** - Documents not public
- ✅ **Secure storage** - Files stored outside web root

## Troubleshooting

### Common Issues

**Problem:** "File type not allowed"
- **Solution:** Only upload PDF, JPG, JPEG, or PNG files

**Problem:** "File too large"
- **Solution:** Compress or resize files to under 10MB

**Problem:** "Too many files"
- **Solution:** Upload maximum 10 files at a time

**Problem:** "At least one document required"
- **Solution:** Upload at least 1 document before submitting

**Problem:** "Upload failed"
- **Solution:** Check internet connection and try again

### Getting Help

If you encounter issues:
1. Check file format and size
2. Try uploading one file at a time
3. Clear browser cache and retry
4. Contact support if problem persists

## Best Practices

### For Hospitals

1. **Scan documents clearly** - Ensure text is readable
2. **Use PDF format** when possible - More professional
3. **Keep file sizes reasonable** - Compress large images
4. **Name files descriptively** - Easier to identify
5. **Upload all required documents** - Speeds up verification

### For Admins

1. **Review all documents** - Don't skip any
2. **Verify authenticity** - Check for signs of tampering
3. **Check expiration dates** - Ensure documents are current
4. **Document your review** - Note any concerns
5. **Respond promptly** - Don't keep hospitals waiting

## API Reference

### Upload Endpoint

```http
POST /api/hospitals/register
Content-Type: multipart/form-data

Body:
- name: string
- email: string
- password: string
- hospitalName: string
- registrationNumber: string
- address[street]: string
- address[city]: string
- address[state]: string
- address[zipCode]: string
- address[country]: string
- contactNumber: string
- emergencyContact: string
- website: string (optional)
- specializations: JSON string
- facilities: JSON string
- documents: File[] (1-10 files)
```

### Response

```json
{
  "success": true,
  "message": "Hospital registered successfully...",
  "hospital": {
    "id": "674c1234567890abcdef1234",
    "name": "Dr. John Smith",
    "hospitalName": "City General Hospital",
    "email": "admin@citygeneral.com",
    "verificationStatus": "pending",
    "documentsUploaded": 3
  }
}
```

### Error Responses

```json
{
  "success": false,
  "message": "File size too large. Maximum size is 10MB per file."
}
```

```json
{
  "success": false,
  "message": "Only PDF, JPG, JPEG, and PNG files are allowed"
}
```

```json
{
  "success": false,
  "message": "Too many files. Maximum is 10 files."
}
```

---

**Last Updated:** December 1, 2024
**Version:** 1.0
