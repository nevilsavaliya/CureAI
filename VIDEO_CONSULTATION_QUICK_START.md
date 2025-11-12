# Video Consultation Quick Start Guide

## For Developers

### Running Tests

1. **Automated Test:**
   ```bash
   node backend/tests/manual-video-test.js
   ```

2. **Interactive Test Page:**
   - Open `backend/tests/video-call-test.html` in a browser
   - Generate video links
   - Test validation
   - Join calls

3. **Full Testing Guide:**
   - See `backend/tests/VIDEO_TESTING_GUIDE.md`

### How It Works

1. **Doctor books consultation** → Video link generated
2. **Email sent to both parties** → Contains video link + calendar invite
3. **Click "Join Video Consultation"** → Opens Jitsi Meet
4. **Video call starts** → No installation required

### Video Service API

```javascript
const videoService = require('./services/videoService');

// Generate video room
const { roomId, videoLink } = videoService.generateVideoRoom(consultationId);

// Validate link
const isValid = videoService.validateVideoLink(videoLink);

// Extract room ID
const roomId = videoService.extractRoomId(videoLink);

// Generate config
const config = videoService.generateRoomConfig({
  roomName: 'consultation-room',
  displayName: 'Dr. Smith',
  email: 'doctor@example.com'
});
```

### Email Configuration

Add to `.env`:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Note:** If not configured, emails will be logged to console for testing.

---

## For Doctors

### Booking a Consultation

1. Go to your dashboard
2. Find the patient in your messages
3. Click "Book Consultation"
4. Select date and time
5. Click "Confirm Booking"

### What Happens Next

- ✅ Patient receives email with video link
- ✅ You receive email with video link
- ✅ Calendar invite added to both calendars
- ✅ Video link is ready to use

### Joining the Video Call

**From Email:**
1. Open the consultation email
2. Click "Join Video Consultation" button
3. Allow camera and microphone permissions
4. Wait for patient to join

**From Dashboard:**
1. Go to "Upcoming Consultations"
2. Find the consultation
3. Click "Join Call"

### During the Call

**Available Controls:**
- 🎤 Mute/Unmute microphone
- 📹 Enable/Disable camera
- 🖥️ Share screen
- 💬 Send chat messages
- ⚙️ Adjust settings
- 📞 End call

**Tips:**
- Join 5 minutes early
- Use headphones for better audio
- Ensure good lighting
- Test camera/mic beforehand
- Have patient records ready

---

## For Patients

### Receiving Consultation Invitation

You'll receive an email with:
- Doctor's name
- Consultation date and time
- Video call link
- Calendar invite

### Joining the Video Call

1. Open the email from Healthcare Platform
2. Click the big "Join Video Consultation" button
3. Allow camera and microphone when asked
4. Wait for doctor to join

### Before the Call

- ✅ Test your camera and microphone
- ✅ Find a quiet, well-lit place
- ✅ Have your medical records ready
- ✅ Write down questions to ask
- ✅ Join 5 minutes early

### During the Call

**What You Can Do:**
- See and hear the doctor
- Share your screen if needed
- Send chat messages
- Mute yourself if needed
- Turn off camera if needed

**Tips:**
- Speak clearly
- Ask questions
- Take notes
- Follow doctor's instructions

### Technical Requirements

**Minimum:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Working camera and microphone
- Internet connection (2 Mbps minimum)

**Recommended:**
- Chrome or Firefox browser
- Headphones or earbuds
- Good lighting
- Stable internet (5+ Mbps)

### Troubleshooting

**Can't see video?**
- Check camera permissions
- Try different browser
- Restart browser

**Can't hear audio?**
- Check speaker/headphone connection
- Verify volume is not muted
- Check browser audio permissions

**Poor quality?**
- Check internet speed
- Close other apps
- Move closer to WiFi router

**Need Help?**
- Contact: support@healthcare.com
- Check email for video link
- Try joining from different device

---

## For Administrators

### Monitoring Video Consultations

1. Check consultation records in database
2. Verify video links are generated
3. Monitor email delivery
4. Track consultation completion

### Configuration

**Email Settings:**
```env
EMAIL_USER=noreply@healthcare.com
EMAIL_PASSWORD=your-secure-password
```

**Video Service:**
- Provider: Jitsi Meet
- No API key required
- No additional configuration needed

### Troubleshooting

**Emails not sending?**
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Verify SMTP settings
- Check email service logs

**Video links not working?**
- Verify Jitsi Meet is accessible
- Check link format
- Test in different browser

**Performance issues?**
- Monitor server resources
- Check database queries
- Review email service logs

### Security

**Current Implementation:**
- Unique, random room IDs
- Links shared only via email
- HTTPS encryption
- End-to-end encryption (Jitsi)

**Future Enhancements:**
- Room passwords
- JWT authentication
- Waiting rooms
- Host controls

---

## Quick Reference

### Video Link Format
```
https://meet.jit.si/healthcare-[consultation-id]-[timestamp]-[random]
```

### Email Template Includes
- ✅ Consultation details
- ✅ Video link button
- ✅ Direct link (copyable)
- ✅ Calendar invite (.ics)
- ✅ Important instructions
- ✅ Technical requirements
- ✅ Support information

### Testing Checklist
- [ ] Generate video link
- [ ] Validate link format
- [ ] Send test email
- [ ] Open link in browser
- [ ] Test video
- [ ] Test audio
- [ ] Test controls
- [ ] Test on mobile
- [ ] Test calendar invite

---

## Support

**Documentation:**
- Full Testing Guide: `backend/tests/VIDEO_TESTING_GUIDE.md`
- Implementation Summary: `TASK_7_IMPLEMENTATION_SUMMARY.md`
- Jitsi Docs: https://jitsi.github.io/handbook/docs/intro

**Testing Tools:**
- Test Script: `node backend/tests/manual-video-test.js`
- Test Page: `backend/tests/video-call-test.html`

**Contact:**
- Technical Support: support@healthcare.com
- Emergency: [Emergency Contact]

---

**Last Updated:** January 11, 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
