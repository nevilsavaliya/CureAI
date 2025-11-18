const socketIO = require('socket.io');
const authService = require('./authService');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // Map userId to socket.id
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:4200',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupConnectionHandler();
    console.log('Socket.IO server initialized');
  }

  /**
   * Set up connection event handler
   */
  setupConnectionHandler() {
    this.io.on('connection', (socket) => {
      console.log('New socket connection attempt:', socket.id);

      // Authenticate the socket connection
      this.authenticateSocket(socket);
    });
  }

  /**
   * Authenticate socket connection using JWT token
   * @param {Object} socket - Socket instance
   */
  authenticateSocket(socket) {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      console.log('Socket authentication failed: No token provided');
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect();
      return;
    }

    try {
      // Verify JWT token
      const decoded = authService.verifyToken(token);
      
      // Attach user info to socket
      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      // Store socket connection
      this.userSockets.set(decoded.id.toString(), socket.id);

      console.log(`Socket authenticated: User ${decoded.id} (${decoded.role})`);

      // Emit authentication success
      socket.emit('authenticated', {
        userId: decoded.id,
        role: decoded.role
      });

      // Set up event handlers for authenticated socket
      this.setupSocketEventHandlers(socket);

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: User ${socket.userId}`);
        this.userSockets.delete(socket.userId.toString());
      });

    } catch (error) {
      console.log('Socket authentication failed:', error.message);
      socket.emit('error', { message: 'Invalid or expired token' });
      socket.disconnect();
    }
  }

  /**
   * Set up event handlers for authenticated socket
   * @param {Object} socket - Authenticated socket instance
   */
  setupSocketEventHandlers(socket) {
    // Join case room
    socket.on('join_case', (data) => {
      this.handleJoinCase(socket, data);
    });

    // Leave case room
    socket.on('leave_case', (data) => {
      this.handleLeaveCase(socket, data);
    });

    // Send message
    socket.on('send_message', (data) => {
      this.handleSendMessage(socket, data);
    });

    // Typing indicator
    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });

    // Stop typing indicator
    socket.on('stop_typing', (data) => {
      this.handleStopTyping(socket, data);
    });
  }

  /**
   * Handle join case room event
   * @param {Object} socket - Socket instance
   * @param {Object} data - { caseId }
   */
  handleJoinCase(socket, data) {
    const { caseId } = data;

    if (!caseId) {
      socket.emit('error', { message: 'Case ID is required' });
      return;
    }

    const roomName = `case_${caseId}`;
    socket.join(roomName);
    
    console.log(`User ${socket.userId} joined case room: ${roomName}`);
    
    socket.emit('joined_case', { caseId });
  }

  /**
   * Handle leave case room event
   * @param {Object} socket - Socket instance
   * @param {Object} data - { caseId }
   */
  handleLeaveCase(socket, data) {
    const { caseId } = data;

    if (!caseId) {
      return;
    }

    const roomName = `case_${caseId}`;
    socket.leave(roomName);
    
    console.log(`User ${socket.userId} left case room: ${roomName}`);
  }

  /**
   * Handle send message event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Message data
   */
  handleSendMessage(socket, data) {
    const { caseId, message } = data;

    if (!caseId || !message) {
      socket.emit('error', { message: 'Case ID and message are required' });
      return;
    }

    // This will be called from the message controller after saving to DB
    // For now, just acknowledge receipt
    socket.emit('message_sent', { caseId, messageId: message._id });
  }

  /**
   * Handle typing indicator event
   * @param {Object} socket - Socket instance
   * @param {Object} data - { caseId }
   */
  handleTyping(socket, data) {
    const { caseId } = data;

    if (!caseId) {
      return;
    }

    const roomName = `case_${caseId}`;
    
    // Broadcast to other users in the room
    socket.to(roomName).emit('user_typing', {
      caseId,
      userId: socket.userId,
      userRole: socket.userRole
    });
  }

  /**
   * Handle stop typing indicator event
   * @param {Object} socket - Socket instance
   * @param {Object} data - { caseId }
   */
  handleStopTyping(socket, data) {
    const { caseId } = data;

    if (!caseId) {
      return;
    }

    const roomName = `case_${caseId}`;
    
    // Broadcast to other users in the room
    socket.to(roomName).emit('user_stop_typing', {
      caseId,
      userId: socket.userId
    });
  }

  /**
   * Emit new message to case room
   * @param {String} caseId - Case ID
   * @param {Object} message - Message object
   */
  emitNewMessage(caseId, message) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    const roomName = `case_${caseId}`;
    this.io.to(roomName).emit('new_message', {
      caseId,
      message
    });

    console.log(`Emitted new message to room: ${roomName}`);
  }

  /**
   * Emit message read event to case room
   * @param {String} caseId - Case ID
   * @param {String} messageId - Message ID
   * @param {String} readBy - User ID who read the message
   */
  emitMessageRead(caseId, messageId, readBy) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    const roomName = `case_${caseId}`;
    this.io.to(roomName).emit('message_read', {
      caseId,
      messageId,
      readBy,
      readAt: new Date()
    });

    console.log(`Emitted message read to room: ${roomName}`);
  }

  /**
   * Emit case updated event to case room
   * @param {String} caseId - Case ID
   * @param {Object} updateData - Update data
   */
  emitCaseUpdated(caseId, updateData) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    const roomName = `case_${caseId}`;
    this.io.to(roomName).emit('case_updated', {
      caseId,
      ...updateData
    });

    console.log(`Emitted case updated to room: ${roomName}`);
  }

  /**
   * Emit notification to specific user
   * @param {String} userId - User ID
   * @param {Object} notification - Notification object
   */
  emitNotification(userId, notification) {
    if (!this.io) {
      console.error('Socket.IO not initialized');
      return;
    }

    const socketId = this.userSockets.get(userId.toString());
    
    if (socketId) {
      this.io.to(socketId).emit('new_notification', notification);
      console.log(`Emitted notification to user: ${userId}`);
    } else {
      console.log(`User ${userId} not connected, notification will be stored`);
    }
  }

  /**
   * Get Socket.IO instance
   * @returns {Object} Socket.IO instance
   */
  getIO() {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }
    return this.io;
  }

  /**
   * Check if user is connected
   * @param {String} userId - User ID
   * @returns {Boolean}
   */
  isUserConnected(userId) {
    return this.userSockets.has(userId.toString());
  }
}

module.exports = new SocketService();
