const cron = require('node-cron');
const Doctor = require('../models/Doctor');
const logger = require('./logger');

/**
 * Check and update subscription statuses
 * Runs daily to shadow ban doctors with expired subscriptions
 */
async function checkSubscriptionStatus() {
    try {
        const now = new Date();

        // Find doctors with expired subscriptions
        const expiredDoctors = await Doctor.find({
            subscriptionStatus: 'active',
            subscriptionExpiryDate: { $lt: now }
        });

        logger.info(`Found ${expiredDoctors.length} doctors with expired subscriptions`);

        // Update each doctor
        for (const doctor of expiredDoctors) {
            doctor.subscriptionStatus = 'expired';
            doctor.isShadowBanned = true;
            await doctor.save();

            logger.info(`Shadow banned doctor: ${doctor.email} (subscription expired on ${doctor.subscriptionExpiryDate})`);
        }

        // Also check for doctors approaching expiry (3 days warning)
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + 3);

        const approachingExpiry = await Doctor.find({
            subscriptionStatus: 'active',
            isShadowBanned: { $ne: true },
            subscriptionExpiryDate: { $gte: now, $lte: warningDate }
        });

        logger.info(`Found ${approachingExpiry.length} doctors with subscriptions expiring soon`);

        // TODO: Send email notifications to doctors approaching expiry

    } catch (error) {
        logger.error('Error checking subscription status:', error);
    }
}

/**
 * Initialize subscription scheduler
 * Runs daily at midnight
 */
function initializeScheduler() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running subscription status check...');
        await checkSubscriptionStatus();
    });

    logger.info('Subscription scheduler initialized - will run daily at midnight');

    // Run immediately on startup
    checkSubscriptionStatus();
}

module.exports = {
    initializeScheduler,
    checkSubscriptionStatus
};
