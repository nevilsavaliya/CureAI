const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Prediction = require('../models/Prediction');
const { getAllSpecializations } = require('../services/diseaseSpecializationMapping');

// Get doctors by specialization with ML-based matching
exports.matchDoctors = async (req, res) => {
  try {
    const { specializations, patientId } = req.query;

    // Query doctors collection directly with active subscription filter
    let query = { 
      subscriptionStatus: 'active',
      isActive: true
    };
    
    // If specializations provided (from disease prediction), match doctors
    if (specializations) {
      const specializationArray = Array.isArray(specializations) 
        ? specializations 
        : specializations.split(',').map(s => s.trim());
      
      query.specializations = { $in: specializationArray };
    }

    // Query only registered doctors from doctors collection
    const doctors = await Doctor.find(query)
      .select('name email degree specializations experienceYears contactNumber rating totalReviews')
      .sort({ rating: -1, experienceYears: -1 })
      .limit(20);

    // Calculate match score for each doctor based on specializations
    const doctorsWithScore = doctors.map(doctor => {
      let matchScore = 0;
      if (specializations) {
        const specializationArray = Array.isArray(specializations) 
          ? specializations 
          : specializations.split(',').map(s => s.trim());
        
        // Calculate how many specializations match
        const matchCount = doctor.specializations.filter(spec => 
          specializationArray.includes(spec)
        ).length;
        
        // Score based on match count, experience, and rating
        matchScore = (matchCount * 40) + (doctor.experienceYears * 2) + (doctor.rating * 10);
      } else {
        // Default scoring without specialization match
        matchScore = (doctor.experienceYears * 2) + (doctor.rating * 10);
      }
      
      return {
        ...doctor.toObject(),
        matchScore
      };
    });

    // Sort by match score
    doctorsWithScore.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      doctors: doctorsWithScore.slice(0, 10), // Return top 10 matches
      matchedSpecializations: specializations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get patient records for doctor
exports.getPatientRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find doctor by email (since we store email directly in Doctor model now)
    const doctor = await Doctor.findOne({ email: req.user.email });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Get predictions matching doctor's speciality
    const predictions = await Prediction.find({
      'diseases.specialization': doctor.speciality
    })
      .populate('patientId', 'name email bloodGroup')
      .populate('symptomId')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      patients: predictions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get patient detail
exports.getPatientDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id)
      .select('name email dateOfBirth bloodGroup contactNumber');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const predictions = await Prediction.find({ patientId: id })
      .populate('symptomId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      patient: {
        ...patient.toObject(),
        predictions
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// Get all available specializations
exports.getAllSpecializations = async (req, res) => {
  try {
    const specializations = getAllSpecializations();
    
    res.status(200).json({
      success: true,
      specializations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
