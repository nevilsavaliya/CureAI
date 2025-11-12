const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const Symptom = require('../models/Symptom');
const Prediction = require('../models/Prediction');

// Get platform metrics
exports.getMetrics = async (req, res) => {
  try {
    // Count from separate collections
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    const totalSymptoms = await Symptom.countDocuments();
    const totalPredictions = await Prediction.countDocuments();

    // Calculate total registered users across all collections
    const totalRegisteredUsers = totalPatients + totalDoctors + totalAdmins;

    // Active users (logged in within last 7 days) - query all three collections
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activePatientsCount = await Patient.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });
    
    const activeDoctorsCount = await Doctor.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });
    
    const activeAdminsCount = await Admin.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });
    
    const activeUsers = activePatientsCount + activeDoctorsCount + activeAdminsCount;

    res.status(200).json({
      success: true,
      totalPatients,
      totalDoctors,
      totalAdmins,
      totalRegisteredUsers,
      totalSymptoms,
      totalPredictions,
      activeUsers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all users from separate collections
exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    let users = [];

    // Build search query if provided
    let searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch from appropriate collection(s) based on role filter
    if (!role || role === 'patient') {
      const patients = await Patient.find(searchQuery)
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();
      
      // Add collection type to each user
      const patientsWithType = patients.map(patient => ({
        ...patient,
        collectionType: 'patient',
        role: 'patient'
      }));
      users = users.concat(patientsWithType);
    }

    if (!role || role === 'doctor') {
      const doctors = await Doctor.find(searchQuery)
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();
      
      // Add collection type to each user
      const doctorsWithType = doctors.map(doctor => ({
        ...doctor,
        collectionType: 'doctor',
        role: 'doctor'
      }));
      users = users.concat(doctorsWithType);
    }

    if (!role || role === 'admin') {
      const admins = await Admin.find(searchQuery)
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();
      
      // Add collection type to each user
      const adminsWithType = admins.map(admin => ({
        ...admin,
        collectionType: 'admin',
        role: 'admin'
      }));
      users = users.concat(adminsWithType);
    }

    // Sort all users by creation date
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get user detail from separate collections
exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { collectionType } = req.query; // Optional: specify which collection to search

    let user = null;
    let userCollectionType = null;

    // If collection type is specified, search only that collection
    if (collectionType) {
      if (collectionType === 'patient') {
        user = await Patient.findById(id).select('-password').lean();
        userCollectionType = 'patient';
      } else if (collectionType === 'doctor') {
        user = await Doctor.findById(id).select('-password').lean();
        userCollectionType = 'doctor';
      } else if (collectionType === 'admin') {
        user = await Admin.findById(id).select('-password').lean();
        userCollectionType = 'admin';
      }
    } else {
      // Search all collections if type not specified
      user = await Patient.findById(id).select('-password').lean();
      if (user) {
        userCollectionType = 'patient';
      } else {
        user = await Doctor.findById(id).select('-password').lean();
        if (user) {
          userCollectionType = 'doctor';
        } else {
          user = await Admin.findById(id).select('-password').lean();
          if (user) {
            userCollectionType = 'admin';
          }
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add collection type and role to response
    user.collectionType = userCollectionType;
    user.role = userCollectionType;

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
