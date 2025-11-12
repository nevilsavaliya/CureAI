const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

class ProfileService {
  // Create or update patient profile
  async savePatientProfile(userId, profileData) {
    try {
      let patient = await Patient.findOne({ userId });
      
      if (patient) {
        // Update existing profile
        Object.assign(patient, profileData);
        await patient.save();
      } else {
        // Create new profile
        patient = new Patient({
          userId,
          ...profileData
        });
        await patient.save();
      }
      
      return patient;
    } catch (error) {
      throw error;
    }
  }

  // Create or update doctor profile
  async saveDoctorProfile(userId, profileData) {
    try {
      let doctor = await Doctor.findOne({ userId });
      
      if (doctor) {
        // Update existing profile
        Object.assign(doctor, profileData);
        await doctor.save();
      } else {
        // Create new profile
        doctor = new Doctor({
          userId,
          ...profileData
        });
        await doctor.save();
      }
      
      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Get patient profile by userId
  async getPatientProfile(userId) {
    try {
      const patient = await Patient.findOne({ userId }).populate('userId', 'name email');
      return patient;
    } catch (error) {
      throw error;
    }
  }

  // Get doctor profile by userId
  async getDoctorProfile(userId) {
    try {
      const doctor = await Doctor.findOne({ userId }).populate('userId', 'name email');
      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Get profile by userId (auto-detect type)
  async getProfile(userId, role) {
    try {
      if (role === 'patient') {
        return await this.getPatientProfile(userId);
      } else if (role === 'doctor') {
        return await this.getDoctorProfile(userId);
      }
      return null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProfileService();
