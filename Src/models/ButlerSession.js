/**
 * ButlerSession Model
 *
 * Stores encrypted browser session cookies for each user/service combination.
 * Enables foolproof automation by bypassing CAPTCHA as a "returning user".
 *
 * Flow:
 * 1. User logs in once via Browserless live view
 * 2. Cookies exported and encrypted here
 * 3. Future automations import cookies → No CAPTCHA
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption settings
const ALGORITHM = 'aes-256-cbc';
const getEncryptionKey = () => {
  const key = process.env.SESSION_ENCRYPTION_KEY || process.env.JWT_SECRET;
  // Ensure 32-byte key for AES-256
  return crypto.createHash('sha256').update(key).digest();
};

const ButlerSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  service: {
    type: String,
    required: true,
    enum: [
      'doordash', 'ubereats', 'grubhub', 'postmates', 'instacart',
      'uber', 'lyft',
      'opentable', 'resy',
      'amazon', 'walmart', 'target',
      'google', 'facebook', 'twitter', 'instagram', 'linkedin',
      'airbnb', 'booking', 'expedia',
      'venmo', 'paypal', 'cashapp',
      'custom'
    ],
    index: true
  },

  // Custom service URL (when service is 'custom')
  customServiceUrl: {
    type: String
  },

  // Encrypted cookies (JSON string encrypted with AES-256)
  encryptedCookies: {
    type: String,
    required: true
  },

  // IV for decryption
  iv: {
    type: String,
    required: true
  },

  // Browser fingerprint for session consistency
  userAgent: {
    type: String,
    default: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },

  viewport: {
    width: { type: Number, default: 1920 },
    height: { type: Number, default: 1080 }
  },

  // Session metadata
  loginUrl: {
    type: String
  },

  lastUsed: {
    type: Date,
    default: Date.now
  },

  // Session validity
  isValid: {
    type: Boolean,
    default: true
  },

  // Number of successful uses
  useCount: {
    type: Number,
    default: 0
  },

  // Last error if session failed
  lastError: {
    type: String
  },

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Compound index for fast lookups
ButlerSessionSchema.index({ userId: 1, service: 1 }, { unique: true });

// TTL index for automatic cleanup
ButlerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Encrypt cookies before saving
 * @param {Array} cookies - Array of cookie objects from Puppeteer
 * @returns {Object} { encryptedCookies, iv }
 */
ButlerSessionSchema.statics.encryptCookies = function(cookies) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const cookieString = JSON.stringify(cookies);
  let encrypted = cipher.update(cookieString, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedCookies: encrypted,
    iv: iv.toString('hex')
  };
};

/**
 * Decrypt cookies for use
 * @returns {Array} Array of cookie objects
 */
ButlerSessionSchema.methods.decryptCookies = function() {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(this.iv, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(this.encryptedCookies, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('[ButlerSession] Failed to decrypt cookies:', error.message);
    return [];
  }
};

/**
 * Save a new session with cookies
 * @param {string} userId - User ID
 * @param {string} service - Service name
 * @param {Array} cookies - Cookies from Puppeteer page.cookies()
 * @param {Object} options - Additional options (userAgent, viewport, loginUrl)
 */
ButlerSessionSchema.statics.saveSession = async function(userId, service, cookies, options = {}) {
  const { encryptedCookies, iv } = this.encryptCookies(cookies);

  const sessionData = {
    userId,
    service,
    encryptedCookies,
    iv,
    userAgent: options.userAgent,
    viewport: options.viewport,
    loginUrl: options.loginUrl,
    customServiceUrl: options.customServiceUrl,
    isValid: true,
    lastUsed: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  // Upsert - update if exists, create if not
  const session = await this.findOneAndUpdate(
    { userId, service },
    sessionData,
    { upsert: true, new: true }
  );

  console.log(`[ButlerSession] Saved session for ${service} (${cookies.length} cookies)`);
  return session;
};

/**
 * Get session for a user/service
 * @param {string} userId - User ID
 * @param {string} service - Service name
 * @returns {Object|null} Session with decrypted cookies
 */
ButlerSessionSchema.statics.getSession = async function(userId, service) {
  const session = await this.findOne({
    userId,
    service,
    isValid: true,
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    return null;
  }

  // Update last used
  session.lastUsed = new Date();
  session.useCount += 1;
  await session.save();

  return {
    cookies: session.decryptCookies(),
    userAgent: session.userAgent,
    viewport: session.viewport,
    service: session.service,
    loginUrl: session.loginUrl
  };
};

/**
 * Check if user has valid session for service
 * @param {string} userId - User ID
 * @param {string} service - Service name
 * @returns {boolean}
 */
ButlerSessionSchema.statics.hasValidSession = async function(userId, service) {
  const count = await this.countDocuments({
    userId,
    service,
    isValid: true,
    expiresAt: { $gt: new Date() }
  });
  return count > 0;
};

/**
 * Invalidate a session (mark as invalid after failure)
 * @param {string} userId - User ID
 * @param {string} service - Service name
 * @param {string} error - Error message
 */
ButlerSessionSchema.statics.invalidateSession = async function(userId, service, error = '') {
  await this.findOneAndUpdate(
    { userId, service },
    { isValid: false, lastError: error }
  );
  console.log(`[ButlerSession] Invalidated session for ${service}: ${error}`);
};

/**
 * Get all valid sessions for a user
 * @param {string} userId - User ID
 * @returns {Array} List of connected services
 */
ButlerSessionSchema.statics.getUserSessions = async function(userId) {
  const sessions = await this.find({
    userId,
    isValid: true,
    expiresAt: { $gt: new Date() }
  }).select('service lastUsed useCount createdAt');

  return sessions.map(s => ({
    service: s.service,
    lastUsed: s.lastUsed,
    useCount: s.useCount,
    connectedAt: s.createdAt
  }));
};

/**
 * Delete a session
 * @param {string} userId - User ID
 * @param {string} service - Service name
 */
ButlerSessionSchema.statics.deleteSession = async function(userId, service) {
  await this.findOneAndDelete({ userId, service });
  console.log(`[ButlerSession] Deleted session for ${service}`);
};

module.exports = mongoose.model('ButlerSession', ButlerSessionSchema);
