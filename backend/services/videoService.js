/**
 * Video Service
 * Handles video call room generation and management using Jitsi Meet
 */

class VideoService {
  /**
   * Generate a unique video room link for a consultation
   * Using Jitsi Meet as the video service (free, open-source, no API key required)
   * 
   * @param {string} consultationId - The consultation ID
   * @returns {object} - Object containing roomId and videoLink
   */
  generateVideoRoom(consultationId) {
    // Generate unique room ID
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const roomId = `healthcare-${consultationId}-${timestamp}-${randomString}`;
    
    // Generate Jitsi Meet video link
    // Jitsi Meet is free and doesn't require API keys
    const videoLink = `https://meet.jit.si/${roomId}`;
    
    return {
      roomId,
      videoLink
    };
  }

  /**
   * Validate if a video link is properly formatted
   * 
   * @param {string} videoLink - The video link to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  validateVideoLink(videoLink) {
    if (!videoLink) return false;
    
    // Check if it's a valid Jitsi Meet URL
    const jitsiPattern = /^https:\/\/meet\.jit\.si\/[\w-]+$/;
    return jitsiPattern.test(videoLink);
  }

  /**
   * Extract room ID from video link
   * 
   * @param {string} videoLink - The video link
   * @returns {string|null} - The room ID or null if invalid
   */
  extractRoomId(videoLink) {
    if (!this.validateVideoLink(videoLink)) return null;
    
    const parts = videoLink.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Generate video room configuration for frontend
   * This can be used to customize the Jitsi Meet interface
   * 
   * @param {object} options - Configuration options
   * @returns {object} - Jitsi Meet configuration
   */
  generateRoomConfig(options = {}) {
    const {
      roomName,
      displayName,
      email,
      startWithAudioMuted = false,
      startWithVideoMuted = false
    } = options;

    return {
      roomName,
      userInfo: {
        displayName,
        email
      },
      configOverwrite: {
        startWithAudioMuted,
        startWithVideoMuted,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'chat',
          'settings',
          'videoquality',
          'filmstrip',
          'tileview'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false
      }
    };
  }

  /**
   * Get video service information
   * 
   * @returns {object} - Information about the video service
   */
  getServiceInfo() {
    return {
      provider: 'Jitsi Meet',
      features: [
        'Free and open-source',
        'No API key required',
        'End-to-end encryption',
        'Screen sharing',
        'Chat functionality',
        'Recording capability',
        'Mobile support'
      ],
      limitations: [
        'Public rooms (anyone with link can join)',
        'No built-in authentication',
        'Limited customization without self-hosting'
      ],
      documentation: 'https://jitsi.github.io/handbook/docs/intro'
    };
  }
}

module.exports = new VideoService();
