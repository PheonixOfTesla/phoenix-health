// Src/controllers/wearableController.js - Fitbit/Polar/Wearable OAuth
// Ported from ClockWork with Phoenix URLs
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');

// In-memory state storage (Redis optional)
const inMemoryStates = new Map();
const inMemoryTokenCache = new Map();

// PKCE helpers
const generateCodeVerifier = () => crypto.randomBytes(32).toString('base64url');
const generateCodeChallenge = (verifier) => crypto.createHash('sha256').update(verifier).digest('base64url');
// Encode userId in state for multi-instance compatibility (no memory lookup needed)
const generateState = (userId) => `${userId}:${crypto.randomBytes(32).toString('hex')}`;

// ============================================
// ENVIRONMENT-BASED URLs (NO HARDCODING)
// ============================================
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://phoenix-fe-indol.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://pal-backend-production.up.railway.app';

// Provider configs - All credentials from environment variables
const PROVIDERS = {
  fitbit: {
    name: 'Fitbit',
    clientId: process.env.FITBIT_CLIENT_ID,
    clientSecret: process.env.FITBIT_CLIENT_SECRET,
    // Must match what's registered in Fitbit Dev Portal AND what this controller handles
    redirectUri: process.env.FITBIT_REDIRECT_URI || `${BACKEND_URL}/api/wearables/callback/fitbit`,
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    apiBase: 'https://api.fitbit.com/1',
    scope: 'activity heartrate sleep profile weight nutrition oxygen_saturation respiratory_rate cardio_fitness temperature',
    usesOAuth2: true,
    usesPKCE: false  // Disabled for multi-instance compatibility (uses client_secret instead)
  },
  polar: {
    name: 'Polar',
    clientId: process.env.POLAR_CLIENT_ID,
    clientSecret: process.env.POLAR_CLIENT_SECRET,
    redirectUri: process.env.POLAR_REDIRECT_URI || `${BACKEND_URL}/api/wearables/callback/polar`,
    authUrl: 'https://flow.polar.com/oauth2/authorization',
    tokenUrl: 'https://polarremote.com/v2/oauth2/token',
    apiBase: 'https://www.polaraccesslink.com/v3',
    scope: 'accesslink.read_all',
    usesOAuth2: true,
    usesPKCE: false
  }
};

// State management
const storeState = async (state, userId, provider, additionalData = {}) => {
  const stateData = { userId, provider, timestamp: Date.now(), ...additionalData };
  inMemoryStates.set(state, stateData);
  setTimeout(() => inMemoryStates.delete(state), 10 * 60 * 1000); // 10 min expiry
  console.log(`[Wearable] State stored for ${provider}`);
  return true;
};

const verifyState = async (state, provider) => {
  // First try memory lookup (for PKCE codeVerifier)
  const memoryData = inMemoryStates.get(state);
  if (memoryData) {
    inMemoryStates.delete(state);
    console.log('[Wearable] State verified from memory');
    return memoryData;
  }

  // Fallback: decode userId from state (format: userId:randomHex)
  // This works across multiple instances without shared memory
  if (state && state.includes(':')) {
    const [userId, randomPart] = state.split(':');
    if (userId && randomPart && randomPart.length === 64 && /^[a-f0-9]+$/i.test(randomPart)) {
      console.log('[Wearable] State verified from format (multi-instance fallback)');
      return { userId, provider, codeVerifier: null }; // No PKCE data in fallback
    }
  }

  console.error('[Wearable] State not found or invalid format');
  return null;
};

const buildBasicAuth = (clientId, clientSecret) => {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
};

// Store tokens in user document
const storeWearableTokens = async (userId, provider, tokens) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!user.wearableConnections) user.wearableConnections = [];

  const connectionData = {
    provider,
    connected: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null,
    externalUserId: tokens.externalUserId,
    lastSync: new Date(),
    scopes: tokens.scope ? tokens.scope.split(' ') : []
  };

  const idx = user.wearableConnections.findIndex(c => c.provider === provider);
  if (idx >= 0) {
    user.wearableConnections[idx] = connectionData;
  } else {
    user.wearableConnections.push(connectionData);
  }

  user.markModified('wearableConnections');
  await user.save();
  console.log(`[Wearable] Tokens stored for ${provider}`);
  return connectionData;
};

const getWearableConnection = async (userId, provider) => {
  const user = await User.findById(userId);
  if (!user?.wearableConnections) return null;
  return user.wearableConnections.find(c => c.provider === provider);
};

// ============================================
// OAUTH ENDPOINTS
// ============================================

const initiateOAuth2 = async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user._id || req.user.id;

    const config = PROVIDERS[provider];
    if (!config || !config.usesOAuth2) {
      return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    if (!config.clientId) {
      return res.status(500).json({ success: false, error: `${config.name} not configured` });
    }

    const state = generateState(userId.toString());
    const additionalData = {};

    let codeChallenge = null;
    if (config.usesPKCE) {
      const codeVerifier = generateCodeVerifier();
      codeChallenge = generateCodeChallenge(codeVerifier);
      additionalData.codeVerifier = codeVerifier;
      console.log('[Wearable] PKCE enabled');
    }

    await storeState(state, userId.toString(), provider, additionalData);

    const authParams = {
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state: state,
      prompt: 'login consent'
    };

    if (config.usesPKCE && codeChallenge) {
      authParams.code_challenge = codeChallenge;
      authParams.code_challenge_method = 'S256';
    }

    const authUrl = `${config.authUrl}?${new URLSearchParams(authParams).toString()}`;

    console.log(`[Wearable] OAuth URL generated for ${provider}`);
    res.json({ success: true, authUrl, provider: config.name });
  } catch (error) {
    console.error('[Wearable] OAuth init error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate OAuth' });
  }
};

const handleOAuth2Callback = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;

    console.log(`[Wearable] OAuth callback for ${provider}`);

    if (error) {
      console.error('[Wearable] OAuth error:', error);
      return res.redirect(`${FRONTEND_URL}/dashboard.html?wearable_error=oauth_error`);
    }

    const stateData = await verifyState(state, provider);
    if (!stateData) {
      return res.redirect(`${FRONTEND_URL}/dashboard.html?wearable_error=Invalid+OAuth+state`);
    }

    const config = PROVIDERS[provider];
    const { userId, codeVerifier } = stateData;

    const tokenRequestBody = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId
    };

    if (config.usesPKCE && codeVerifier) {
      tokenRequestBody.code_verifier = codeVerifier;
    } else {
      tokenRequestBody.client_secret = config.clientSecret;
    }

    console.log('[Wearable] Requesting token...');

    const tokenResponse = await axios.post(
      config.tokenUrl,
      new URLSearchParams(tokenRequestBody),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': buildBasicAuth(config.clientId, config.clientSecret)
        }
      }
    );

    console.log('[Wearable] Token received');

    const { access_token, refresh_token, expires_in, user_id, scope } = tokenResponse.data;

    await storeWearableTokens(userId, provider, {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      externalUserId: user_id,
      scope: scope
    });

    console.log(`[Wearable] ${provider} connected successfully`);
    return res.redirect(`${FRONTEND_URL}/dashboard.html?wearable_connected=${provider}`);
  } catch (error) {
    console.error('[Wearable] Callback error:', error.response?.data || error.message);
    return res.redirect(`${FRONTEND_URL}/dashboard.html?wearable_error=auth_failed`);
  }
};

// ============================================
// FITBIT DATA FETCHING
// ============================================

const safeFitbitCall = async (accessToken, endpoint, description) => {
  try {
    console.log(`[Fitbit] Fetching ${description}...`);
    const response = await axios.get(`https://api.fitbit.com/1${endpoint}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) throw new Error('TOKEN_EXPIRED');
    console.warn(`[Fitbit] ${description} unavailable:`, error.message);
    return null;
  }
};

const fetchFitbitData = async (accessToken, date) => {
  console.log(`[Fitbit] Fetching data for ${date}`);

  const result = {
    steps: 0, distance: 0, caloriesBurned: 0, activeMinutes: 0,
    restingHeartRate: 0, sleepDuration: 0, deepSleep: 0, remSleep: 0, lightSleep: 0,
    hrv: null, breathingRate: null, spo2Avg: null, recoveryScore: 0
  };

  // Activity
  const activity = await safeFitbitCall(accessToken, `/user/-/activities/date/${date}.json`, 'Activity');
  if (activity?.summary) {
    result.steps = activity.summary.steps || 0;
    result.distance = activity.summary.distances?.[0]?.distance || 0;
    result.caloriesBurned = activity.summary.caloriesOut || 0;
    result.activeMinutes = (activity.summary.veryActiveMinutes || 0) + (activity.summary.fairlyActiveMinutes || 0);
  }

  // Heart Rate
  const hr = await safeFitbitCall(accessToken, `/user/-/activities/heart/date/${date}/1d.json`, 'Heart Rate');
  if (hr?.['activities-heart']?.[0]?.value) {
    result.restingHeartRate = hr['activities-heart'][0].value.restingHeartRate || 0;
  }

  // Sleep
  const sleep = await safeFitbitCall(accessToken, `.2/user/-/sleep/date/${date}.json`, 'Sleep');
  if (sleep?.sleep?.[0]) {
    const s = sleep.sleep[0];
    result.sleepDuration = s.minutesAsleep || 0;
    result.deepSleep = s.levels?.summary?.deep?.minutes || 0;
    result.remSleep = s.levels?.summary?.rem?.minutes || 0;
    result.lightSleep = s.levels?.summary?.light?.minutes || 0;
  }

  // HRV (Premium)
  const hrv = await safeFitbitCall(accessToken, `/user/-/hrv/date/${date}.json`, 'HRV');
  if (hrv?.hrv?.[0]) {
    result.hrv = hrv.hrv[0].value?.dailyRmssd || null;
  }

  // Calculate recovery score
  if (result.hrv || result.restingHeartRate || result.sleepDuration) {
    let score = 0, weight = 0;
    if (result.hrv) { score += Math.min((result.hrv / 80) * 100, 100) * 0.4; weight += 0.4; }
    if (result.restingHeartRate) { score += Math.max(0, 100 - ((result.restingHeartRate - 40) / 40 * 100)) * 0.3; weight += 0.3; }
    if (result.sleepDuration) { score += Math.min((result.sleepDuration / 480) * 100, 100) * 0.3; weight += 0.3; }
    result.recoveryScore = weight > 0 ? Math.round(score / weight) : 0;
  }

  console.log('[Fitbit] Data fetched:', { steps: result.steps, sleep: result.sleepDuration, recovery: result.recoveryScore });
  return result;
};

// ============================================
// SYNC ENDPOINT
// ============================================

const syncWearableData = async (req, res) => {
  try {
    const { provider } = req.params;
    const { days = 2 } = req.query; // Default to 2 days (48 hours)
    const userId = req.user._id || req.user.id;
    const numDays = Math.min(parseInt(days) || 2, 7); // Max 7 days

    console.log(`[Wearable] Sync: ${provider} for user ${userId}, ${numDays} days`);

    const connection = await getWearableConnection(userId, provider);
    if (!connection?.connected) {
      return res.status(404).json({ success: false, error: 'Device not connected', needsConnection: true });
    }

    if (provider === 'fitbit') {
      const allData = [];
      const today = new Date();

      // Fetch data for each day
      for (let i = 0; i < numDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          console.log(`[Wearable] Fetching Fitbit data for ${dateStr}...`);
          const dayData = await fetchFitbitData(connection.accessToken, dateStr);
          allData.push({
            date: dateStr,
            ...dayData
          });
        } catch (err) {
          console.warn(`[Wearable] Failed to fetch data for ${dateStr}:`, err.message);
          if (err.message === 'TOKEN_EXPIRED') throw err;
        }
      }

      // Calculate aggregated stats
      const aggregated = {
        totalSteps: allData.reduce((sum, d) => sum + (d.steps || 0), 0),
        totalDistance: allData.reduce((sum, d) => sum + (d.distance || 0), 0),
        totalCalories: allData.reduce((sum, d) => sum + (d.caloriesBurned || 0), 0),
        totalActiveMinutes: allData.reduce((sum, d) => sum + (d.activeMinutes || 0), 0),
        avgSleepDuration: Math.round(allData.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / allData.length),
        avgRestingHeartRate: Math.round(allData.filter(d => d.restingHeartRate).reduce((sum, d) => sum + d.restingHeartRate, 0) / allData.filter(d => d.restingHeartRate).length) || 0,
        avgRecoveryScore: Math.round(allData.filter(d => d.recoveryScore).reduce((sum, d) => sum + d.recoveryScore, 0) / allData.filter(d => d.recoveryScore).length) || 0
      };

      // Update user's lastWearableData with today's data
      const todayData = allData.find(d => d.date === today.toISOString().split('T')[0]) || allData[0];
      await User.findByIdAndUpdate(userId, {
        lastWearableSync: new Date(),
        lastWearableData: todayData
      });

      // Update lastSync in wearableConnections
      await User.findOneAndUpdate(
        { _id: userId, 'wearableConnections.provider': 'fitbit' },
        { $set: { 'wearableConnections.$.lastSync': new Date() } }
      );

      return res.json({
        success: true,
        provider: 'Fitbit',
        daysRequested: numDays,
        daysRetrieved: allData.length,
        data: allData,
        aggregated,
        latestData: todayData
      });
    }

    res.status(400).json({ success: false, error: 'Provider sync not implemented' });
  } catch (error) {
    console.error('[Wearable] Sync error:', error);
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({ success: false, error: 'Session expired', needsReconnect: true });
    }
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
};

// ============================================
// OTHER ENDPOINTS
// ============================================

const getConnections = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    const connections = (user?.wearableConnections || []).map(c => ({
      provider: c.provider,
      connected: c.connected,
      lastSync: c.lastSync,
      providerName: PROVIDERS[c.provider]?.name || c.provider
    }));
    res.json({ success: true, connections });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch connections' });
  }
};

const disconnect = async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    const idx = user.wearableConnections?.findIndex(c => c.provider === provider);

    if (idx >= 0) {
      user.wearableConnections.splice(idx, 1);
      user.markModified('wearableConnections');
      await user.save();
    }

    res.json({ success: true, message: `${provider} disconnected` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
};

const getLatestData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    res.json({
      success: true,
      lastSync: user?.lastWearableSync,
      data: user?.lastWearableData || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get data' });
  }
};

module.exports = {
  initiateOAuth2,
  handleOAuth2Callback,
  syncWearableData,
  getConnections,
  disconnect,
  getLatestData
};
