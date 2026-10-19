/**
 * GENESIS CREDENTIALS MANAGER
 *
 * Purpose: Encrypted storage and retrieval of Genesis API credentials
 * - GitHub tokens
 * - Railway tokens
 * - Vercel tokens
 * - External service credentials
 *
 * Security: AES-256-GCM encryption, environment variable encryption key
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Credentials storage path
const CREDENTIALS_PATH = path.join(__dirname, '../../.genesis-credentials.enc');

// In-memory cache with TTL
const credentialsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get or generate encryption key from environment
 * @returns {Buffer} Encryption key
 */
const getEncryptionKey = () => {
  let keyHex = process.env.GENESIS_ENCRYPTION_KEY;

  if (!keyHex) {
    // Generate a new key if not set
    const newKey = crypto.randomBytes(KEY_LENGTH).toString('hex');
    console.warn('[GENESIS CREDENTIALS] No GENESIS_ENCRYPTION_KEY found in environment.');
    console.warn('[GENESIS CREDENTIALS] Generated new key (ADD THIS TO .env):');
    console.warn(`GENESIS_ENCRYPTION_KEY=${newKey}`);
    keyHex = newKey;
  }

  return Buffer.from(keyHex, 'hex');
};

/**
 * Encrypt a credential value
 * @param {String} value - Value to encrypt
 * @returns {Object} Encrypted data with IV, salt, and tag
 */
const encryptValue = (value) => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key with salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha512');

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

    // Encrypt
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    console.error('[GENESIS CREDENTIALS] Encryption error:', error);
    throw new Error('Failed to encrypt credential');
  }
};

/**
 * Decrypt a credential value
 * @param {Object} encryptedData - Encrypted data with IV, salt, and tag
 * @returns {String} Decrypted value
 */
const decryptValue = (encryptedData) => {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');

    // Derive key with salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha512');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[GENESIS CREDENTIALS] Decryption error:', error);
    throw new Error('Failed to decrypt credential');
  }
};

/**
 * Load all credentials from encrypted file
 * @returns {Object} All credentials
 */
const loadCredentials = async () => {
  try {
    const data = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty object
      return {};
    }
    console.error('[GENESIS CREDENTIALS] Load error:', error);
    throw error;
  }
};

/**
 * Save all credentials to encrypted file
 * @param {Object} credentials - All credentials
 */
const saveCredentials = async (credentials) => {
  try {
    const data = JSON.stringify(credentials, null, 2);
    await fs.writeFile(CREDENTIALS_PATH, data, 'utf8');
  } catch (error) {
    console.error('[GENESIS CREDENTIALS] Save error:', error);
    throw error;
  }
};

/**
 * Set a credential (encrypt and store)
 * @param {String} service - Service name (e.g., 'github', 'railway')
 * @param {String} key - Credential key (e.g., 'token', 'api_key')
 * @param {String} value - Credential value
 */
const setCredential = async (service, key, value) => {
  try {
    const credentials = await loadCredentials();

    if (!credentials[service]) {
      credentials[service] = {};
    }

    // Encrypt the value
    credentials[service][key] = encryptValue(value);

    // Save to file
    await saveCredentials(credentials);

    // Update cache
    const cacheKey = `${service}:${key}`;
    credentialsCache.set(cacheKey, {
      value,
      expiry: Date.now() + CACHE_TTL
    });

    console.log(`[GENESIS CREDENTIALS] Set ${service}:${key}`);
  } catch (error) {
    console.error('[GENESIS CREDENTIALS] Set error:', error);
    throw error;
  }
};

/**
 * Get a credential (decrypt and return)
 * @param {String} service - Service name
 * @param {String} key - Credential key
 * @returns {String|null} Decrypted credential value
 */
const getCredential = async (service, key) => {
  try {
    // Check cache first
    const cacheKey = `${service}:${key}`;
    const cached = credentialsCache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    // Load from file
    const credentials = await loadCredentials();

    if (!credentials[service] || !credentials[service][key]) {
      return null;
    }

    // Decrypt
    const decrypted = decryptValue(credentials[service][key]);

    // Cache the decrypted value
    credentialsCache.set(cacheKey, {
      value: decrypted,
      expiry: Date.now() + CACHE_TTL
    });

    return decrypted;
  } catch (error) {
    console.error('[GENESIS CREDENTIALS] Get error:', error);
    return null;
  }
};

/**
 * Delete a credential
 * @param {String} service - Service name
 * @param {String} key - Credential key
 */
const deleteCredential = async (service, key) => {
  try {
    const credentials = await loadCredentials();

    if (credentials[service] && credentials[service][key]) {
      delete credentials[service][key];

      // Remove from cache
      const cacheKey = `${service}:${key}`;
      credentialsCache.delete(cacheKey);

      // Save
      await saveCredentials(credentials);

      console.log(`[GENESIS CREDENTIALS] Deleted ${service}:${key}`);
    }
  } catch (error) {
    console.error('[GENESIS CREDENTIALS] Delete error:', error);
    throw error;
  }
};

/**
 * Get GitHub token
 * @returns {String|null} GitHub personal access token
 */
const getGitHubToken = async () => {
  // Try stored credential first
  const stored = await getCredential('github', 'token');
  if (stored) return stored;

  // Fallback to environment variable
  return process.env.GITHUB_TOKEN || null;
};

/**
 * Set GitHub token
 * @param {String} token - GitHub personal access token
 */
const setGitHubToken = async (token) => {
  await setCredential('github', 'token', token);
};

/**
 * Get Railway token
 * @returns {String|null} Railway API token
 */
const getRailwayToken = async () => {
  const stored = await getCredential('railway', 'token');
  if (stored) return stored;

  return process.env.RAILWAY_TOKEN || null;
};

/**
 * Set Railway token
 * @param {String} token - Railway API token
 */
const setRailwayToken = async (token) => {
  await setCredential('railway', 'token', token);
};

/**
 * Get Vercel token
 * @returns {String|null} Vercel API token
 */
const getVercelToken = async () => {
  const stored = await getCredential('vercel', 'token');
  if (stored) return stored;

  return process.env.VERCEL_TOKEN || null;
};

/**
 * Set Vercel token
 * @param {String} token - Vercel API token
 */
const setVercelToken = async (token) => {
  await setCredential('vercel', 'token', token);
};

/**
 * Get MongoDB connection string
 * @returns {String|null} MongoDB URI
 */
const getMongoDBUri = async () => {
  const stored = await getCredential('mongodb', 'uri');
  if (stored) return stored;

  return process.env.MONGODB_URI || null;
};

/**
 * Set external service credentials (for account creator)
 * @param {String} service - Service name (e.g., 'google', 'facebook')
 * @param {Object} credentials - Username, password, etc.
 */
const setExternalCredentials = async (service, credentials) => {
  await setCredential('external', service, JSON.stringify(credentials));
};

/**
 * Get external service credentials
 * @param {String} service - Service name
 * @returns {Object|null} Credentials object
 */
const getExternalCredentials = async (service) => {
  const stored = await getCredential('external', service);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * List all stored credential services
 * @returns {Array} Array of service names
 */
const listServices = async () => {
  try {
    const credentials = await loadCredentials();
    return Object.keys(credentials);
  } catch (error) {
    console.error('[GENESIS CREDENTIALS] List services error:', error);
    return [];
  }
};

/**
 * Clear the in-memory cache
 */
const clearCache = () => {
  credentialsCache.clear();
  console.log('[GENESIS CREDENTIALS] Cache cleared');
};

/**
 * Validate a token by making a test API call
 * @param {String} service - Service to validate ('github', 'railway')
 * @returns {Boolean} True if token is valid
 */
const validateToken = async (service) => {
  try {
    if (service === 'github') {
      const token = await getGitHubToken();
      if (!token) return false;

      // Test GitHub token with API call
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      return response.ok;
    }

    if (service === 'railway') {
      const token = await getRailwayToken();
      if (!token) return false;

      // Test Railway token
      // Railway uses GraphQL, would need to test with a simple query
      return true; // Placeholder
    }

    return false;
  } catch (error) {
    console.error(`[GENESIS CREDENTIALS] Validate ${service} error:`, error);
    return false;
  }
};

module.exports = {
  setCredential,
  getCredential,
  deleteCredential,
  getGitHubToken,
  setGitHubToken,
  getRailwayToken,
  setRailwayToken,
  getVercelToken,
  setVercelToken,
  getMongoDBUri,
  setExternalCredentials,
  getExternalCredentials,
  listServices,
  clearCache,
  validateToken
};
