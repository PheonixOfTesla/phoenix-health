/**
 * TOKEN ENCRYPTION SERVICE
 * AES-256-GCM encryption for sensitive tokens
 * Protects refresh tokens, API keys, and session data
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const SALT_LENGTH = 64; // 512-bit salt for key derivation

/**
 * Get encryption key from environment
 * Falls back to secure random key if not set (NOT recommended for production)
 */
function getEncryptionKey() {
    const envKey = process.env.ENCRYPTION_KEY;

    if (!envKey) {
        console.warn('⚠️  ENCRYPTION_KEY not set in environment. Using temporary key (NOT PRODUCTION SAFE)');
        // Generate a temporary key (will change on restart - tokens won't decrypt)
        return crypto.randomBytes(32);
    }

    // Derive 256-bit key from environment variable using PBKDF2
    const salt = Buffer.from(process.env.ENCRYPTION_SALT || 'phoenix-default-salt-change-in-production', 'utf8');
    return crypto.pbkdf2Sync(envKey, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {string} - Encrypted data in format: iv:authTag:encrypted
 */
function encrypt(plaintext) {
    try {
        if (!plaintext) {
            throw new Error('Cannot encrypt empty value');
        }

        const key = getEncryptionKey();

        // Generate random IV (initialization vector)
        const iv = crypto.randomBytes(IV_LENGTH);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt data
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag (ensures data integrity)
        const authTag = cipher.getAuthTag();

        // Return format: iv:authTag:encrypted (all in hex)
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

    } catch (error) {
        console.error('[TokenEncryption] Encryption error:', error.message);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Data in format: iv:authTag:encrypted
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedData) {
    try {
        if (!encryptedData) {
            throw new Error('Cannot decrypt empty value');
        }

        const key = getEncryptionKey();

        // Parse encrypted data format
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        // Decrypt data
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;

    } catch (error) {
        console.error('[TokenEncryption] Decryption error:', error.message);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Hash data using SHA-256 (for token revocation checking)
 * @param {string} data - Data to hash
 * @returns {string} - Hex-encoded hash
 */
function hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate cryptographically secure random token
 * @param {number} length - Byte length (default 32)
 * @returns {string} - Hex-encoded random token
 */
function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Constant-time string comparison (prevents timing attacks)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings match
 */
function secureCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    if (a.length !== b.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(a, 'utf8'),
        Buffer.from(b, 'utf8')
    );
}

module.exports = {
    encrypt,
    decrypt,
    hash,
    generateSecureToken,
    secureCompare
};
