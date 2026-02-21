const { asyncHandler, sendSuccess, sendCreated, sendError, sendNotFound, sendForbidden, validateRequiredFields } = require('../core/controllers');
const MessageService = require('../core/services/MessageService');
const MessageRepository = require('../core/repositories/MessageRepository');
const Message = require('../models/Message');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Case = require('../models/Case');
const socketService = require('../services/socketService');
const { processMessageForSymptoms } = require('../services/symptomExtractor');

// Initialize repositories
const messageRepository = new MessageRepository(Message);

// Initialize MessageService
const messageService = new MessageService(messageRepository, {
  socketService
});

// Send message
exports.sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user.id;
  const senderRole = req.user.role;
  const { recipientId, content } = req.body;

  const missingFields = validateRequiredFields(req.body, ['recipientId', 'content']);
  if (missingFields) {
    return sendError(res, `Missing required fields: ${missingFields.join(', ')}`, 400);
  }

  // Determine sender and recipient models
  let senderModel, recipientModel;
  
  if (senderRole === 'patient') {
    senderModel = 'Patient';
    recipientModel = 'Doctor'; // Patients can only message doctors
    
    // Verify recipient is a doctor
    const doctor = await Doctor.findById(recipientId);
    if (!doctor) {
      return sendNotFound(res, 'Doctor not found');
    }
  } else if (senderRole === 'doctor') {
    senderModel = 'Doctor';
    recipientModel = 'Patient'; // Doctors can only reply to patients
    
    // Verify recipient is a patient
    const patient = await Patient.findById(recipientId);
    if (!patient) {
      return sendNotFound(res, 'Patient not found');
    }
  } else {
    return sendForbidden(res, 'Only patients and doctors can send messages');
  }

  // Create encrypted message
  const message = await Message.createEncrypted({
    senderId,
    senderModel,
    recipientId,
    recipientModel,
    content
  });

  return sendCreated(res, { messageId: message._id }, 'Message sent successfully');
});

// Get messages (conversation)
exports.getMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const conversationWith = req.params.userId || req.query.conversationWith;

  if (!conversationWith) {
    return sendError(res, 'conversationWith parameter is required', 400);
  }

  const messages = await Message.find({
    $or: [
      { senderId: userId, recipientId: conversationWith },
      { senderId: conversationWith, recipientId: userId }
    ]
  })
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email')
    .sort({ sentAt: 1 });

  // Decrypt messages for response
  const decryptedMessages = messages.map(message => {
    const messageObj = message.toObject();
    messageObj.content = message.getDecryptedContent();
    return messageObj;
  });

  return sendSuccess(res, { messages: decryptedMessages }, 'Messages retrieved successfully');
});

// Mark message as read
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await Message.findById(id);
  if (!message) {
    return sendNotFound(res, 'Message not found');
  }

  message.isRead = true;
  message.readAt = new Date();
  await message.save();

  return sendSuccess(res, null, 'Message marked as read');
});

// Get all conversations for a doctor (patients who have messaged them)
exports.getDoctorConversations = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }

    const Symptom = require('../models/Symptom');
    const Prediction = require('../models/Prediction');

    // Get all unique patients who have messaged this doctor
    const messages = await Message.find({
      recipientId: doctorId,
      recipientModel: 'Doctor'
    })
      .populate('senderId', 'name email bloodGroup')
      .sort({ sentAt: -1 });

    // Group by patient and get latest message
    const conversationsMap = new Map();
    
    for (const message of messages) {
      const patientId = message.senderId._id.toString();
      if (!conversationsMap.has(patientId)) {
        conversationsMap.set(patientId, {
          patient: message.senderId,
          lastMessage: message.getDecryptedContent(),
          lastMessageTime: message.sentAt,
          unreadCount: message.isRead ? 0 : 1
        });
      } else {
        const conv = conversationsMap.get(patientId);
        if (!message.isRead) {
          conv.unreadCount++;
        }
      }
    }

    // Fetch symptoms and predictions for each patient
    const conversations = [];
    for (const [patientId, conv] of conversationsMap) {
      // Get latest symptom
      const latestSymptom = await Symptom.findOne({ patientId })
        .sort({ submittedAt: -1 })
        .limit(1);

      // Get latest prediction
      const latestPrediction = await Prediction.findOne({ patientId })
        .sort({ createdAt: -1 })
        .limit(1);

      conversations.push({
        ...conv,
        symptoms: latestSymptom ? latestSymptom.symptomText : null,
        predictions: latestPrediction ? latestPrediction.diseases : []
      });
    }

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// Case-specific messaging endpoints
// ============================================

// Send message in a case
exports.sendCaseMessage = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot exceed 5000 characters'
      });
    }

    // Fetch case
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify user has access to this case
    const isPatient = senderRole === 'patient' && caseData.patientId.toString() === senderId;
    const isDoctor = senderRole === 'doctor' && caseData.doctorId.toString() === senderId;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to send messages in this case'
      });
    }

    // Verify case is in ongoing status (can only message in ongoing cases)
    // This ensures treated cases remain read-only and data is preserved
    if (caseData.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: `Cannot send messages in a case with status: ${caseData.status}. Treated and completed cases are read-only to preserve medical records.`
      });
    }

    // Determine sender and receiver
    let senderModel, receiverId, receiverModel;
    
    if (senderRole === 'patient') {
      senderModel = 'Patient';
      receiverId = caseData.doctorId;
      receiverModel = 'Doctor';
    } else {
      senderModel = 'Doctor';
      receiverId = caseData.patientId;
      receiverModel = 'Patient';
    }

    // Create encrypted message
    const message = await Message.createEncrypted({
      caseId,
      senderId,
      senderModel,
      recipientId: receiverId,
      recipientModel: receiverModel,
      content: content.trim(),
      messageType: 'text'
    });

    // Update case's lastMessageAt timestamp
    await caseData.updateLastMessage();

    // Extract symptoms from patient messages automatically
    if (senderRole === 'patient') {
      try {
        await processMessageForSymptoms(message);
      } catch (symptomError) {
        console.error('Failed to extract symptoms from message:', symptomError);
        // Continue even if symptom extraction fails - message is saved
      }
    }

    // Populate sender and recipient details
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email');

    // Prepare decrypted message for response and WebSocket
    const decryptedMessageData = populatedMessage.toObject();
    decryptedMessageData.content = populatedMessage.getDecryptedContent();

    // Broadcast message via WebSocket
    try {
      socketService.emitNewMessage(caseId, decryptedMessageData);
    } catch (socketError) {
      console.error('Failed to broadcast message via WebSocket:', socketError);
      // Continue even if WebSocket fails - message is saved in DB
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: decryptedMessageData
    });
  } catch (error) {
    console.error('Error sending case message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

// Get all messages for a case
exports.getCaseMessages = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 50 } = req.query;

    // Fetch case
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify user has access to this case
    const isPatient = userRole === 'patient' && caseData.patientId.toString() === userId;
    const isDoctor = userRole === 'doctor' && caseData.doctorId.toString() === userId;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view messages in this case'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch messages with pagination
    const messages = await Message.find({ caseId })
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Decrypt messages for response
    const decryptedMessages = messages.map(message => {
      const messageObj = message.toObject();
      messageObj.content = message.getDecryptedContent();
      return messageObj;
    });

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ caseId });

    res.status(200).json({
      success: true,
      count: decryptedMessages.length,
      totalMessages,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalMessages / parseInt(limit)),
      messages: decryptedMessages
    });
  } catch (error) {
    console.error('Error fetching case messages:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch messages'
    });
  }
};

// Mark message as read (case-specific)
exports.markCaseMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch message
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user is the recipient of this message
    if (message.recipientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only mark messages sent to you as read'
      });
    }

    // If message is associated with a case, verify access
    if (message.caseId) {
      const caseData = await Case.findById(message.caseId);
      if (caseData) {
        const isPatient = userRole === 'patient' && caseData.patientId.toString() === userId;
        const isDoctor = userRole === 'doctor' && caseData.doctorId.toString() === userId;

        if (!isPatient && !isDoctor) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to access this message'
          });
        }
      }
    }

    // Mark message as read
    if (!message.isRead) {
      await message.markAsRead();

      // Broadcast message read event via WebSocket
      if (message.caseId) {
        try {
          socketService.emitMessageRead(message.caseId.toString(), message._id.toString(), userId);
        } catch (socketError) {
          console.error('Failed to broadcast message read via WebSocket:', socketError);
          // Continue even if WebSocket fails
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark message as read'
    });
  }
};
