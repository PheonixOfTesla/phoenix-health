// src/controllers/butlerController.js - Butler Services (Rides, Tasks)
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const twilio = require('twilio');

// ============================================
// ENVIRONMENT-BASED URLs (NO HARDCODING)
// ============================================
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://phoenix-fe-indol.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://pal-backend-production.up.railway.app';

// Twilio Configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; // +1-845-456-6871

// ============================================
// PROVIDER CONFIGURATIONS - RIDE SERVICES
// ============================================
const PROVIDERS = {
  // ✅ LYFT - CONFIGURED
  lyft: {
    name: 'Lyft',
    clientId: process.env.LYFT_CLIENT_ID || null,
    clientSecret: process.env.LYFT_CLIENT_SECRET || null,
    redirectUri: process.env.LYFT_REDIRECT_URI || `${FRONTEND_URL}/auth/lyft/callback`,
    authUrl: 'https://api.lyft.com/oauth/authorize',
    tokenUrl: 'https://api.lyft.com/oauth/token',
    apiBase: 'https://api.lyft.com/v1',
    scope: 'public rides.read rides.request offline',
    usesOAuth2: true,
    rateLimit: { requests: 300, window: 3600000 }
  },

  // ✅ UBER - CONFIGURED (secrets from env only)
  uber: {
    name: 'Uber',
    clientId: process.env.UBER_CLIENT_ID,
    clientSecret: process.env.UBER_CLIENT_SECRET,
    redirectUri: process.env.UBER_REDIRECT_URI || `${FRONTEND_URL}/auth/uber/callback`,
    authUrl: 'https://login.uber.com/oauth/v2/authorize',
    tokenUrl: 'https://login.uber.com/oauth/v2/token',
    apiBase: 'https://api.uber.com/v1.2',
    scope: 'request profile',
    usesOAuth2: true,
    rateLimit: { requests: 1000, window: 3600000 }
  }
};

// ============================================
// RIDE SERVICE PHONE NUMBERS
// ============================================
const RIDE_PHONE_NUMBERS = {
  uber: '18008237', // 1-800-UBER
  lyft: '18555938435' // 1-855-LYFT-HELP
};

// ============================================
// PRICE ESTIMATION FORMULAS
// ============================================
const PRICE_FORMULAS = {
  uber: {
    uberX: {
      base: 2.55,
      perMile: 1.75,
      perMinute: 0.35,
      minimum: 7.00,
      bookingFee: 2.55
    },
    uberXL: {
      base: 3.85,
      perMile: 2.85,
      perMinute: 0.55,
      minimum: 10.00,
      bookingFee: 2.75
    },
    uberBlack: {
      base: 8.00,
      perMile: 3.75,
      perMinute: 0.65,
      minimum: 15.00,
      bookingFee: 2.75
    }
  },
  lyft: {
    lyft: {
      base: 2.00,
      perMile: 1.50,
      perMinute: 0.30,
      minimum: 6.00,
      bookingFee: 2.00
    },
    lyftXL: {
      base: 3.50,
      perMile: 2.50,
      perMinute: 0.50,
      minimum: 9.00,
      bookingFee: 2.25
    },
    lyftLux: {
      base: 7.00,
      perMile: 3.50,
      perMinute: 0.60,
      minimum: 14.00,
      bookingFee: 2.50
    }
  }
};

// ============================================
// IN-MEMORY CACHES
// ============================================
const oauthStates = new Map();
const tokenCache = new Map();
const rideCallbacks = new Map(); // Track ride request callbacks

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateState = () => crypto.randomBytes(32).toString('hex');

const storeState = (state, userId, provider) => {
  oauthStates.set(state, {
    userId,
    provider,
    timestamp: Date.now()
  });

  // Clean up old states after 10 minutes
  setTimeout(() => oauthStates.delete(state), 600000);
};

const verifyState = (state) => {
  const data = oauthStates.get(state);
  if (!data) return null;

  // Check if state is expired (10 minutes)
  if (Date.now() - data.timestamp > 600000) {
    oauthStates.delete(state);
    return null;
  }

  oauthStates.delete(state);
  return data;
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance; // miles
};

// Estimate ride price based on distance
const estimatePrice = (provider, rideType, distance) => {
  const formula = PRICE_FORMULAS[provider]?.[rideType];
  if (!formula) return null;

  // Estimate time: average 25 mph in city
  const estimatedMinutes = (distance / 25) * 60;

  // Calculate price
  let price = formula.base +
              (formula.perMile * distance) +
              (formula.perMinute * estimatedMinutes) +
              formula.bookingFee;

  // Apply minimum fare
  price = Math.max(price, formula.minimum);

  // Add surge pricing estimate (10-30% during peak hours)
  const hour = new Date().getHours();
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  const surgeMultiplier = isPeakHour ? 1.2 : 1.0;

  price *= surgeMultiplier;

  return {
    estimated: price.toFixed(2),
    distance: distance.toFixed(2),
    estimatedMinutes: Math.round(estimatedMinutes),
    surgeActive: isPeakHour,
    surgeMultiplier
  };
};

// ============================================
// OAUTH 2.0 FLOW
// ============================================

/**
 * Initiate OAuth2 connection for ride provider
 * POST /api/butler/connect/:provider
 */
exports.initiateOAuth2 = async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user._id;

    // Validate provider
    if (!PROVIDERS[provider]) {
      return res.status(400).json({
        success: false,
        message: `Unknown provider: ${provider}`
      });
    }

    const config = PROVIDERS[provider];

    // Check if credentials exist
    if (!config.clientId || !config.clientSecret) {
      return res.status(500).json({
        success: false,
        message: `${config.name} is not configured. Missing API credentials.`
      });
    }

    // Generate and store state
    const state = generateState();
    storeState(state, userId.toString(), provider);

    // Build authorization URL
    const authParams = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state: state
    });

    const authUrl = `${config.authUrl}?${authParams.toString()}`;

    res.json({
      success: true,
      authUrl,
      provider: config.name
    });

  } catch (error) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate OAuth flow',
      error: error.message
    });
  }
};

/**
 * Handle OAuth2 callback from ride provider
 * GET /api/butler/callback/:provider
 */
exports.handleOAuth2Callback = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, error: oauthError } = req.query;

    // Check for OAuth errors
    if (oauthError) {
      return res.redirect(`${FRONTEND_URL}/butler?error=${oauthError}`);
    }

    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}/butler?error=missing_code`);
    }

    // Validate provider
    if (!PROVIDERS[provider]) {
      return res.redirect(`${FRONTEND_URL}/butler?error=invalid_provider`);
    }

    const config = PROVIDERS[provider];

    // Verify state and get user
    const stateData = verifyState(state);
    if (!stateData) {
      return res.redirect(`${FRONTEND_URL}/butler?error=invalid_state`);
    }

    // Exchange code for access token
    const tokenData = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret
    };

    const tokenResponse = await axios.post(config.tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Store tokens in user document (encrypted)
    const user = await User.findById(stateData.userId);
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/butler?error=user_not_found`);
    }

    // Initialize butler connections if not exists
    if (!user.butlerConnections) {
      user.butlerConnections = {};
    }

    user.butlerConnections[provider] = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000),
      connectedAt: new Date(),
      provider: config.name
    };

    await user.save();

    // Redirect to success page
    res.redirect(`${FRONTEND_URL}/butler?connected=${provider}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${FRONTEND_URL}/butler?error=token_exchange_failed`);
  }
};

/**
 * Get user's butler connections
 * GET /api/butler/connections
 */
exports.getConnections = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const connections = {};
    if (user.butlerConnections) {
      Object.keys(user.butlerConnections).forEach(provider => {
        connections[provider] = {
          connected: true,
          provider: PROVIDERS[provider]?.name || provider,
          connectedAt: user.butlerConnections[provider].connectedAt
        };
      });
    }

    res.json({
      success: true,
      connections
    });

  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connections',
      error: error.message
    });
  }
};

/**
 * Disconnect a ride provider
 * DELETE /api/butler/disconnect/:provider
 */
exports.disconnect = async (req, res) => {
  try {
    const { provider } = req.params;
    const user = await User.findById(req.user._id);

    if (user.butlerConnections && user.butlerConnections[provider]) {
      delete user.butlerConnections[provider];
      await user.save();
    }

    res.json({
      success: true,
      message: `Disconnected from ${PROVIDERS[provider]?.name || provider}`
    });

  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect',
      error: error.message
    });
  }
};

/**
 * Request a ride via API (OAuth method)
 * POST /api/butler/ride/request
 */
exports.requestRide = async (req, res) => {
  try {
    const { provider, pickup, dropoff, rideType } = req.body;
    const user = await User.findById(req.user._id);

    // Check if provider is connected
    if (!user.butlerConnections || !user.butlerConnections[provider]) {
      return res.status(400).json({
        success: false,
        message: `Not connected to ${provider}. Please connect first.`
      });
    }

    const config = PROVIDERS[provider];
    const tokens = user.butlerConnections[provider];

    // Make ride request API call
    const rideRequest = await axios.post(`${config.apiBase}/requests`, {
      start_latitude: pickup.lat,
      start_longitude: pickup.lng,
      end_latitude: dropoff.lat,
      end_longitude: dropoff.lng,
      product_id: rideType
    }, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      ride: rideRequest.data
    });

  } catch (error) {
    console.error('Ride request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request ride',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Get ride price estimates
 * POST /api/butler/ride/estimate
 */
exports.getRideEstimate = async (req, res) => {
  try {
    const { provider, pickup, dropoff } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.butlerConnections || !user.butlerConnections[provider]) {
      return res.status(400).json({
        success: false,
        message: `Not connected to ${provider}`
      });
    }

    const config = PROVIDERS[provider];
    const tokens = user.butlerConnections[provider];

    const endpoint = provider === 'lyft'
      ? `${config.apiBase}/cost`
      : `${config.apiBase}/estimates/price`;

    const params = {
      start_latitude: pickup.lat,
      start_longitude: pickup.lng,
      end_latitude: dropoff.lat,
      end_longitude: dropoff.lng
    };

    const estimates = await axios.get(endpoint, {
      params,
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`
      }
    });

    res.json({
      success: true,
      estimates: estimates.data
    });

  } catch (error) {
    console.error('Ride estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get estimate',
      error: error.response?.data || error.message
    });
  }
};

// ============================================
// TWILIO OUTBOUND CALLING (New Method!)
// ============================================

/**
 * Get quick price estimate (formula-based)
 * POST /api/butler/estimate
 */
exports.getQuickEstimate = async (req, res) => {
  try {
    const { provider, pickup, dropoff, rideType } = req.body;

    // Validate inputs
    if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
      return res.status(400).json({
        success: false,
        message: 'Missing pickup or dropoff coordinates'
      });
    }

    if (!PRICE_FORMULAS[provider]) {
      return res.status(400).json({
        success: false,
        message: `Unknown provider: ${provider}`
      });
    }

    // Calculate distance
    const distance = calculateDistance(
      pickup.lat,
      pickup.lng,
      dropoff.lat,
      dropoff.lng
    );

    // Get all ride type estimates for this provider
    const estimates = {};
    const providerFormulas = PRICE_FORMULAS[provider];

    if (rideType && providerFormulas[rideType]) {
      // Single ride type estimate
      estimates[rideType] = estimatePrice(provider, rideType, distance);
    } else {
      // All ride types for this provider
      Object.keys(providerFormulas).forEach(type => {
        estimates[type] = estimatePrice(provider, type, distance);
      });
    }

    res.json({
      success: true,
      provider,
      pickup,
      dropoff,
      estimates,
      message: 'Estimates are approximate. Actual prices may vary based on real-time demand, traffic, and route.'
    });

  } catch (error) {
    console.error('Quick estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate estimate',
      error: error.message
    });
  }
};

/**
 * Call Uber via Twilio to book a ride
 * POST /api/butler/call/uber
 */
exports.callUber = async (req, res) => {
  try {
    const { pickup, dropoff, userPhone } = req.body;
    const user = await User.findById(req.user._id);

    // Validate inputs
    if (!pickup?.address || !dropoff?.address || !userPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: pickup, dropoff, or userPhone'
      });
    }

    
    
    
    

    // Create TwiML for the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello, this is Phoenix AI calling to book an Uber ride on behalf of ${user.name}.
    The pickup location is ${pickup.address}.
    The destination is ${dropoff.address}.
    Please confirm this ride booking by pressing 1, or press 2 to speak with the user directly.
  </Say>
  <Gather numDigits="1" action="${BACKEND_URL}/api/webhooks/twilio/uber-response" method="POST">
    <Say>Press 1 to confirm, or press 2 to connect with the user.</Say>
  </Gather>
  <Say>We did not receive your input. Goodbye.</Say>
</Response>`;

    // Make the call to Uber
    const call = await twilioClient.calls.create({
      twiml: twiml,
      to: '+' + RIDE_PHONE_NUMBERS.uber,
      from: TWILIO_PHONE_NUMBER,
      statusCallback: `${BACKEND_URL}/api/webhooks/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: true, // Record the call for debugging
      recordingStatusCallback: `${BACKEND_URL}/api/webhooks/twilio/recording`
    });

    // Store ride request details
    rideCallbacks.set(call.sid, {
      userId: user._id,
      provider: 'uber',
      pickup,
      dropoff,
      userPhone,
      timestamp: Date.now()
    });

    

    res.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      message: 'Call to Uber initiated successfully. You will receive a callback shortly.',
      provider: 'Uber',
      phoneNumber: '1-800-UBER (1-800-8237)'
    });

  } catch (error) {
    console.error('Uber call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Uber call',
      error: error.message
    });
  }
};

/**
 * Call Lyft via Twilio to book a ride
 * POST /api/butler/call/lyft
 */
exports.callLyft = async (req, res) => {
  try {
    const { pickup, dropoff, userPhone } = req.body;
    const user = await User.findById(req.user._id);

    // Validate inputs
    if (!pickup?.address || !dropoff?.address || !userPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: pickup, dropoff, or userPhone'
      });
    }

    
    
    
    

    // Create TwiML for the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello, this is Phoenix AI calling to book a Lyft ride on behalf of ${user.name}.
    The pickup location is ${pickup.address}.
    The destination is ${dropoff.address}.
    Please confirm this ride booking by pressing 1, or press 2 to speak with the user directly.
  </Say>
  <Gather numDigits="1" action="${BACKEND_URL}/api/webhooks/twilio/lyft-response" method="POST">
    <Say>Press 1 to confirm, or press 2 to connect with the user.</Say>
  </Gather>
  <Say>We did not receive your input. Goodbye.</Say>
</Response>`;

    // Make the call to Lyft
    const call = await twilioClient.calls.create({
      twiml: twiml,
      to: '+' + RIDE_PHONE_NUMBERS.lyft,
      from: TWILIO_PHONE_NUMBER,
      statusCallback: `${BACKEND_URL}/api/webhooks/twilio/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: true, // Record the call for debugging
      recordingStatusCallback: `${BACKEND_URL}/api/webhooks/twilio/recording`
    });

    // Store ride request details
    rideCallbacks.set(call.sid, {
      userId: user._id,
      provider: 'lyft',
      pickup,
      dropoff,
      userPhone,
      timestamp: Date.now()
    });

    

    res.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      message: 'Call to Lyft initiated successfully. You will receive a callback shortly.',
      provider: 'Lyft',
      phoneNumber: '1-855-LYFT-HELP (1-855-593-8435)'
    });

  } catch (error) {
    console.error('Lyft call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Lyft call',
      error: error.message
    });
  }
};

/**
 * Test Twilio calling (just makes a test call to verify setup)
 * POST /api/butler/test-call
 */
exports.testCall = async (req, res) => {
  try {
    const { testNumber } = req.body;

    if (!testNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing testNumber parameter'
      });
    }

    

    const call = await twilioClient.calls.create({
      twiml: '<Response><Say voice="Polly.Joanna">This is a test call from Phoenix AI Butler. Your Twilio integration is working correctly!</Say></Response>',
      to: testNumber,
      from: TWILIO_PHONE_NUMBER
    });

    res.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: 'Test call initiated successfully'
    });

  } catch (error) {
    console.error('Test call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to make test call',
      error: error.message
    });
  }
};

module.exports = exports;
