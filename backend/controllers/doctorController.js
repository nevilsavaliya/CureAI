const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Prediction = require('../models/Prediction');
const { getAllSpecializations } = require('../services/diseaseSpecializationMapping');
const { getRecommendedDoctors } = require('../services/universalDoctorMatcher');

// Get doctors by specialization with ML-based matching
// Integrates Universal Doctor Matcher service to ensure General Medicine doctors are always included
exports.matchDoctors = async (req, res) => {
  try {
    const { specializations, patientId, location, limit } = req.query;

    // Parse specializations from query params
    let specializationArray = [];
    if (specializations) {
      specializationArray = Array.isArray(specializations) 
        ? specializations 
        : specializations.split(',').map(s => s.trim());
    }

    // Use Universal Doctor Matcher service
    // This automatically includes General Medicine doctors and adds relevance scoring
    const options = {
      location: location || null,
      limit: limit ? parseInt(limit) : 20
    };

    const doctors = await getRecommendedDoctors(specializationArray, options);

    // Return top matches (limit already applied in service)
    res.status(200).json({
      success: true,
      doctors: doctors,
      matchedSpecializations: specializationArray,
      includesGeneralMedicine: true // Indicator that General Medicine doctors are included
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

// Get recommended doctors with specialization filtering
// Always includes General Medicine doctors in all responses
// Accepts specialization array in query params
exports.getRecommendedDoctors = async (req, res) => {
  try {
    const { specializations, location, limit } = req.query;

    // Parse specializations from query params
    let specializationArray = [];
    if (specializations) {
      specializationArray = Array.isArray(specializations) 
        ? specializations 
        : specializations.split(',').map(s => s.trim());
    }

    // Use Universal Doctor Matcher service
    // This automatically appends General Medicine to the filter
    const options = {
      location: location || null,
      limit: limit ? parseInt(limit) : 20
    };

    const doctors = await getRecommendedDoctors(specializationArray, options);

    res.status(200).json({
      success: true,
      doctors: doctors,
      requestedSpecializations: specializationArray,
      includesGeneralMedicine: true,
      message: 'General Medicine doctors are always included in recommendations'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
