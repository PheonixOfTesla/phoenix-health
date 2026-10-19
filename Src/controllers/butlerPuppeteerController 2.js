// Src/controllers/butlerPuppeteerController.js
// Butler Controller using REAL Puppeteer Automation (No OAuth, No API keys)

const puppeteerButler = require('../services/phoenix/puppeteerButler');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// ============================================================================
// CREDENTIAL MANAGEMENT
// ============================================================================

// @desc    Store encrypted credentials for a service
// @route   POST /api/butler/credentials/:service
// @access  Private
exports.storeCredentials = asyncHandler(async (req, res) => {
  const { service } = req.params;
  const { email, password } = req.body;

  // Validate service
  const validServices = ['uber', 'lyft', 'opentable', 'doordash', 'ubereats'];
  if (!validServices.includes(service)) {
    res.status(400);
    throw new Error(`Invalid service. Must be one of: ${validServices.join(', ')}`);
  }

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // Encrypt credentials
  const encryptedEmail = puppeteerButler.encryptCredential(email);
  const encryptedPassword = puppeteerButler.encryptCredential(password);

  // Store in user document
  const user = await User.findById(req.user._id);
  if (!user.butlerCredentials) {
    user.butlerCredentials = {};
  }

  user.butlerCredentials[service] = {
    encryptedEmail,
    encryptedPassword,
    connectedAt: new Date()
  };

  await user.save();

  res.json({
    success: true,
    message: `${service} credentials stored successfully`,
    service,
    connectedAt: user.butlerCredentials[service].connectedAt
  });
});

// @desc    Get list of connected services
// @route   GET /api/butler/credentials
// @access  Private
exports.getCredentials = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('butlerCredentials');

  const connections = {};
  if (user.butlerCredentials) {
    Object.keys(user.butlerCredentials).forEach(service => {
      connections[service] = {
        connected: true,
        connectedAt: user.butlerCredentials[service].connectedAt
      };
    });
  }

  res.json({
    success: true,
    connections
  });
});

// @desc    Remove credentials for a service
// @route   DELETE /api/butler/credentials/:service
// @access  Private
exports.removeCredentials = asyncHandler(async (req, res) => {
  const { service } = req.params;

  const user = await User.findById(req.user._id);

  if (user.butlerCredentials && user.butlerCredentials[service]) {
    delete user.butlerCredentials[service];
    await user.save();
  }

  res.json({
    success: true,
    message: `${service} credentials removed`
  });
});

// ============================================================================
// UBER RIDE BOOKING
// ============================================================================

// @desc    Book an Uber ride using Puppeteer automation
// @route   POST /api/butler/uber/book
// @access  Private
exports.bookUberRide = asyncHandler(async (req, res) => {
  const { pickup, destination, rideType = 'UberX' } = req.body;

  if (!pickup || !destination) {
    res.status(400);
    throw new Error('Pickup and destination addresses are required');
  }

  // Get user credentials
  const user = await User.findById(req.user._id).select('butlerCredentials');

  if (!user.butlerCredentials || !user.butlerCredentials.uber) {
    res.status(400);
    throw new Error('Uber credentials not found. Please store your credentials first.');
  }

  // Book ride using Puppeteer
  const result = await puppeteerButler.bookUberRide({
    userId: req.user._id,
    credentials: user.butlerCredentials.uber,
    pickup,
    destination,
    rideType
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// LYFT RIDE BOOKING
// ============================================================================

// @desc    Book a Lyft ride using Puppeteer automation
// @route   POST /api/butler/lyft/book
// @access  Private
exports.bookLyftRide = asyncHandler(async (req, res) => {
  const { pickup, destination, rideType = 'Lyft' } = req.body;

  if (!pickup || !destination) {
    res.status(400);
    throw new Error('Pickup and destination addresses are required');
  }

  // Get user credentials
  const user = await User.findById(req.user._id).select('butlerCredentials');

  if (!user.butlerCredentials || !user.butlerCredentials.lyft) {
    res.status(400);
    throw new Error('Lyft credentials not found. Please store your credentials first.');
  }

  // Book ride using Puppeteer
  const result = await puppeteerButler.bookLyftRide({
    userId: req.user._id,
    credentials: user.butlerCredentials.lyft,
    pickup,
    destination,
    rideType
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// OPENTABLE RESERVATIONS
// ============================================================================

// @desc    Make an OpenTable reservation using Puppeteer automation
// @route   POST /api/butler/opentable/reserve
// @access  Private
exports.makeOpenTableReservation = asyncHandler(async (req, res) => {
  const { restaurantName, date, time, partySize, preferences = {} } = req.body;

  if (!restaurantName || !date || !time || !partySize) {
    res.status(400);
    throw new Error('Restaurant name, date, time, and party size are required');
  }

  // Get user credentials (optional for OpenTable, can book as guest)
  const user = await User.findById(req.user._id).select('butlerCredentials name email phone');

  let credentials = null;
  if (user.butlerCredentials && user.butlerCredentials.opentable) {
    credentials = user.butlerCredentials.opentable;
  }

  // Add user info to preferences if not provided
  if (!preferences.firstName) preferences.firstName = user.name.split(' ')[0];
  if (!preferences.lastName) preferences.lastName = user.name.split(' ')[1] || '';
  if (!preferences.email) preferences.email = user.email;
  if (!preferences.phone) preferences.phone = user.phone;

  // Make reservation using Puppeteer
  const result = await puppeteerButler.makeOpenTableReservation({
    userId: req.user._id,
    credentials,
    restaurantName,
    date,
    time,
    partySize,
    preferences
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// DOORDASH FOOD DELIVERY
// ============================================================================

// @desc    Order food from DoorDash using Puppeteer automation
// @route   POST /api/butler/doordash/order
// @access  Private
exports.orderDoorDash = asyncHandler(async (req, res) => {
  const { restaurant, items = [], deliveryAddress, preferences = {} } = req.body;

  if (!restaurant || items.length === 0 || !deliveryAddress) {
    res.status(400);
    throw new Error('Restaurant, items, and delivery address are required');
  }

  // Get user credentials
  const user = await User.findById(req.user._id).select('butlerCredentials');

  if (!user.butlerCredentials || !user.butlerCredentials.doordash) {
    res.status(400);
    throw new Error('DoorDash credentials not found. Please store your credentials first.');
  }

  // Order food using Puppeteer
  const result = await puppeteerButler.orderDoorDash({
    userId: req.user._id,
    credentials: user.butlerCredentials.doordash,
    restaurant,
    items,
    deliveryAddress,
    preferences
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// UBER EATS FOOD DELIVERY
// ============================================================================

// @desc    Order food from Uber Eats using Puppeteer automation
// @route   POST /api/butler/ubereats/order
// @access  Private
exports.orderUberEats = asyncHandler(async (req, res) => {
  const { restaurant, items = [], deliveryAddress, preferences = {} } = req.body;

  if (!restaurant || items.length === 0 || !deliveryAddress) {
    res.status(400);
    throw new Error('Restaurant, items, and delivery address are required');
  }

  // Get user credentials (can share Uber credentials)
  const user = await User.findById(req.user._id).select('butlerCredentials');

  let credentials = null;
  if (user.butlerCredentials && user.butlerCredentials.ubereats) {
    credentials = user.butlerCredentials.ubereats;
  } else if (user.butlerCredentials && user.butlerCredentials.uber) {
    // Fallback to Uber credentials (Uber Eats shares login with Uber)
    credentials = user.butlerCredentials.uber;
  } else {
    res.status(400);
    throw new Error('Uber Eats or Uber credentials not found. Please store your credentials first.');
  }

  // Order food using Puppeteer
  const result = await puppeteerButler.orderUberEats({
    userId: req.user._id,
    credentials,
    restaurant,
    items,
    deliveryAddress,
    preferences
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// BUTLER ACTION HISTORY
// ============================================================================

// @desc    Get butler action history
// @route   GET /api/butler/actions
// @access  Private
exports.getActionHistory = asyncHandler(async (req, res) => {
  const { actionType, limit = 50 } = req.query;

  const actions = await puppeteerButler.getActionHistory(
    req.user._id,
    actionType,
    parseInt(limit)
  );

  res.json({
    success: true,
    count: actions.length,
    actions
  });
});

// @desc    Get specific butler action status
// @route   GET /api/butler/actions/:actionId
// @access  Private
exports.getActionStatus = asyncHandler(async (req, res) => {
  const { actionId } = req.params;

  const action = await puppeteerButler.getActionStatus(actionId);

  if (!action) {
    res.status(404);
    throw new Error('Action not found');
  }

  // Verify this action belongs to the current user
  if (action.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this action');
  }

  res.json({
    success: true,
    action
  });
});
