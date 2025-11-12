const Message = require('../models/Message');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and content are required'
      });
    }

    // Determine sender and recipient models
    let senderModel, recipientModel;
    
    if (senderRole === 'patient') {
      senderModel = 'Patient';
      recipientModel = 'Doctor'; // Patients can only message doctors
      
      // Verify recipient is a doctor
      const doctor = await Doctor.findById(recipientId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
    } else if (senderRole === 'doctor') {
      senderModel = 'Doctor';
      recipientModel = 'Patient'; // Doctors can only reply to patients
      
      // Verify recipient is a patient
      const patient = await Patient.findById(recipientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only patients and doctors can send messages'
      });
    }

    const message = new Message({
      senderId,
      senderModel,
      recipientId,
      recipientModel,
      content
    });
    await message.save();

    res.status(201).json({
      success: true,
      messageId: message._id
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get messages (conversation)
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationWith = req.params.userId || req.query.conversationWith;

    if (!conversationWith) {
      return res.status(400).json({
        success: false,
        message: 'conversationWith parameter is required'
      });
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

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

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
          lastMessage: message.content,
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
