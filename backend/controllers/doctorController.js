const { asyncHandler, sendSuccess, sendNotFound } = require('../core/controllers');
const DoctorService = require('../core/services/DoctorService');
const DoctorRepository = require('../core/repositories/DoctorRepository');
const PatientRepository = require('../core/repositories/PatientRepository');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Prediction = require('../models/Prediction');
const { getAllSpecializations } = require('../services/diseaseSpecializationMapping');
const { getRecommendedDoctors } = require('../services/universalDoctorMatcher');

// Initialize repositories
const doctorRepository = new DoctorRepository(Doctor);
const patientRepository = new PatientRepository(Patient);

// Initialize DoctorService
const doctorService = new DoctorService(doctorRepository, {
  patientRepository
});

// Get doctors by specialization with ML-based matching
// Integrates Universal Doctor Matcher service to ensure General Medicine doctors are always included
exports.matchDoctors = asyncHandler(async (req, res) => {
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
  return sendSuccess(res, {
    doctors,
    matchedSpecializations: specializationArray,
    includesGeneralMedicine: true
  }, 'Doctors matched successfully');
});

// Get patient records for doctor
exports.getPatientRecords = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Find doctor by email (since we store email directly in Doctor model now)
  const doctor = await Doctor.findOne({ email: req.user.email });
  if (!doctor) {
    return sendNotFound(res, 'Doctor profile not found');
  }

  // Get predictions matching doctor's speciality
  const predictions = await Prediction.find({
    'diseases.specialization': doctor.speciality
  })
    .populate('patientId', 'name email bloodGroup')
    .populate('symptomId')
    .sort({ createdAt: -1 })
    .limit(50);

  return sendSuccess(res, { patients: predictions }, 'Patient records retrieved successfully');
});

// Get patient detail
exports.getPatientDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const patient = await Patient.findById(id)
    .select('name email dateOfBirth bloodGroup contactNumber');

  if (!patient) {
    return sendNotFound(res, 'Patient not found');
  }

  const predictions = await Prediction.find({ patientId: id })
    .populate('symptomId')
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    patient: {
      ...patient.toObject(),
      predictions
    }
  }, 'Patient details retrieved successfully');
});


// Get all available specializations
exports.getAllSpecializations = asyncHandler(async (req, res) => {
  const specializations = getAllSpecializations();
  
  return sendSuccess(res, { specializations }, 'Specializations retrieved successfully');
});

// Get recommended doctors with specialization filtering
// Always includes General Medicine doctors in all responses
// Accepts specialization array in query params
exports.getRecommendedDoctors = asyncHandler(async (req, res) => {
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

  return sendSuccess(res, {
    doctors,
    requestedSpecializations: specializationArray,
    includesGeneralMedicine: true
  }, 'General Medicine doctors are always included in recommendations');
});
