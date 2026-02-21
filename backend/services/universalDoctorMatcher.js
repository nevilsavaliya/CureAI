/**
 * Universal Doctor Matcher Service
 * Implements doctor filtering logic with General Medicine category support
 * Ensures patients always have access to appropriate medical professionals
 */

const Doctor = require('../models/Doctor');

/**
 * Check if a doctor is a General Medicine doctor
 * @param {Object} doctor - Doctor object
 * @returns {boolean} - True if doctor has General Medicine specialization
 */
function isGeneralMedicineDoctor(doctor) {
  if (!doctor || !doctor.specializations) {
    return false;
  }
  
  return doctor.specializations.some(spec => 
    spec.toLowerCase() === 'general medicine'
  );
}

/**
 * Sort doctors by relevance
 * Specialized doctors appear before General Medicine doctors
 * Within each group, sort by rating then experience
 * @param {Array} doctors - Array of doctor objects
 * @param {Array} targetSpecializations - Target specializations to match
 * @returns {Array} - Sorted array of doctors
 */
function sortDoctorsByRelevance(doctors, targetSpecializations) {
  if (!doctors || doctors.length === 0) {
    return [];
  }
  
  // Normalize target specializations to lowercase for comparison
  const normalizedTargets = targetSpecializations.map(s => s.toLowerCase());
  
  return doctors.sort((a, b) => {
    // Check if doctor has target specialization (excluding General Medicine)
    const aHasTarget = a.specializations.some(spec => 
      normalizedTargets.includes(spec.toLowerCase()) && 
      spec.toLowerCase() !== 'general medicine'
    );
    
    const bHasTarget = b.specializations.some(spec => 
      normalizedTargets.includes(spec.toLowerCase()) && 
      spec.toLowerCase() !== 'general medicine'
    );
    
    // Specialized doctors come first
    if (aHasTarget && !bHasTarget) return -1;
    if (!aHasTarget && bHasTarget) return 1;
    
    // Within same category, sort by rating then experience
    if (a.rating !== b.rating) {
      return b.rating - a.rating;
    }
    
    return b.experienceYears - a.experienceYears;
  });
}

/**
 * Ensure at least one doctor is returned
 * Fallback to General Medicine doctors if no specialized doctors found
 * @param {Array} doctors - Current doctor list
 * @param {Object} options - Query options (location, limit, etc.)
 * @returns {Promise<Array>} - Array with at least one doctor
 */
async function ensureMinimumDoctors(doctors, options = {}) {
  // If we already have doctors, return them
  if (doctors && doctors.length > 0) {
    return doctors;
  }
  
  // Fallback: Get any active General Medicine doctors
  try {
    const fallbackDoctors = await Doctor.find({
      specializations: { $in: ['General Medicine'] },
      subscriptionStatus: 'active',
      isActive: true,
      isShadowBanned: { $ne: true } // Exclude shadow-banned doctors
    })
    .select('name email degree specializations rating experienceYears contactNumber clinicAddress')
    .sort({ rating: -1, experienceYears: -1 })
    .limit(options.limit || 5);
    
    return fallbackDoctors;
  } catch (error) {
    console.error('Error fetching fallback doctors:', error);
    return [];
  }
}

/**
 * Get doctors for predicted conditions with General Medicine fallback
 * Prioritizes specialized doctors, includes General Medicine as fallback
 * @param {Array} predictedConditions - Array of predicted conditions with specializations
 * @param {Object} options - Query options (location, limit, etc.)
 * @returns {Promise<Array>} - Array of recommended doctors
 */
async function getDoctorsForConditions(predictedConditions, options = {}) {
  try {
    if (!predictedConditions || predictedConditions.length === 0) {
      // No predictions, return General Medicine doctors
      return await ensureMinimumDoctors([], options);
    }
    
    // Extract all specializations from predictions (excluding General Medicine)
    const specializations = new Set();
    
    predictedConditions.forEach(condition => {
      if (condition.specializations && Array.isArray(condition.specializations)) {
        condition.specializations.forEach(spec => {
          if (spec.toLowerCase() !== 'general medicine') {
            specializations.add(spec);
          }
        });
      }
    });
    
    const specializationArray = Array.from(specializations);
    let doctors = [];
    
    // First, try to get specialized doctors
    if (specializationArray.length > 0) {
      const specializedQuery = {
        subscriptionStatus: 'active',
        isActive: true,
        isShadowBanned: { $ne: true }, // Exclude shadow-banned doctors
        specializations: { $in: specializationArray }
      };
      
      if (options.location) {
        specializedQuery.clinicAddress = { $regex: options.location, $options: 'i' };
      }
      
      doctors = await Doctor.find(specializedQuery)
        .select('name email degree specializations rating experienceYears contactNumber clinicAddress')
        .sort({ rating: -1, experienceYears: -1 });
    }
    
    // Then, add General Medicine doctors
    const generalMedicineQuery = {
      subscriptionStatus: 'active',
      isActive: true,
      isShadowBanned: { $ne: true }, // Exclude shadow-banned doctors
      specializations: { $in: ['General Medicine'] }
    };
    
    if (options.location) {
      generalMedicineQuery.clinicAddress = { $regex: options.location, $options: 'i' };
    }
    
    const generalDoctors = await Doctor.find(generalMedicineQuery)
      .select('name email degree specializations rating experienceYears contactNumber clinicAddress')
      .sort({ rating: -1, experienceYears: -1 });
    
    // Combine: specialized doctors first, then general medicine
    const allDoctors = [...doctors, ...generalDoctors];
    
    // Remove duplicates (in case a doctor has both specialized and general medicine)
    const uniqueDoctors = [];
    const seenIds = new Set();
    
    for (const doctor of allDoctors) {
      const id = doctor._id.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        uniqueDoctors.push(doctor);
      }
    }
    
    // Apply limit
    let finalDoctors = uniqueDoctors;
    if (options.limit) {
      finalDoctors = uniqueDoctors.slice(0, options.limit);
    }
    
    // Ensure at least one doctor is returned
    finalDoctors = await ensureMinimumDoctors(finalDoctors, options);
    
    // Add metadata to each doctor
    const enrichedDoctors = finalDoctors.map(doctor => {
      const doctorObj = doctor.toObject ? doctor.toObject() : doctor;
      
      // Include General Medicine in calculation for relevance
      const allSpecs = [...specializationArray, 'General Medicine'];
      
      return {
        ...doctorObj,
        isGeneralMedicine: isGeneralMedicineDoctor(doctor),
        relevanceScore: calculateRelevanceScore(doctor, allSpecs)
      };
    });
    
    return enrichedDoctors;
  } catch (error) {
    console.error('Error getting doctors for conditions:', error);
    throw error;
  }
}

/**
 * Calculate relevance score for a doctor based on specializations
 * @param {Object} doctor - Doctor object
 * @param {Array} targetSpecializations - Target specializations
 * @returns {number} - Relevance score (0-100)
 */
function calculateRelevanceScore(doctor, targetSpecializations) {
  if (!doctor || !doctor.specializations) {
    return 0;
  }
  
  let score = 0;
  
  // Normalize specializations for comparison
  const normalizedTargets = targetSpecializations.map(s => s.toLowerCase());
  const doctorSpecs = doctor.specializations.map(s => s.toLowerCase());
  
  // Check for exact matches (excluding General Medicine)
  const exactMatches = doctorSpecs.filter(spec => 
    normalizedTargets.includes(spec) && spec !== 'general medicine'
  );
  
  if (exactMatches.length > 0) {
    // Specialized doctor: base score 70 + rating bonus + experience bonus
    score = 70;
    score += (doctor.rating || 0) * 4; // Max 20 points from rating
    score += Math.min((doctor.experienceYears || 0) / 2, 10); // Max 10 points from experience
  } else if (isGeneralMedicineDoctor(doctor)) {
    // General Medicine doctor: base score 50 + rating bonus + experience bonus
    score = 50;
    score += (doctor.rating || 0) * 3; // Max 15 points from rating
    score += Math.min((doctor.experienceYears || 0) / 3, 10); // Max 10 points from experience
  } else {
    // No match (shouldn't happen with proper filtering)
    score = 0;
  }
  
  return Math.min(Math.round(score), 100);
}

/**
 * Get recommended doctors with specialization filtering
 * Always includes General Medicine doctors
 * @param {Array} specializations - Array of specialization names
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of recommended doctors
 */
async function getRecommendedDoctors(specializations = [], options = {}) {
  try {
    // Always append General Medicine to filter
    const specializationsWithGeneral = [...new Set([...specializations, 'General Medicine'])];
    
    // Build query
    const query = {
      subscriptionStatus: 'active',
      isActive: true,
      isShadowBanned: { $ne: true }, // Exclude shadow-banned doctors
      specializations: { $in: specializationsWithGeneral }
    };
    
    // Add location filter if provided
    if (options.location) {
      query.clinicAddress = { $regex: options.location, $options: 'i' };
    }
    
    // Fetch doctors
    let doctors = await Doctor.find(query)
      .select('name email degree specializations rating experienceYears contactNumber clinicAddress')
      .sort({ rating: -1, experienceYears: -1 })
      .limit(options.limit || 20);
    
    // Sort by relevance
    doctors = sortDoctorsByRelevance(doctors, specializationsWithGeneral);
    
    // Ensure at least one doctor
    doctors = await ensureMinimumDoctors(doctors, options);
    
    // Add metadata
    const enrichedDoctors = doctors.map(doctor => {
      const doctorObj = doctor.toObject ? doctor.toObject() : doctor;
      
      return {
        ...doctorObj,
        isGeneralMedicine: isGeneralMedicineDoctor(doctor),
        relevanceScore: calculateRelevanceScore(doctor, specializationsWithGeneral)
      };
    });
    
    return enrichedDoctors;
  } catch (error) {
    console.error('Error getting recommended doctors:', error);
    throw error;
  }
}

module.exports = {
  isGeneralMedicineDoctor,
  sortDoctorsByRelevance,
  ensureMinimumDoctors,
  getDoctorsForConditions,
  calculateRelevanceScore,
  getRecommendedDoctors
};
