/**
 * Video Service Tests
 * Tests for video room generation and validation
 */

const videoService = require('../services/videoService');

describe('Video Service', () => {
  describe('generateVideoRoom', () => {
    test('should generate unique video room with valid structure', () => {
      const consultationId = 'test-consultation-123';
      const result = videoService.generateVideoRoom(consultationId);
      
      expect(result).toHaveProperty('roomId');
      expect(result).toHaveProperty('videoLink');
      expect(result.roomId).toContain('healthcare-');
      expect(result.videoLink).toContain('https://meet.jit.si/');
    });

    test('should generate different room IDs for multiple calls', () => {
      const result1 = videoService.generateVideoRoom('consultation-1');
      const result2 = videoService.generateVideoRoom('consultation-2');
      
      expect(result1.roomId).not.toBe(result2.roomId);
      expect(result1.videoLink).not.toBe(result2.videoLink);
    });

    test('should include consultation ID in room name', () => {
      const consultationId = 'patient123-doctor456';
      const result = videoService.generateVideoRoom(consultationId);
      
      expect(result.roomId).toContain(consultationId);
    });
  });

  describe('validateVideoLink', () => {
    test('should validate correct Jitsi Meet links', () => {
      const validLink = 'https://meet.jit.si/healthcare-test-room-123';
      expect(videoService.validateVideoLink(validLink)).toBe(true);
    });

    test('should reject invalid links', () => {
      expect(videoService.validateVideoLink('http://invalid.com/room')).toBe(false);
      expect(videoService.validateVideoLink('not-a-url')).toBe(false);
      expect(videoService.validateVideoLink('')).toBe(false);
      expect(videoService.validateVideoLink(null)).toBe(false);
    });

    test('should reject malformed Jitsi links', () => {
      expect(videoService.validateVideoLink('https://meet.jit.si/')).toBe(false);
      expect(videoService.validateVideoLink('https://meet.jit.si/room with spaces')).toBe(false);
    });
  });

  describe('extractRoomId', () => {
    test('should extract room ID from valid video link', () => {
      const videoLink = 'https://meet.jit.si/healthcare-test-room-123';
      const roomId = videoService.extractRoomId(videoLink);
      
      expect(roomId).toBe('healthcare-test-room-123');
    });

    test('should return null for invalid links', () => {
      expect(videoService.extractRoomId('invalid-link')).toBe(null);
      expect(videoService.extractRoomId('')).toBe(null);
    });
  });

  describe('generateRoomConfig', () => {
    test('should generate valid room configuration', () => {
      const config = videoService.generateRoomConfig({
        roomName: 'test-room',
        displayName: 'Dr. Smith',
        email: 'doctor@test.com'
      });
      
      expect(config).toHaveProperty('roomName');
      expect(config).toHaveProperty('userInfo');
      expect(config).toHaveProperty('configOverwrite');
      expect(config).toHaveProperty('interfaceConfigOverwrite');
      expect(config.userInfo.displayName).toBe('Dr. Smith');
    });

    test('should apply default audio/video settings', () => {
      const config = videoService.generateRoomConfig({
        roomName: 'test-room',
        displayName: 'Patient'
      });
      
      expect(config.configOverwrite.startWithAudioMuted).toBe(false);
      expect(config.configOverwrite.startWithVideoMuted).toBe(false);
    });

    test('should allow custom audio/video settings', () => {
      const config = videoService.generateRoomConfig({
        roomName: 'test-room',
        displayName: 'Patient',
        startWithAudioMuted: true,
        startWithVideoMuted: true
      });
      
      expect(config.configOverwrite.startWithAudioMuted).toBe(true);
      expect(config.configOverwrite.startWithVideoMuted).toBe(true);
    });
  });

  describe('getServiceInfo', () => {
    test('should return service information', () => {
      const info = videoService.getServiceInfo();
      
      expect(info).toHaveProperty('provider');
      expect(info).toHaveProperty('features');
      expect(info).toHaveProperty('limitations');
      expect(info).toHaveProperty('documentation');
      expect(info.provider).toBe('Jitsi Meet');
      expect(Array.isArray(info.features)).toBe(true);
    });
  });
});

// Integration test for video link generation
describe('Video Service Integration', () => {
  test('should generate working video link format', () => {
    const consultationId = 'integration-test-123';
    const { roomId, videoLink } = videoService.generateVideoRoom(consultationId);
    
    // Verify the link structure
    expect(videoLink).toMatch(/^https:\/\/meet\.jit\.si\/healthcare-/);
    
    // Verify room ID can be extracted back
    const extractedRoomId = videoService.extractRoomId(videoLink);
    expect(extractedRoomId).toBe(roomId);
    
    // Verify link is valid
    expect(videoService.validateVideoLink(videoLink)).toBe(true);
  });
});
