const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔧 DEPRECATED: protectOrGuest now just calls protect (no guest tokens allowed)
// Kept for backwards compatibility - all routes now require valid JWT
exports.protectOrGuest = async (req, res, next) => {
  // No guest tokens - delegate to protect middleware
  return exports.protect(req, res, next);
};

// Protect routes - Verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Also check query parameter (needed for EventSource/SSE which can't send headers)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).lean();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists'
      });
    }

    // Add .id property for compatibility (Mongoose virtuals not included with .lean())
    req.user.id = req.user._id.toString();

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Require phone verification
exports.requirePhoneVerified = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized'
    });
  }

  if (!req.user.phoneVerified) {
    return res.status(403).json({
      success: false,
      error: 'Phone verification required',
      message: 'Please verify your phone number to access this feature',
      requiresVerification: true
    });
  }

  next();
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Admin middleware - requires owner or engineer role
exports.admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized'
    });
  }

  const isAdmin = req.user.roles &&
    (req.user.roles.includes('owner') || req.user.roles.includes('engineer') || req.user.roles.includes('admin'));

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

module.exports = exports;
