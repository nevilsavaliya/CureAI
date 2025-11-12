/**
 * Disease to Medical Specialization Mapping Service
 * Maps predicted diseases to appropriate medical specializations
 */

const diseaseSpecializationMap = {
  // Respiratory Diseases
  'Common Cold': ['General Medicine', 'Internal Medicine', 'Pulmonology'],
  'Flu': ['General Medicine', 'Internal Medicine', 'Pulmonology'],
  'Pneumonia': ['Pulmonology', 'Internal Medicine', 'Critical Care'],
  'Bronchitis': ['Pulmonology', 'Internal Medicine'],
  'Asthma': ['Pulmonology', 'Allergy & Immunology'],
  'COVID-19': ['Pulmonology', 'Internal Medicine', 'Critical Care'],
  'Tuberculosis': ['Pulmonology', 'Infectious Disease'],
  
  // Cardiovascular Diseases
  'Hypertension': ['Cardiology', 'Internal Medicine', 'General Medicine'],
  'Heart Disease': ['Cardiology', 'Cardiac Surgery'],
  'Heart Attack': ['Cardiology', 'Emergency Medicine', 'Critical Care'],
  'Arrhythmia': ['Cardiology', 'Electrophysiology'],
  'Stroke': ['Neurology', 'Cardiology', 'Emergency Medicine'],
  
  // Gastrointestinal Diseases
  'Gastritis': ['Gastroenterology', 'Internal Medicine'],
  'GERD': ['Gastroenterology', 'Internal Medicine'],
  'Ulcer': ['Gastroenterology', 'Internal Medicine'],
  'IBS': ['Gastroenterology', 'Internal Medicine'],
  'Hepatitis': ['Gastroenterology', 'Hepatology', 'Infectious Disease'],
  'Appendicitis': ['General Surgery', 'Emergency Medicine'],
  'Food Poisoning': ['Gastroenterology', 'General Medicine', 'Emergency Medicine'],
  
  // Endocrine Diseases
  'Diabetes': ['Endocrinology', 'Internal Medicine', 'General Medicine'],
  'Thyroid Disorder': ['Endocrinology', 'Internal Medicine'],
  'Hyperthyroidism': ['Endocrinology', 'Internal Medicine'],
  'Hypothyroidism': ['Endocrinology', 'Internal Medicine'],
  
  // Neurological Diseases
  'Migraine': ['Neurology', 'General Medicine'],
  'Headache': ['Neurology', 'General Medicine', 'Internal Medicine'],
  'Epilepsy': ['Neurology', 'Neurosurgery'],
  'Parkinson\'s Disease': ['Neurology', 'Movement Disorders'],
  'Alzheimer\'s Disease': ['Neurology', 'Geriatrics', 'Psychiatry'],
  'Meningitis': ['Neurology', 'Infectious Disease', 'Emergency Medicine'],
  
  // Musculoskeletal Diseases
  'Arthritis': ['Rheumatology', 'Orthopedics', 'Internal Medicine'],
  'Osteoporosis': ['Rheumatology', 'Orthopedics', 'Endocrinology'],
  'Back Pain': ['Orthopedics', 'Physical Medicine', 'Pain Management'],
  'Fracture': ['Orthopedics', 'Emergency Medicine'],
  
  // Dermatological Diseases
  'Eczema': ['Dermatology', 'Allergy & Immunology'],
  'Psoriasis': ['Dermatology', 'Rheumatology'],
  'Acne': ['Dermatology', 'General Medicine'],
  'Skin Infection': ['Dermatology', 'Infectious Disease'],
  'Rash': ['Dermatology', 'Allergy & Immunology', 'General Medicine'],
  
  // Infectious Diseases
  'Malaria': ['Infectious Disease', 'Internal Medicine'],
  'Dengue': ['Infectious Disease', 'Internal Medicine'],
  'Typhoid': ['Infectious Disease', 'Internal Medicine'],
  'Viral Fever': ['General Medicine', 'Internal Medicine', 'Infectious Disease'],
  'Bacterial Infection': ['Infectious Disease', 'Internal Medicine'],
  
  // Urological Diseases
  'UTI': ['Urology', 'Internal Medicine', 'General Medicine'],
  'Kidney Stone': ['Urology', 'Nephrology'],
  'Kidney Disease': ['Nephrology', 'Internal Medicine'],
  'Prostate Issues': ['Urology', 'Oncology'],
  
  // Gynecological Diseases
  'PCOS': ['Gynecology', 'Endocrinology'],
  'Menstrual Disorders': ['Gynecology', 'Endocrinology'],
  'Pregnancy Complications': ['Obstetrics', 'Gynecology'],
  
  // Psychiatric Diseases
  'Depression': ['Psychiatry', 'Psychology'],
  'Anxiety': ['Psychiatry', 'Psychology'],
  'Insomnia': ['Psychiatry', 'Sleep Medicine', 'Neurology'],
  'Stress': ['Psychiatry', 'Psychology', 'General Medicine'],
  
  // Ophthalmological Diseases
  'Eye Infection': ['Ophthalmology', 'General Medicine'],
  'Vision Problems': ['Ophthalmology'],
  'Glaucoma': ['Ophthalmology'],
  'Cataract': ['Ophthalmology'],
  
  // ENT Diseases
  'Ear Infection': ['ENT', 'General Medicine'],
  'Sinusitis': ['ENT', 'Allergy & Immunology'],
  'Tonsillitis': ['ENT', 'General Medicine'],
  'Hearing Loss': ['ENT', 'Audiology'],
  
  // Oncological Diseases
  'Cancer': ['Oncology', 'Hematology', 'Radiation Oncology'],
  'Tumor': ['Oncology', 'Surgery'],
  'Leukemia': ['Hematology', 'Oncology'],
  
  // Allergic Diseases
  'Allergy': ['Allergy & Immunology', 'General Medicine'],
  'Hay Fever': ['Allergy & Immunology', 'ENT'],
  'Anaphylaxis': ['Allergy & Immunology', 'Emergency Medicine'],
  
  // Pediatric Diseases
  'Chickenpox': ['Pediatrics', 'Infectious Disease'],
  'Measles': ['Pediatrics', 'Infectious Disease'],
  'Mumps': ['Pediatrics', 'Infectious Disease'],
  
  // General/Other
  'Fatigue': ['General Medicine', 'Internal Medicine'],
  'Fever': ['General Medicine', 'Internal Medicine', 'Infectious Disease'],
  'Weight Loss': ['General Medicine', 'Internal Medicine', 'Endocrinology'],
  'Anemia': ['Hematology', 'Internal Medicine'],
  'Dehydration': ['General Medicine', 'Emergency Medicine']
};

/**
 * Get specializations for a given disease
 * @param {string} disease - Disease name
 * @returns {Array<string>} - Array of relevant specializations
 */
function getSpecializationsForDisease(disease) {
  // Normalize disease name
  const normalizedDisease = disease.trim();
  
  // Direct match
  if (diseaseSpecializationMap[normalizedDisease]) {
    return diseaseSpecializationMap[normalizedDisease];
  }
  
  // Partial match (case-insensitive)
  const lowerDisease = normalizedDisease.toLowerCase();
  for (const [key, specializations] of Object.entries(diseaseSpecializationMap)) {
    if (key.toLowerCase().includes(lowerDisease) || lowerDisease.includes(key.toLowerCase())) {
      return specializations;
    }
  }
  
  // Default to general medicine if no match found
  return ['General Medicine', 'Internal Medicine'];
}

/**
 * Get specializations for multiple diseases
 * @param {Array<Object>} diseases - Array of disease objects with name and confidence
 * @returns {Array<string>} - Unique array of relevant specializations, sorted by relevance
 */
function getSpecializationsForDiseases(diseases) {
  if (!diseases || diseases.length === 0) {
    return ['General Medicine'];
  }
  
  const specializationScores = {};
  
  diseases.forEach((disease, index) => {
    const specializations = getSpecializationsForDisease(disease.name);
    const weight = disease.confidence || (1 / (index + 1)); // Higher weight for higher confidence/earlier diseases
    
    specializations.forEach((spec, specIndex) => {
      const specWeight = weight * (1 / (specIndex + 1)); // First specialization gets higher weight
      specializationScores[spec] = (specializationScores[spec] || 0) + specWeight;
    });
  });
  
  // Sort by score and return
  return Object.entries(specializationScores)
    .sort((a, b) => b[1] - a[1])
    .map(([spec]) => spec);
}

/**
 * Get all available specializations
 * @returns {Array<string>} - Unique array of all specializations
 */
function getAllSpecializations() {
  const specializations = new Set();
  Object.values(diseaseSpecializationMap).forEach(specs => {
    specs.forEach(spec => specializations.add(spec));
  });
  return Array.from(specializations).sort();
}

module.exports = {
  getSpecializationsForDisease,
  getSpecializationsForDiseases,
  getAllSpecializations,
  diseaseSpecializationMap
};
