const Feedback = require('../models/Feedback');
const Doctor = require('../models/Doctor');

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { consultationId, rating, comment } = req.body;

    if (!consultationId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Consultation ID and rating are required'
      });
    }

    const feedback = new Feedback({
      consultationId,
      userId,
      userRole: req.user.role,
      rating,
      comment
    });
    await feedback.save();

    // Update doctor rating if feedback is from patient
    if (req.user.role === 'patient') {
      const consultation = await require('../models/Consultation').findById(consultationId);
      if (consultation) {
        const doctor = await Doctor.findById(consultation.doctorId);
        if (doctor) {
          const totalRating = (doctor.rating * doctor.totalReviews) + rating;
          doctor.totalReviews += 1;
          doctor.rating = totalRating / doctor.totalReviews;
          await doctor.save();
        }
      }
    }

    res.status(201).json({
      success: true,
      feedbackId: feedback._id
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get doctor feedback
exports.getDoctorFeedback = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const consultations = await require('../models/Consultation').find({ doctorId });
    const consultationIds = consultations.map(c => c._id);

    const feedback = await Feedback.find({
      consultationId: { $in: consultationIds },
      userRole: 'patient'
    })
      .populate('userId', 'name')
      .sort({ submittedAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      averageRating: doctor.rating,
      totalReviews: doctor.totalReviews,
      feedback
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
