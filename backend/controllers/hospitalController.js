const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const Case = require('../models/Case');
const Message = require('../models/Message');
const emailService = require('../services/emailService');
const logger = require('../services/logger');
const errorTracker = require('../services/errorTracker');
const jwt = require('jsonwebtoken');

/**
 * Hospital Registration
 * POST /api/hospitals/register
 */
exports.registerHospital = async (req, res) => {
    console.log('🏥 Hospital registration request received:', {
        method: req.method,
        url: req.originalUrl,
        body: Object.keys(req.body),
        files: req.files ? req.files.length : 0
    });
    
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
            // Log duplicate registration attempt
            logger.security.suspiciousActivity({
                activity: 'DUPLICATE_HOSPITAL_REGISTRATION',
                details: {
                    email: email.toLowerCase(),
                    registrationNumber,
                    existingHospitalId: existingHospital._id
                },
                ip: logger.getClientIP(req),
                userAgent: logger.getUserAgent(req)
            });

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

        // Log hospital registration
        logger.hospital.registration({
            hospitalName,
            email,
            registrationNumber,
            documentsCount: documents.length,
            ip: logger.getClientIP(req),
            userAgent: logger.getUserAgent(req)
        });

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
            logger.error('Failed to send hospital registration confirmation email', {
                type: 'EMAIL_ERROR',
                hospitalId: hospital._id,
                hospitalName,
                email,
                error: emailError.message,
                timestamp: new Date().toISOString()
            });
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
        // Track the error
        const errorId = errorTracker.trackHospitalRegistrationError(error, {
            hospitalName: req.body.hospitalName,
            email: req.body.email,
            registrationNumber: req.body.registrationNumber
        }, req);

        logger.error('Hospital registration failed', {
            type: 'HOSPITAL_REGISTRATION_ERROR',
            errorId: errorId,
            error: error.message,
            stack: error.stack,
            hospitalName: req.body.hospitalName,
            email: req.body.email,
            ip: logger.getClientIP(req),
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: 'Failed to register hospital',
            error: error.message,
            errorId: errorId
        });
    }
};

/**
 * Hospital Login
 * POST /api/hospitals/login
 */
exports.loginHospital = async (req, res) => {
    console.log('🏥 Hospital login function started');
    console.log('📋 Request body:', { email: req.body.email, passwordLength: req.body.password?.length });
    
    try {
        const { email, password } = req.body;
        console.log('📧 Processing login for email:', email);

        // Find hospital
        console.log('🔍 Searching for hospital in database...');
        const hospital = await Hospital.findOne({ email: email.toLowerCase() });

        if (!hospital) {
            console.log('❌ Hospital not found in database');
            // Log failed login attempt
            logger.hospital.login({
                email: email.toLowerCase(),
                success: false,
                reason: 'Hospital not found',
                ip: logger.getClientIP(req),
                userAgent: logger.getUserAgent(req)
            });

            console.log('📤 Sending 401 response: Hospital not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('✅ Hospital found:', {
            id: hospital._id,
            name: hospital.hospitalName,
            email: hospital.email,
            status: hospital.verificationStatus
        });

        // Check password
        console.log('🔐 Checking password...');
        const isMatch = await hospital.comparePassword(password);
        console.log('🔐 Password comparison result:', isMatch);

        if (!isMatch) {
            console.log('❌ Password does not match');
            // Log failed login attempt
            logger.hospital.login({
                hospitalId: hospital._id,
                hospitalName: hospital.hospitalName,
                email: email.toLowerCase(),
                success: false,
                reason: 'Invalid password',
                ip: logger.getClientIP(req),
                userAgent: logger.getUserAgent(req)
            });

            console.log('📤 Sending 401 response: Invalid password');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('✅ Password matches');

        // Check verification status
        console.log('🔍 Checking verification status:', hospital.verificationStatus);
        if (hospital.verificationStatus !== 'verified') {
            console.log('❌ Hospital not verified, status:', hospital.verificationStatus);
            // Log unverified login attempt
            logger.hospital.login({
                hospitalId: hospital._id,
                hospitalName: hospital.hospitalName,
                email: email.toLowerCase(),
                success: false,
                reason: `Hospital status: ${hospital.verificationStatus}`,
                ip: logger.getClientIP(req),
                userAgent: logger.getUserAgent(req)
            });

            console.log('📤 Sending 403 response: Hospital not verified');
            return res.status(403).json({
                success: false,
                message: `Your hospital account is ${hospital.verificationStatus}. Please wait for admin verification.`,
                verificationStatus: hospital.verificationStatus
            });
        }

        console.log('✅ Hospital is verified');

        // Generate JWT token
        console.log('🔑 Generating JWT token...');
        const token = jwt.sign(
            {
                id: hospital._id,
                role: 'hospital',
                email: hospital.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        console.log('✅ JWT token generated successfully');

        // Log successful login
        logger.hospital.login({
            hospitalId: hospital._id,
            hospitalName: hospital.hospitalName,
            email: email.toLowerCase(),
            success: true,
            reason: 'Login successful',
            ip: logger.getClientIP(req),
            userAgent: logger.getUserAgent(req)
        });

        const responseData = {
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
        };

        console.log('✅ Login successful! Sending response:', {
            success: responseData.success,
            message: responseData.message,
            hasToken: !!responseData.token,
            hospitalId: responseData.hospital.id,
            hospitalName: responseData.hospital.hospitalName
        });

        console.log('📤 Sending 200 response with login data');
        
        // Add response event listeners to see what happens
        res.on('finish', () => {
            console.log('✅ Response sent successfully to client');
        });
        
        res.on('error', (err) => {
            console.log('❌ Response error:', err.message);
        });
        
        res.status(200).json(responseData);
        console.log('📡 Response.json() called, waiting for client...');

    } catch (error) {
        console.log('💥 Hospital login error occurred:', error.message);
        console.log('📋 Error stack:', error.stack);
        
        // Track the error
        const errorId = errorTracker.trackHospitalLoginError(error, {
            email: req.body.email
        }, req);

        logger.error('Hospital login error', {
            type: 'HOSPITAL_LOGIN_ERROR',
            errorId: errorId,
            error: error.message,
            stack: error.stack,
            email: req.body.email,
            ip: logger.getClientIP(req),
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
            errorId: errorId
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
    const startTime = Date.now();
    req.startTime = startTime;
    
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
            // Log patient not found
            logger.hospital.apiAccess({
                hospitalId: req.hospital._id,
                hospitalName: req.hospital.hospitalName,
                patientEmail: patientEmail || 'unknown',
                patientId: patientId || 'unknown',
                endpoint: '/api/hospitals/api/patient-data',
                method: 'POST',
                success: false,
                responseTime: Date.now() - req.startTime,
                ip: logger.getClientIP(req),
                userAgent: logger.getUserAgent(req)
            });

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

        // Log successful API access
        const responseTime = Date.now() - startTime;
        logger.hospital.apiAccess({
            hospitalId: req.hospital._id,
            hospitalName: req.hospital.hospitalName,
            patientId: patient._id,
            patientEmail: patient.email,
            endpoint: '/api/hospitals/api/patient-data',
            method: 'POST',
            success: true,
            responseTime: responseTime,
            ip: logger.getClientIP(req),
            userAgent: logger.getUserAgent(req)
        });

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
        // Track the error
        const errorId = errorTracker.trackHospitalApiError(error, {
            hospitalId: req.hospital?._id,
            hospitalName: req.hospital?.hospitalName,
            endpoint: '/api/hospitals/api/patient-data',
            method: 'POST',
            patientId: req.body.patientId,
            patientEmail: req.body.patientEmail
        }, req);

        // Log API error
        logger.hospital.apiError({
            hospitalId: req.hospital?._id,
            hospitalName: req.hospital?.hospitalName,
            endpoint: '/api/hospitals/api/patient-data',
            method: 'POST',
            error: error.message,
            statusCode: 500,
            errorId: errorId,
            ip: logger.getClientIP(req),
            userAgent: logger.getUserAgent(req)
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve patient data',
            error: error.message,
            errorId: errorId
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
        // Get hospital with API secret for complete profile
        const hospital = await Hospital.findById(req.user.id).select('-password');

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        // Prepare response data
        const hospitalData = {
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
        };

        // Include API secret only if it exists and was recently generated (within 24 hours)
        // This allows hospitals to see their secret once after generation
        if (hospital.apiSecret && hospital.apiKeyGeneratedAt) {
            const hoursSinceGeneration = (Date.now() - hospital.apiKeyGeneratedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceGeneration <= 24) {
                hospitalData.apiSecret = hospital.apiSecret;
                hospitalData.showApiSecret = true;
                hospitalData.apiSecretExpiresAt = new Date(hospital.apiKeyGeneratedAt.getTime() + (24 * 60 * 60 * 1000));
            }
        }

        res.status(200).json({
            success: true,
            hospital: hospitalData
        });

    } catch (error) {
        logger.error('Get hospital profile error', {
            type: 'HOSPITAL_PROFILE_ERROR',
            hospitalId: req.user?.id,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

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
        logger.error('Update hospital profile error', {
            type: 'HOSPITAL_PROFILE_UPDATE_ERROR',
            hospitalId: req.user?.id,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: 'Failed to update hospital profile',
            error: error.message
        });
    }
};

/**
 * Get API Usage Statistics
 * GET /api/hospitals/api/usage-stats
 * Requires JWT authentication
 */
exports.getApiUsageStats = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user.id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        // Get current date for calculations
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Calculate API usage statistics from logs
        const fs = require('fs');
        const path = require('path');
        const logsDir = path.join(__dirname, '../logs');
        
        let stats = {
            totalRequests: hospital.apiAccessCount || 0,
            requestsToday: 0,
            requestsThisWeek: 0,
            requestsThisMonth: 0,
            averageResponseTime: 0,
            successRate: 100,
            remainingRequests: 1000, // Default rate limit
            rateLimit: 1000,
            lastUpdated: new Date()
        };

        try {
            // Read recent API access logs to calculate real-time metrics
            const logFiles = fs.readdirSync(logsDir).filter(file => 
                file.startsWith('api-access-') && file.endsWith('.log')
            );

            let todayCount = 0;
            let weekCount = 0;
            let monthCount = 0;
            let totalResponseTime = 0;
            let responseTimeCount = 0;
            let successCount = 0;
            let totalCount = 0;

            // Process recent log files (last 30 days)
            const recentLogFiles = logFiles.slice(-30);
            
            for (const logFile of recentLogFiles) {
                try {
                    const logPath = path.join(logsDir, logFile);
                    const logContent = fs.readFileSync(logPath, 'utf8');
                    const logLines = logContent.split('\n').filter(line => line.trim());

                    for (const line of logLines) {
                        try {
                            const logEntry = JSON.parse(line);
                            
                            // Check if this log entry is for our hospital
                            if (logEntry.hospitalId === hospital._id.toString()) {
                                const logDate = new Date(logEntry.timestamp);
                                totalCount++;

                                // Count requests by time period
                                if (logDate >= today) {
                                    todayCount++;
                                }
                                if (logDate >= thisWeekStart) {
                                    weekCount++;
                                }
                                if (logDate >= thisMonthStart) {
                                    monthCount++;
                                }

                                // Calculate response time and success rate
                                if (logEntry.responseTime) {
                                    totalResponseTime += logEntry.responseTime;
                                    responseTimeCount++;
                                }
                                if (logEntry.success !== false) {
                                    successCount++;
                                }
                            }
                        } catch (parseError) {
                            // Skip invalid log entries
                            continue;
                        }
                    }
                } catch (fileError) {
                    // Skip files that can't be read
                    continue;
                }
            }

            // Update statistics with calculated values
            stats.requestsToday = todayCount;
            stats.requestsThisWeek = weekCount;
            stats.requestsThisMonth = monthCount;
            stats.averageResponseTime = responseTimeCount > 0 ? 
                Math.round(totalResponseTime / responseTimeCount) : 0;
            stats.successRate = totalCount > 0 ? 
                Math.round((successCount / totalCount) * 100) : 100;

            // Calculate remaining requests (assuming daily rate limit reset)
            const usedToday = todayCount;
            stats.remainingRequests = Math.max(0, stats.rateLimit - usedToday);

        } catch (logError) {
            logger.error('Error reading API logs for usage stats', {
                type: 'API_USAGE_STATS_ERROR',
                hospitalId: hospital._id,
                error: logError.message,
                timestamp: new Date().toISOString()
            });
            // Continue with default stats if log reading fails
        }

        res.status(200).json({
            success: true,
            message: 'API usage statistics retrieved successfully',
            stats: stats
        });

    } catch (error) {
        logger.error('Get API usage statistics error', {
            type: 'API_USAGE_STATS_ERROR',
            hospitalId: req.user?.id,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve API usage statistics',
            error: error.message
        });
    }
};

/**
 * Get Recent API Requests
 * GET /api/hospitals/api/recent-requests
 * Requires JWT authentication
 */
exports.getRecentApiRequests = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user.id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const maxLimit = 50; // Maximum requests per page
        const actualLimit = Math.min(limit, maxLimit);

        let recentRequests = [];

        try {
            // Read recent API access logs
            const fs = require('fs');
            const path = require('path');
            const logsDir = path.join(__dirname, '../logs');
            
            const logFiles = fs.readdirSync(logsDir).filter(file => 
                file.startsWith('api-access-') && file.endsWith('.log')
            );

            // Process recent log files (last 7 days)
            const recentLogFiles = logFiles.slice(-7).reverse(); // Most recent first
            
            for (const logFile of recentLogFiles) {
                try {
                    const logPath = path.join(logsDir, logFile);
                    const logContent = fs.readFileSync(logPath, 'utf8');
                    const logLines = logContent.split('\n').filter(line => line.trim()).reverse(); // Most recent first

                    for (const line of logLines) {
                        try {
                            const logEntry = JSON.parse(line);
                            
                            // Check if this log entry is for our hospital and is a patient data request
                            if (logEntry.hospitalId === hospital._id.toString() && 
                                logEntry.type === 'HOSPITAL_API_ACCESS') {
                                
                                recentRequests.push({
                                    id: `${logEntry.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                                    patientEmail: logEntry.patientEmail || 'N/A',
                                    timestamp: new Date(logEntry.timestamp),
                                    status: logEntry.success !== false ? 'success' : 'error',
                                    responseTime: logEntry.responseTime || null,
                                    endpoint: logEntry.endpoint || '/api/hospitals/api/patient-data',
                                    method: logEntry.method || 'POST'
                                });

                                // Stop if we have enough requests for pagination
                                if (recentRequests.length >= page * actualLimit) {
                                    break;
                                }
                            }
                        } catch (parseError) {
                            // Skip invalid log entries
                            continue;
                        }
                    }

                    // Stop if we have enough requests
                    if (recentRequests.length >= page * actualLimit) {
                        break;
                    }
                } catch (fileError) {
                    // Skip files that can't be read
                    continue;
                }
            }

            // Apply pagination
            const startIndex = (page - 1) * actualLimit;
            const endIndex = startIndex + actualLimit;
            const paginatedRequests = recentRequests.slice(startIndex, endIndex);

            res.status(200).json({
                success: true,
                message: 'Recent API requests retrieved successfully',
                requests: paginatedRequests,
                pagination: {
                    currentPage: page,
                    totalRequests: recentRequests.length,
                    requestsPerPage: actualLimit,
                    totalPages: Math.ceil(recentRequests.length / actualLimit),
                    hasNextPage: endIndex < recentRequests.length,
                    hasPreviousPage: page > 1
                }
            });

        } catch (logError) {
            logger.error('Error reading API logs for recent requests', {
                type: 'RECENT_API_REQUESTS_ERROR',
                hospitalId: hospital._id,
                error: logError.message,
                timestamp: new Date().toISOString()
            });

            // Return empty results if log reading fails
            res.status(200).json({
                success: true,
                message: 'Recent API requests retrieved successfully',
                requests: [],
                pagination: {
                    currentPage: page,
                    totalRequests: 0,
                    requestsPerPage: actualLimit,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            });
        }

    } catch (error) {
        logger.error('Get recent API requests error', {
            type: 'RECENT_API_REQUESTS_ERROR',
            hospitalId: req.user?.id,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve recent API requests',
            error: error.message
        });
    }
};

module.exports = exports;
