const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const videoService = require('../services/videoService');

// Schedule consultation
exports.scheduleConsultation = async (req, res) => {
  try {
    const { patientId, doctorId, scheduledDate, scheduledTime } = req.body;

    if (!patientId || !doctorId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Generate unique video room using video service
    const { roomId, videoLink } = videoService.generateVideoRoom(`${patientId}-${doctorId}`);

    const consultation = new Consultation({
      patientId,
      doctorId,
      scheduledDate,
      scheduledTime,
      roomId,
      videoLink
    });
    await consultation.save();

    // Send consultation emails to both patient and doctor
    try {
      const emailService = require('../services/emailService');

      const patient = await Patient.findById(patientId);
      const doctor = await Doctor.findById(doctorId);

      if (patient && doctor) {
        const consultationDetails = {
          consultationId: consultation._id,
          doctorName: doctor.name,
          patientName: patient.name,
          date: scheduledDate,
          time: scheduledTime,
          videoLink: videoLink
        };

        // Send email to patient
        await emailService.sendConsultationEmail(patient.email, consultationDetails, 'patient');
        
        // Send email to doctor
        await emailService.sendConsultationEmail(doctor.email, consultationDetails, 'doctor');
      }
    } catch (emailError) {
      console.error('Error sending consultation emails:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      consultation: {
        _id: consultation._id,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        scheduledDate: consultation.scheduledDate,
        scheduledTime: consultation.scheduledTime,
        videoLink: consultation.videoLink,
        status: consultation.status
      },
      emailSent: true
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get consultations
exports.getConsultations = async (req, res) => {
  try {
    const { role, userId } = req.params;
    const targetUserId = userId || req.user.id;

    let query = {};
    
    if (role === 'patient') {
      query.patientId = targetUserId;
    } else if (role === 'doctor') {
      query.doctorId = targetUserId;
    }

    const consultations = await Consultation.find(query)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      consultations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update consultation status
exports.updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    consultation.status = status;
    if (status === 'in-progress') {
      consultation.startedAt = new Date();
    } else if (status === 'completed') {
      consultation.endedAt = new Date();
    }
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Consultation updated',
      consultation: {
        _id: consultation._id,
        status: consultation.status,
        startedAt: consultation.startedAt,
        endedAt: consultation.endedAt
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Join consultation (for video call)
exports.joinConsultation = async (req, res) => {
  try {
    const { id } = req.params;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Generate room ID if not exists
    if (!consultation.roomId) {
      consultation.roomId = `room_${consultation._id}`;
      consultation.status = 'in-progress';
      consultation.startedAt = new Date();
      await consultation.save();
    }

    res.status(200).json({
      success: true,
      roomId: consultation.roomId,
      token: `token_${consultation._id}_${req.user.id}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get video link (public endpoint for email links)
exports.getVideoLink = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    res.status(200).json({
      success: true,
      videoLink: consultation.videoLink,
      roomId: consultation.roomId,
      scheduledDate: consultation.scheduledDate,
      scheduledTime: consultation.scheduledTime
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
