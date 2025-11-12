# Video Call Functionality Testing Guide

## Overview
This guide provides instructions for testing the video consultation functionality implemented using Jitsi Meet.

## Automated Tests

### Running the Manual Test Script
```bash
node backend/tests/manual-video-test.js
```

This script tests:
- ✅ Video room generation
- ✅ Unique room ID creation
- ✅ Video link validation
- ✅ Room ID extraction
- ✅ Room configuration generation
- ✅ Service information retrieval
- ✅ Full integration workflow

## Manual Testing Procedures

### Test 1: Video Link Generation
**Objective:** Verify that video links are generated correctly

**Steps:**
1. Start the backend server: `npm run dev`
2. Create a consultation via API or UI
3. Check the console logs for the generated video link
4. Verify the link format: `https://meet.jit.si/healthcare-[unique-id]`

**Expected Result:**
- ✅ Link is generated in correct format
- ✅ Link contains unique identifier
- ✅ Link is stored in consultation document

### Test 2: Email Delivery with Video Links
**Objective:** Verify that consultation emails are sent with video links

**Steps:**
1. Configure email settings in `.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
2. Book a consultation through the doctor dashboard
3. Check both patient and doctor email inboxes
4. Verify email contains:
   - Consultation details (doctor, patient, date, time)
   - Prominent "Join Video Consultation" button
   - Direct video link
   - Calendar attachment (.ics file)

**Expected Result:**
- ✅ Both patient and doctor receive emails
- ✅ Email is well-formatted with all details
- ✅ Video link button is clickable
- ✅ Calendar invite can be added to calendar

### Test 3: Video Call Functionality
**Objective:** Test actual video call features

**Steps:**
1. Open the video link from email in Browser 1 (e.g., Chrome)
2. Allow camera and microphone permissions
3. Open the same video link in Browser 2 (e.g., Firefox) or another device
4. Allow camera and microphone permissions
5. Verify both participants can see and hear each other

**Expected Result:**
- ✅ Video call interface loads successfully
- ✅ Two-way video is working
- ✅ Two-way audio is working
- ✅ Both participants are visible in the call

### Test 4: Call Controls
**Objective:** Verify all call control features work

**Steps:**
1. Join a video call as described in Test 3
2. Test the following controls:
   - Mute/Unmute microphone
   - Enable/Disable camera
   - Screen sharing
   - Chat functionality
   - Settings menu
   - End call button

**Expected Result:**
- ✅ Microphone mute/unmute works
- ✅ Camera enable/disable works
- ✅ Screen sharing works (if supported)
- ✅ Chat messages are sent and received
- ✅ Settings can be adjusted
- ✅ End call button terminates the session

### Test 5: Browser Compatibility
**Objective:** Ensure video calls work across different browsers

**Browsers to Test:**
- Google Chrome (recommended)
- Mozilla Firefox
- Safari (macOS/iOS)
- Microsoft Edge
- Mobile browsers (Chrome Mobile, Safari Mobile)

**Steps:**
1. Open the same video link in different browsers
2. Test basic video/audio functionality
3. Test call controls

**Expected Result:**
- ✅ Works on Chrome
- ✅ Works on Firefox
- ✅ Works on Safari
- ✅ Works on Edge
- ✅ Works on mobile browsers

### Test 6: Connection Quality
**Objective:** Test video call under different network conditions

**Steps:**
1. Join a call with good internet connection
2. Test with moderate connection (throttle to 3G)
3. Test with poor connection (throttle to 2G)
4. Test reconnection after temporary disconnect

**Expected Result:**
- ✅ Good quality with strong connection
- ✅ Acceptable quality with moderate connection
- ✅ Graceful degradation with poor connection
- ✅ Automatic reconnection works

### Test 7: Multiple Participants
**Objective:** Verify that only intended participants can join

**Steps:**
1. Generate a video link for a consultation
2. Open the link in 3+ different browsers/devices
3. Verify all can join (Jitsi allows multiple participants)
4. Note: This is expected behavior for Jitsi Meet

**Expected Result:**
- ✅ Multiple participants can join
- ⚠️ Note: Jitsi Meet rooms are public by default
- 💡 For production, consider implementing room passwords or authentication

### Test 8: Mobile Device Testing
**Objective:** Ensure video calls work on mobile devices

**Steps:**
1. Send consultation email to mobile device
2. Open email on mobile
3. Click "Join Video Consultation" button
4. Test video/audio on mobile

**Expected Result:**
- ✅ Email opens correctly on mobile
- ✅ Video link opens in mobile browser
- ✅ Camera and microphone work on mobile
- ✅ Call controls are accessible on mobile

## Test Results Template

```
Test Date: [DATE]
Tester: [NAME]
Environment: [Development/Staging/Production]

| Test Case | Status | Notes |
|-----------|--------|-------|
| Video Link Generation | ✅/❌ | |
| Email Delivery | ✅/❌ | |
| Video Call Functionality | ✅/❌ | |
| Call Controls | ✅/❌ | |
| Browser Compatibility | ✅/❌ | |
| Connection Quality | ✅/❌ | |
| Multiple Participants | ✅/❌ | |
| Mobile Device Testing | ✅/❌ | |

Overall Status: ✅ PASS / ❌ FAIL
```

## Known Limitations

1. **Public Rooms**: Jitsi Meet rooms are public by default. Anyone with the link can join.
   - **Mitigation**: Use long, random room IDs (already implemented)
   - **Future Enhancement**: Implement room passwords or JWT authentication

2. **No Built-in Recording**: Recording requires additional setup
   - **Solution**: Users can use browser extensions or Jitsi's recording feature

3. **Bandwidth Requirements**: Requires stable internet connection
   - **Minimum**: 2 Mbps for video calls
   - **Recommended**: 5+ Mbps for HD quality

## Troubleshooting

### Issue: Video link doesn't open
**Solution:**
- Check if link is properly formatted
- Verify Jitsi Meet service is accessible
- Try opening in incognito/private mode

### Issue: Camera/Microphone not working
**Solution:**
- Check browser permissions
- Ensure device has camera/microphone
- Try different browser
- Check if other apps are using camera/microphone

### Issue: Poor video quality
**Solution:**
- Check internet connection speed
- Close other bandwidth-intensive applications
- Reduce video quality in settings
- Use audio-only mode if needed

### Issue: Cannot hear other participant
**Solution:**
- Check speaker/headphone connection
- Verify volume is not muted
- Check browser audio permissions
- Ask other participant to unmute

## Security Considerations

1. **Link Privacy**: Video links should only be shared via secure channels (email)
2. **Room Expiry**: Consider implementing room expiry after consultation
3. **Participant Verification**: In production, implement additional authentication
4. **Data Privacy**: Jitsi Meet supports end-to-end encryption
5. **HIPAA Compliance**: For healthcare, consider self-hosting Jitsi or using HIPAA-compliant alternatives

## Performance Metrics

Track these metrics during testing:
- Video link generation time: < 100ms
- Email delivery time: < 5 seconds
- Video call connection time: < 3 seconds
- Video quality: 720p minimum
- Audio quality: Clear, no echo
- Latency: < 200ms

## Next Steps

After successful testing:
1. ✅ Document any issues found
2. ✅ Update implementation if needed
3. ✅ Conduct user acceptance testing
4. ✅ Prepare for production deployment
5. ✅ Set up monitoring and analytics

## Additional Resources

- [Jitsi Meet Documentation](https://jitsi.github.io/handbook/docs/intro)
- [Jitsi Meet API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)
