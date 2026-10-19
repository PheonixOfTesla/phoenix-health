/**
 * GENESIS AUTHENTICATION MIDDLEWARE
 *
 * Purpose: Enforce God account restrictions for Genesis-level operations
 * God Account: Digitalappleco@gmail.com
 *
 * Security Model:
 * - Only Genesis God can perform self-modification operations
 * - All other users receive 403 Forbidden
 * - All Genesis operations are logged for audit trail
 */

const GenesisOperation = require('../models/genesis/GenesisOperation');

/**
 * Check if user is the Genesis God account
 * @param {Object} req - Express request object
 * @returns {Boolean} True if user is Genesis God
 */
const isGenesisGod = (req) => {
  if (!req.user) {
    return false;
  }

  const godEmail = 'Digitalappleco@gmail.com';
  return req.user.email === godEmail;
};

/**
 * Middleware to require Genesis God permissions
 * Returns 403 if user is not authorized
 */
const requireGenesisGod = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access Genesis operations'
      });
    }

    if (!isGenesisGod(req)) {
      // Log unauthorized access attempt
      console.warn(`[GENESIS] Unauthorized access attempt by ${req.user.email}`);

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Genesis operations require God account privileges',
        userEmail: req.user.email,
        godEmail: 'Digitalappleco@gmail.com',
        hint: 'Regular users cannot modify backend structure. You can customize your own Phoenix experience through settings.'
      });
    }

    // User is authorized - log the access
    console.log(`[GENESIS] ${req.method} ${req.path} - Authorized: ${req.user.email}`);

    // Add Genesis context to request
    req.isGenesisGod = true;
    req.genesisContext = {
      userId: req.user._id,
      userEmail: req.user.email,
      timestamp: new Date(),
      endpoint: req.path,
      method: req.method
    };

    next();
  } catch (error) {
    console.error('[GENESIS AUTH ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Failed to verify Genesis permissions'
    });
  }
};

/**
 * Log Genesis operation to database
 * @param {Object} req - Express request
 * @param {String} operationType - Type of operation
 * @param {Object} metadata - Additional operation data
 */
const logGenesisOperation = async (req, operationType, metadata = {}) => {
  try {
    if (!req.user) return;

    const operation = new GenesisOperation({
      operationId: `genesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      user: req.user._id,
      operationType,
      metadata: {
        ...metadata,
        endpoint: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
      },
      success: null // Will be updated when operation completes
    });

    await operation.save();

    console.log(`[GENESIS OPERATION LOGGED] ${operationType} by ${req.user.email}`);

    return operation._id;
  } catch (error) {
    console.error('[GENESIS LOG ERROR]', error);
    // Don't fail the request if logging fails
    return null;
  }
};

/**
 * Middleware to log successful Genesis operations
 * Call this after operation succeeds
 */
const logGenesisSuccess = async (operationId, result = {}) => {
  try {
    if (!operationId) return;

    await GenesisOperation.findByIdAndUpdate(operationId, {
      success: true,
      result,
      completedAt: new Date()
    });

    console.log(`[GENESIS SUCCESS] Operation ${operationId} completed`);
  } catch (error) {
    console.error('[GENESIS LOG SUCCESS ERROR]', error);
  }
};

/**
 * Middleware to log failed Genesis operations
 * Call this when operation fails
 */
const logGenesisFailure = async (operationId, error) => {
  try {
    if (!operationId) return;

    await GenesisOperation.findByIdAndUpdate(operationId, {
      success: false,
      error: error.message || String(error),
      errorStack: error.stack,
      completedAt: new Date()
    });

    console.error(`[GENESIS FAILURE] Operation ${operationId} failed:`, error.message);
  } catch (logError) {
    console.error('[GENESIS LOG FAILURE ERROR]', logError);
  }
};

/**
 * Get Genesis operation history for a user
 * @param {String} userId - User ID
 * @param {Number} limit - Number of operations to return
 * @returns {Array} Array of operations
 */
const getGenesisHistory = async (userId, limit = 50) => {
  try {
    const operations = await GenesisOperation
      .find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .lean();

    return operations;
  } catch (error) {
    console.error('[GENESIS HISTORY ERROR]', error);
    return [];
  }
};

/**
 * Check if Genesis operations are currently running
 * @returns {Boolean} True if operations are in progress
 */
const isGenesisActive = async () => {
  try {
    const activeOps = await GenesisOperation.countDocuments({
      success: null,
      timestamp: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
    });

    return activeOps > 0;
  } catch (error) {
    console.error('[GENESIS ACTIVE CHECK ERROR]', error);
    return false;
  }
};

module.exports = {
  isGenesisGod,
  requireGenesisGod,
  logGenesisOperation,
  logGenesisSuccess,
  logGenesisFailure,
  getGenesisHistory,
  isGenesisActive
};
