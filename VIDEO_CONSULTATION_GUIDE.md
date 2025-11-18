# Video Consultation Integration Guide

## Overview
The case management system now includes integrated video consultation scheduling with automatic email delivery containing working video links.

## Features Implemented

### 1. Video Link Generation
- Uses Jitsi Meet (free, open-source video conferencing)
- No API keys or additional setup required
- Generates unique room IDs for each consultation
- Links format: `https://meet.jit.si/healthcare-case-{caseId}-{timestamp}-{random}`

### 2. Email Delivery
- Configured with Gmail SMTP
- Sends beautiful HTML emails to both patient and doctor
- Includes:
  - Consultation details (date, time, participants)
  - Working video link (clickable button)
  - Calendar attachment (.ics file)
  - Technical requirements and helpful tips

### 3. Case Integration
- Video consultations are linked to cases
- Doctors can schedule consultations for ongoing cases
- Video consultation details stored in case record
- Notifications sent to patients when scheduled

## API Endpoints

### Schedule Video Consultation
```
POST /api/cases/:id/schedule-consultation
Authorization: Bearer {doctorToken}

Request Body:
{
  "scheduledDate": "2025-11-18",
  "scheduledTime": "10:00 AM"
}

Response:
{
  "success": true,
  "message": "Video consultation scheduled successfully",
  "videoConsultation": {
    "scheduledDate": "2025-11-18T00:00:00.000Z",
    "scheduledTime": "10:00 AM",
    "videoLink": "https://meet.jit.si/healthcare-case-123-...",
    "roomId": "healthcare-case-123-...",
    "status": "scheduled"
  }
}
```

### Get Case with Video Consultation
```
GET /api/cases/:id
Authorization: Bearer {token}

Response includes videoConsultation field:
{
  "success": true,
  "case": {
    "_id": "...",
    "status": "ongoing",
    ...
    "videoConsultation": {
      "scheduledDate": "2025-11-18T00:00:00.000Z",
      "scheduledTime": "10:00 AM",
      "videoLink": "https://meet.jit.si/...",
      "status": "scheduled"
    }
  }
}
```

## Email Configuration

### Current Setup
- **Email Service**: Gmail SMTP
- **Email Account**: savaliyanevil9@gmail.com
- **Authentication**: App Password (configured in .env)

### Email Template Features
- Responsive HTML design
- Professional healthcare branding
- Clear call-to-action button
- Direct video link for easy access
- Technical requirements section
- Support information
- Calendar event attachment

## Testing

### Test Email Delivery
```bash
cd backend
node tests/test-real-email.js
```

This will:
1. Generate a test video link
2. Send an email to your configured email address
3. Display the video link for testing

### Test Video Link
1. Open the generated link in your browser
2. Open the same link in another browser/device
3. Both should join the same video room
4. Test audio, video, and chat features

## Video Link Example
```
https://meet.jit.si/healthcare-case-673a1234567890abcdef-1763360509836-qul3yezp
```

This link:
- ✅ Works immediately (no installation required)
- ✅ Supports multiple participants
- ✅ Includes audio, video, screen sharing, and chat
- ✅ Works on desktop and mobile browsers
- ✅ End-to-end encrypted
- ✅ Free and open-source

## Frontend Integration

### Doctor Dashboard - Schedule Consultation
```typescript
// In doctor case details component
scheduleConsultation(caseId: string) {
  const scheduledDate = '2025-11-18';
  const scheduledTime = '10:00 AM';
  
  this.caseService.scheduleVideoConsultation(caseId, {
    scheduledDate,
    scheduledTime
  }).subscribe({
    next: (response) => {
      console.log('Consultation scheduled:', response.videoConsultation);
      this.showSuccess('Video consultation scheduled! Email sent to patient.');
    },
    error: (error) => {
      console.error('Error:', error);
      this.showError('Failed to schedule consultation');
    }
  });
}
```

### Patient Dashboard - View Video Link
```typescript
// In patient case details component
joinVideoConsultation(videoLink: string) {
  // Open video link in new window
  window.open(videoLink, '_blank');
}
```

### Display Video Consultation Info
```html
<!-- In case details template -->
<div *ngIf="case.videoConsultation" class="video-consultation-card">
  <h3>📹 Video Consultation Scheduled</h3>
  <p><strong>Date:</strong> {{ case.videoConsultation.scheduledDate | date }}</p>
  <p><strong>Time:</strong> {{ case.videoConsultation.scheduledTime }}</p>
  <button (click)="joinVideoConsultation(case.videoConsultation.videoLink)"
          class="btn-primary">
    🎥 Join Video Call
  </button>
</div>
```

## Workflow

### Complete Flow
1. **Patient creates case** → Doctor receives notification
2. **Doctor accepts case** → Case status becomes "ongoing"
3. **Doctor schedules video consultation** → System generates video link
4. **Emails sent automatically** → Both patient and doctor receive emails with:
   - Consultation details
   - Working video link
   - Calendar attachment
5. **Patient receives notification** → In-app notification about scheduled consultation
6. **At consultation time** → Both click the video link to join
7. **Video call happens** → Using Jitsi Meet (no installation needed)
8. **After consultation** → Doctor marks case as treated

## Troubleshooting

### Email Not Sending
1. Check `.env` file has correct credentials
2. Verify Gmail App Password is set (not regular password)
3. Ensure 2FA is enabled on Gmail account
4. Run test: `node tests/test-real-email.js`

### Video Link Not Working
1. Verify link format: `https://meet.jit.si/...`
2. Check browser compatibility (Chrome, Firefox, Safari, Edge)
3. Ensure camera/microphone permissions granted
4. Test with: `node tests/manual-video-test.js`

### Email Shows "meet.example.com"
This was the old placeholder. The new implementation uses real Jitsi Meet links:
- ❌ Old: `meet.example.com/room123`
- ✅ New: `https://meet.jit.si/healthcare-case-123-...`

## Benefits

### For Patients
- ✅ Receive email with video link
- ✅ One-click to join consultation
- ✅ No software installation required
- ✅ Works on any device
- ✅ Calendar reminder included

### For Doctors
- ✅ Easy scheduling from case dashboard
- ✅ Automatic email delivery
- ✅ Professional consultation experience
- ✅ Integrated with case management
- ✅ No additional tools needed

### For System
- ✅ No API costs (Jitsi is free)
- ✅ No video infrastructure needed
- ✅ Reliable and scalable
- ✅ HIPAA-compliant option available (self-hosted Jitsi)
- ✅ Complete audit trail in case records

## Next Steps

1. **Frontend Integration**: Add UI for scheduling consultations
2. **Notifications**: Display video consultation info in notifications
3. **Reminders**: Send reminder emails before consultation
4. **Recording**: Add option to record consultations (requires self-hosted Jitsi)
5. **Analytics**: Track consultation completion rates

## Support

For issues or questions:
- Check logs: `backend/logs/`
- Test email: `node tests/test-real-email.js`
- Test video: `node tests/manual-video-test.js`
- Review email service: `backend/services/emailService.js`
- Review video service: `backend/services/videoService.js`
