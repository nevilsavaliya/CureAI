const mongoose = require('mongoose');

const apiRequestSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true,
        index: true
    },
    patientEmail: {
        type: String,
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    endpoint: {
        type: String,
        required: true,
        default: '/api/hospitals/api/patient-data'
    },
    method: {
        type: String,
        required: true,
        default: 'POST'
    },
    status: {
        type: String,
        enum: ['success', 'error'],
        required: true
    },
    responseTime: {
        type: Number, // in milliseconds
        required: true
    },
    errorMessage: {
        type: String
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient queries
apiRequestSchema.index({ hospitalId: 1, timestamp: -1 });
apiRequestSchema.index({ hospitalId: 1, status: 1 });

// Static method to get usage statistics for a hospital
apiRequestSchema.statics.getUsageStats = async function (hospitalId) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        totalRequests,
        requestsToday,
        requestsThisWeek,
        requestsThisMonth,
        avgResponseTime,
        successCount
    ] = await Promise.all([
        // Total requests
        this.countDocuments({ hospitalId }),

        // Requests today
        this.countDocuments({
            hospitalId,
            timestamp: { $gte: startOfToday }
        }),

        // Requests this week
        this.countDocuments({
            hospitalId,
            timestamp: { $gte: startOfWeek }
        }),

        // Requests this month
        this.countDocuments({
            hospitalId,
            timestamp: { $gte: startOfMonth }
        }),

        // Average response time
        this.aggregate([
            { $match: { hospitalId: new mongoose.Types.ObjectId(hospitalId) } },
            { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
        ]),

        // Success count
        this.countDocuments({ hospitalId, status: 'success' })
    ]);

    const averageResponseTime = avgResponseTime.length > 0
        ? Math.round(avgResponseTime[0].avgTime)
        : 0;

    const successRate = totalRequests > 0
        ? ((successCount / totalRequests) * 100).toFixed(1)
        : 0;

    // Rate limit calculation (example: 1000 requests per day)
    const rateLimit = 1000;
    const remainingRequests = Math.max(0, rateLimit - requestsToday);

    return {
        totalRequests,
        requestsToday,
        requestsThisWeek,
        requestsThisMonth,
        averageResponseTime,
        successRate: parseFloat(successRate),
        remainingRequests,
        rateLimit,
        lastUpdated: new Date()
    };
};

const ApiRequest = mongoose.model('ApiRequest', apiRequestSchema);

module.exports = ApiRequest;
