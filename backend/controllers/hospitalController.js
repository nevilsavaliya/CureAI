const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const Case = require('../models/Case');
const Message = require('../models/Message');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

/**
 * Hospital Registration
 * POST /api/hospitals/register
 */
exports.registerHospital = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            hospitalName,
            registrationNumber,
            contactNumber,
            emergencyContact,
            website,
            numberOfBeds
        } = req.body;

        // Parse address from form data
        const address = {
            street: req.body['address[street]'] || req.body.street,
            city: req.body['address[city]'] || req.body.city,
            state: req.body['address[state]'] || req.body.state,
            zipCode: req.body['address[zipCode]'] || req.body.zipCode,
            country: req.body['address[country]'] || req.body.country
        };

        // Parse arrays from JSON strings if needed
        let specializations = req.body.specializations;
        let facilities = req.body.facilities;

        if (typeof specializations === 'string') {
            try {
                specializations = JSON.parse(specializations);
            } catch (e) {
                specializations = [];
            }
        }

        if (typeof facilities === 'string') {
            try {
                facilities = JSON.parse(facilities);
            } catch (e) {
                facilities = [];
            }
        }

        // Check if hospital already exists
        const existingHospital = await Hospital.findOne({
            $or: [{ email: email.toLowerCase() }, { registrationNumber }]
        });

        if (existingHospital) {
            return res.status(400).json({
                success: false,
                message: 'Hospital with this email or registration number already exists'
            });
        }

        // Process uploaded documents
        const documents = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                documents.push({
                    type: 'other', // Can be categorized later by admin
                    url: `/uploads/hospital-documents/${file.filename}`,
                    uploadedAt: new Date()
                });
            });
        }

        // Create new hospital
        const hospital = new Hospital({
            name,
            email: email.toLowerCase(),
            password,
            hospitalName,
            registrationNumber,
            address,
            contactNumber,
            emergencyContact,
            website,
            specializations: specializations || [],
            numberOfBeds: numberOfBeds || 0,
            facilities: facilities || [],
            documents,
            verificationStatus: 'pending'
        });

        await hospital.save();

        console.log(`✅ Hospital registered: ${hospitalName} (${email})`);
        console.log(`   Documents uploaded: ${documents.length}`);

        // Send confirmation email
        try {
            await emailService.sendEmail(
                email,
                'Hospital Registration Received',
                `
                <h2>Registration Received</h2>
                <p>Dear ${name},</p>
                <p>Thank you for registering <strong>${hospitalName}</strong> with our Healthcare Platform.</p>
                <p>Your application is currently under review by our admin team. You will receive an email notification once your application has been verified.</p>
                <p><strong>Registration Details:</strong></p>
                <ul>
                    <li>Hospital Name: ${hospitalName}</li>
                    <li>Registration Number: ${registrationNumber}</li>
                    <li>Contact Email: ${email}</li>
                    <li>Documents Submitted: ${documents.length}</li>
                </ul>
                <p>If you have any questions, please contact our support team.</p>
                <p>Best regards,<br>Healthcare Platform Team</p>
                `
            );
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Hospital registered successfully. Your application is pending admin verification.',
            hospital: {
                id: hospital._id,
                name: hospital.name,
                hospitalName: hospital.hospitalName,
                email: hospital.email,
                verificationStatus: hospital.verificationStatus,
                documentsUploaded: documents.length
            }
        });

    } catch (error) {
        console.error('Hospital registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register hospital',
            error: error.message
        });
    }
};

/**
 * Hospital Login
 * POST /api/hospitals/login
 */
exports.loginHospital = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find hospital
        const hospital = await Hospital.findOne({ email: email.toLowerCase() });

        if (!hospital) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await hospital.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check verification status
        if (hospital.verificationStatus !== 'verified') {
            return res.status(403).json({
                success: false,
                message: `Your hospital account is ${hospital.verificationStatus}. Please wait for admin verification.`,
                verificationStatus: hospital.verificationStatus
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: hospital._id,
                role: 'hospital',
                email: hospital.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            hospital: {
                id: hospital._id,
                name: hospital.name,
                hospitalName: hospital.hospitalName,
                email: hospital.email,
                apiKey: hospital.apiKey,
                verificationStatus: hospital.verificationStatus
            }
        });

    } catch (error) {
        console.error('Hospital login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Get Patient Data (Hospital API)
 * POST /api/hospitals/api/patient-data
 * Requires API Key and Secret (validated by hospitalApiAuth middleware)
 * Rate limited by rateLimitHospitalApi middleware
 */
exports.getPatientData = async (req, res) => {
    try {
        const { patientEmail, patientId } = req.body;

        // Hospital is already authenticated by middleware and available in req.hospital
        // Find patient
        let patient;
        if (patientId) {
            patient = await Patient.findById(patientId);
        } else if (patientEmail) {
            patient = await Patient.findOne({ email: patientEmail.toLowerCase() });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Patient email or ID is required'
            });
        }

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found in our system'
            });
        }

        // Get patient's cases and chat history
        const cases = await Case.find({ patientId: patient._id })
            .populate('doctorId', 'name specializations')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get recent messages
        const messages = await Message.find({
            $or: [
                { senderId: patient._id },
                { receiverId: patient._id }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(50);

        // Return comprehensive patient data
        res.status(200).json({
            success: true,
            message: 'Patient data retrieved successfully',
            patient: {
                // Basic Information
                id: patient._id,
                name: patient.name,
                email: patient.email,
                dateOfBirth: patient.dateOfBirth,
                age: calculateAge(patient.dateOfBirth),
                gender: patient.gender,
                bloodGroup: patient.bloodGroup,
                contactNumber: patient.contactNumber,
                address: patient.address,

                // Emergency Contact
                emergencyContact: patient.emergencyContact,

                // Medical History
                medicalHistory: patient.medicalHistory,
                allergies: patient.allergies,
                chronicConditions: patient.chronicConditions,
                currentMedications: patient.currentMedications,
                pastSurgeries: patient.pastSurgeries,
                vaccinations: patient.vaccinations,

                // Extracted Symptoms from Chats
                extractedSymptoms: patient.extractedSymptoms,

                // Vital Signs
                vitalSigns: patient.vitalSigns,

                // Lab Results
                labResults: patient.labResults,

                // Recent Cases
                recentCases: cases.map(c => ({
                    id: c._id,
                    status: c.status,
                    symptoms: c.symptoms,
                    predictedConditions: c.predictedConditions,
                    diagnosis: c.diagnosis,
                    treatmentNotes: c.treatmentNotes,
                    prescription: c.prescription,
                    doctor: c.doctorId ? {
                        name: c.doctorId.name,
                        specializations: c.doctorId.specializations
                    } : null,
                    createdAt: c.createdAt,
                    treatedAt: c.treatedAt
                })),

                // Chat History Summary
                chatHistorySummary: {
                    totalMessages: messages.length,
                    recentSymptomsMentioned: extractSymptomsFromMessages(messages)
                }
            },
            accessedBy: {
                hospital: req.hospital.name,
                accessTime: new Date()
            }
        });

    } catch (error) {
        console.error('Get patient data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve patient data',
            error: error.message
        });
    }
};

// Helper function to calculate age
function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

// Helper function to extract symptoms from messages
function extractSymptomsFromMessages(messages) {
    const symptomKeywords = [
        'fever', 'cough', 'headache', 'pain', 'nausea', 'vomiting',
        'diarrhea', 'fatigue', 'weakness', 'dizziness', 'chest pain',
        'shortness of breath', 'sore throat', 'runny nose', 'congestion'
    ];

    const foundSymptoms = new Set();

    messages.forEach(msg => {
        const content = msg.content.toLowerCase();
        symptomKeywords.forEach(symptom => {
            if (content.includes(symptom)) {
                foundSymptoms.add(symptom);
            }
        });
    });

    return Array.from(foundSymptoms);
}

/**
 * Get Hospital Profile
 * GET /api/hospitals/profile
 * Requires JWT authentication
 */
exports.getProfile = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user.id).select('-password -apiSecret');

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        res.status(200).json({
            success: true,
            hospital: {
                id: hospital._id,
                name: hospital.name,
                email: hospital.email,
                hospitalName: hospital.hospitalName,
                registrationNumber: hospital.registrationNumber,
                address: hospital.address,
                contactNumber: hospital.contactNumber,
                emergencyContact: hospital.emergencyContact,
                website: hospital.website,
                specializations: hospital.specializations,
                numberOfBeds: hospital.numberOfBeds,
                facilities: hospital.facilities,
                verificationStatus: hospital.verificationStatus,
                verifiedAt: hospital.verifiedAt,
                apiKey: hospital.apiKey,
                apiKeyGeneratedAt: hospital.apiKeyGeneratedAt,
                lastApiAccess: hospital.lastApiAccess,
                apiAccessCount: hospital.apiAccessCount,
                isActive: hospital.isActive,
                createdAt: hospital.createdAt,
                updatedAt: hospital.updatedAt
            }
        });

    } catch (error) {
        console.error('Get hospital profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve hospital profile',
            error: error.message
        });
    }
};

/**
 * Update Hospital Profile
 * PUT /api/hospitals/profile
 * Requires JWT authentication
 */
exports.updateProfile = async (req, res) => {
    try {
        const {
            name,
            hospitalName,
            address,
            contactNumber,
            emergencyContact,
            website,
            specializations,
            numberOfBeds,
            facilities
        } = req.body;

        const hospital = await Hospital.findById(req.user.id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        // Update allowed fields
        if (name) hospital.name = name;
        if (hospitalName) hospital.hospitalName = hospitalName;
        if (address) hospital.address = { ...hospital.address, ...address };
        if (contactNumber) hospital.contactNumber = contactNumber;
        if (emergencyContact) hospital.emergencyContact = emergencyContact;
        if (website) hospital.website = website;
        if (specializations) hospital.specializations = specializations;
        if (numberOfBeds !== undefined) hospital.numberOfBeds = numberOfBeds;
        if (facilities) hospital.facilities = facilities;

        await hospital.save();

        res.status(200).json({
            success: true,
            message: 'Hospital profile updated successfully',
            hospital: {
                id: hospital._id,
                name: hospital.name,
                email: hospital.email,
                hospitalName: hospital.hospitalName,
                registrationNumber: hospital.registrationNumber,
                address: hospital.address,
                contactNumber: hospital.contactNumber,
                emergencyContact: hospital.emergencyContact,
                website: hospital.website,
                specializations: hospital.specializations,
                numberOfBeds: hospital.numberOfBeds,
                facilities: hospital.facilities,
                verificationStatus: hospital.verificationStatus,
                updatedAt: hospital.updatedAt
            }
        });

    } catch (error) {
        console.error('Update hospital profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update hospital profile',
            error: error.message
        });
    }
};

module.exports = exports;
