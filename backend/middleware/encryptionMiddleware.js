const encryption = require('../utils/encryption');

/**
 * Middleware to ensure encryption is properly configured
 */
const ensureEncryption = (req, res, next) => {
    // Check if encryption master key is set
    if (!process.env.ENCRYPTION_MASTER_KEY) {
        console.warn('⚠️  ENCRYPTION_MASTER_KEY not set. Messages will be encrypted with a temporary key.');
        console.warn('⚠️  To fix this: Add ENCRYPTION_MASTER_KEY to your .env file');
        console.warn('⚠️  Generate a key with: node scripts/generateEncryptionKey.js');
    }

    // Add encryption utilities to request object for easy access
    req.encryption = encryption;

    next();
};

/**
 * Middleware to validate message encryption requirements
 */
const validateMessageEncryption = (req, res, next) => {
    // Ensure sensitive message endpoints use encryption
    if (req.path.includes('/messages') && req.method === 'POST') {
        if (!req.body.content) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        // Add encryption metadata to request
        req.encryptionRequired = true;
    }

    next();
};

/**
 * Middleware to add security headers for encrypted communications
 */
const addEncryptionHeaders = (req, res, next) => {
    // Add security headers for encrypted communications
    res.setHeader('X-Content-Encrypted', 'true');
    res.setHeader('X-Encryption-Version', '1.0');

    next();
};

module.exports = {
    ensureEncryption,
    validateMessageEncryption,
    addEncryptionHeaders
};