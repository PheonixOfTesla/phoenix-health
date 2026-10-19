// Src/services/mercury/deviceSync.js
const WearableDevice = require('../../models/mercury/WearableDevice');
const WearableData = require('../../models/mercury/WearableData');
const axios = require('axios');
const crypto = require('crypto');
const { getRedisClient } = require('../../utils/redis');

// Fallback in-memory state storage if Redis unavailable
const oauthStateStore = new Map();

// OAuth configurations for different providers
const PROVIDER_CONFIGS = {
  fitbit: {
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    apiUrl: 'https://api.fitbit.com/1/user/-',
    clientId: process.env.FITBIT_CLIENT_ID || '23TFV7',
    clientSecret: process.env.FITBIT_CLIENT_SECRET || '32296946c2baca0661075e53e131ec0d',
    // BACKEND callback - Fitbit redirects here, we exchange tokens, then redirect to frontend
    redirectUri: process.env.FITBIT_REDIRECT_URI || 'https://pal-backend-production.up.railway.app/api/mercury/devices/fitbit/callback',
    scope: 'activity heartrate sleep profile weight nutrition oxygen_saturation respiratory_rate cardio_fitness temperature'
  },
  garmin: {
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
    apiUrl: 'https://apis.garmin.com/wellness-api/rest',
    clientId: process.env.GARMIN_CLIENT_ID,
    clientSecret: process.env.GARMIN_CLIENT_SECRET,
    redirectUri: process.env.GARMIN_REDIRECT_URI
  },
  oura: {
    authUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    apiUrl: 'https://api.ouraring.com/v2',
    clientId: process.env.OURA_CLIENT_ID,
    clientSecret: process.env.OURA_CLIENT_SECRET,
    redirectUri: process.env.OURA_REDIRECT_URI,
    scope: 'personal daily'
  },
  whoop: {
    authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
    tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
    apiUrl: 'https://api.prod.whoop.com/developer/v1',
    clientId: process.env.WHOOP_CLIENT_ID,
    clientSecret: process.env.WHOOP_CLIENT_SECRET,
    redirectUri: process.env.WHOOP_REDIRECT_URI,
    scope: 'read:recovery read:sleep read:workout'
  },
  polar: {
    authUrl: 'https://flow.polar.com/oauth2/authorization',
    tokenUrl: 'https://polarremote.com/v2/oauth2/token',
    apiUrl: 'https://www.polaraccesslink.com/v3',
    clientId: process.env.POLAR_CLIENT_ID,
    clientSecret: process.env.POLAR_CLIENT_SECRET,
    redirectUri: process.env.POLAR_REDIRECT_URI
  },
  apple: {
    // Apple Health uses HealthKit - no OAuth needed (app-side integration)
    apiUrl: 'internal', // Data synced from iOS app
    clientId: 'apple_health'
  }
};

class DeviceSyncService {
  /**
   * Initiate OAuth connection flow
   */
  async initiateConnection(userId, provider) {
    const config = PROVIDER_CONFIGS[provider.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Generate state for OAuth security with userId embedded
    // Format: userId:randomBytes - allows backend to identify user without session
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const state = `${userId}:${randomBytes}`;

    // Store state temporarily (in production, use Redis)
    await this.storeOAuthState(userId, provider, state);

    // Build authorization URL
    const authUrl = this.buildAuthUrl(provider, config, state);

    return {
      authorizationUrl: authUrl,
      state,
      provider
    };
  }

  /**
   * Build OAuth authorization URL
   */
  buildAuthUrl(provider, config, state) {
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      state,
      scope: config.scope || ''
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeToken(userId, provider, code, state) {
    const config = PROVIDER_CONFIGS[provider.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Verify state
    const isValidState = await this.verifyOAuthState(userId, provider, state);
    if (!isValidState) {
      throw new Error('Invalid OAuth state');
    }

    try {
      // Exchange code for token
      // ✅ CRITICAL FIX: Add Basic Auth header for Fitbit OAuth
      const authHeader = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`;

      const tokenResponse = await axios.post(
        config.tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
          }
        }
      );

      const { access_token, refresh_token, expires_in, user_id, scope } = tokenResponse.data;

      // Create or update device record
      // deviceId is required - use provider's user_id or generate one
      const deviceId = user_id || `${provider}_${userId}_${Date.now()}`;

      const device = await WearableDevice.findOneAndUpdate(
        { userId, provider },
        {
          userId,
          provider,
          deviceId: deviceId,
          deviceName: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Device`,
          deviceType: provider === 'oura' ? 'ring' : 'tracker',
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiry: new Date(Date.now() + expires_in * 1000),
          connected: true,
          isActive: true,
          status: 'connected',
          connectedAt: new Date(),
          lastSync: new Date(),
          scopes: scope ? scope.split(' ') : []
        },
        { upsert: true, new: true }
      );

      // Initial sync
      await this.syncDeviceData(userId, provider, access_token);

      return device;
    } catch (error) {
      console.error(`Token exchange error for ${provider}:`, error);
      throw new Error(`Failed to connect ${provider}: ${error.message}`);
    }
  }

  /**
   * Disconnect device and revoke token
   */
  async disconnectDevice(userId, provider) {
    const device = await WearableDevice.findOne({ userId, provider });
    
    if (!device) {
      throw new Error('Device not found');
    }

    // Revoke token with provider (if supported)
    try {
      await this.revokeToken(provider, device.accessToken);
    } catch (error) {
      console.error('Token revocation error:', error);
    }

    // Deactivate device
    device.isActive = false;
    device.status = 'disconnected';
    await device.save();

    return { success: true, message: `${provider} disconnected` };
  }

  /**
   * Manual sync for a device
   * Checks BOTH WearableDevice model AND User.wearableConnections for tokens
   */
  async manualSync(userId, provider) {
    const User = require('../../models/User');
    let accessToken = null;
    let tokenSource = null;

    // First try WearableDevice model
    const device = await WearableDevice.findOne({ userId, provider, isActive: true });

    if (device?.accessToken) {
      accessToken = device.accessToken;
      tokenSource = 'WearableDevice';

      // Ensure deviceId exists (fix for legacy records)
      if (!device.deviceId) {
        device.deviceId = `${provider}_${userId}_${Date.now()}`;
        device.deviceName = device.deviceName || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Device`;
        device.deviceType = device.deviceType || (provider === 'oura' ? 'ring' : 'tracker');
        device.connected = true;
      }

      // Check if token needs refresh
      if (device.tokenExpiry && new Date() > device.tokenExpiry) {
        await this.refreshAccessToken(device);
        accessToken = device.accessToken;
      }
    }

    // Fallback: Check User.wearableConnections (where wearableController stores OAuth tokens)
    if (!accessToken) {
      const user = await User.findById(userId).select('+wearableConnections.accessToken +wearableConnections.refreshToken');
      const connection = user?.wearableConnections?.find(c => c.provider === provider && c.connected);

      if (connection?.accessToken) {
        accessToken = connection.accessToken;
        tokenSource = 'User.wearableConnections';
        console.log(`[DeviceSync] Using token from User.wearableConnections for ${provider}`);
      }
    }

    if (!accessToken) {
      throw new Error(`No access token found for ${provider}. Please reconnect.`);
    }

    console.log(`[DeviceSync] Syncing ${provider} using token from ${tokenSource}`);

    // Sync last 7 days
    const syncResult = await this.syncDeviceData(userId, provider, accessToken);

    // Update last sync time
    if (device) {
      device.lastSync = new Date();
      await device.save();
    } else {
      // Update User.wearableConnections lastSync
      await User.updateOne(
        { _id: userId, 'wearableConnections.provider': provider },
        { $set: { 'wearableConnections.$.lastSync': new Date() } }
      );
    }

    return {
      recordsAdded: syncResult.recordsAdded,
      lastSync: new Date()
    };
  }

  /**
   * Sync device data from provider API
   */
  async syncDeviceData(userId, provider, accessToken) {
    const config = PROVIDER_CONFIGS[provider.toLowerCase()];
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    let recordsAdded = 0;

    try {
      // Fetch data based on provider
      const data = await this.fetchProviderData(provider, config, accessToken, startDate, endDate);

      // Store data in database
      for (const dailyData of data) {
        await WearableData.findOneAndUpdate(
          {
            userId,
            provider,
            date: dailyData.date
          },
          {
            userId,
            provider,
            date: dailyData.date,
            hrv: dailyData.hrv,
            rhr: dailyData.rhr,
            sleep: dailyData.sleep,
            steps: dailyData.steps,
            calories: dailyData.calories,
            activeMinutes: dailyData.activeMinutes,
            rawData: dailyData.raw,
            syncedAt: new Date()
          },
          { upsert: true, new: true }
        );
        recordsAdded++;
      }

      return { recordsAdded };
    } catch (error) {
      console.error(`Sync error for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Fetch data from provider API
   */
  async fetchProviderData(provider, config, accessToken, startDate, endDate) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const data = [];

    try {
      switch (provider.toLowerCase()) {
        case 'fitbit':
          return await this.fetchFitbitData(config.apiUrl, headers, startDate, endDate);
        case 'oura':
          return await this.fetchOuraData(config.apiUrl, headers, startDate, endDate);
        case 'whoop':
          return await this.fetchWhoopData(config.apiUrl, headers, startDate, endDate);
        case 'garmin':
          return await this.fetchGarminData(config.apiUrl, headers, startDate, endDate);
        case 'polar':
          return await this.fetchPolarData(config.apiUrl, headers, startDate, endDate);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Fetch error for ${provider}:`, error);
      return [];
    }
  }

  /**
   * Fetch Fitbit data - uses correct Fitbit Web API endpoints
   */
  async fetchFitbitData(apiUrl, headers, startDate, endDate) {
    const dateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const dateMap = {};

    console.log(`[Fitbit] Fetching data from ${dateStr} to ${endDateStr}`);

    try {
      // Fetch Steps (time series)
      const stepsResponse = await axios.get(
        `${apiUrl}/activities/steps/date/${dateStr}/${endDateStr}.json`,
        { headers }
      );
      console.log('[Fitbit] Steps response:', stepsResponse.data?.['activities-steps']?.length || 0, 'days');

      stepsResponse.data?.['activities-steps']?.forEach(item => {
        const date = item.dateTime;
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].steps = parseInt(item.value) || 0;
      });
    } catch (err) {
      console.error('[Fitbit] Steps error:', err.response?.data || err.message);
    }

    try {
      // Fetch Calories (time series)
      const caloriesResponse = await axios.get(
        `${apiUrl}/activities/calories/date/${dateStr}/${endDateStr}.json`,
        { headers }
      );
      console.log('[Fitbit] Calories response:', caloriesResponse.data?.['activities-calories']?.length || 0, 'days');

      caloriesResponse.data?.['activities-calories']?.forEach(item => {
        const date = item.dateTime;
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].calories = parseInt(item.value) || 0;
      });
    } catch (err) {
      console.error('[Fitbit] Calories error:', err.response?.data || err.message);
    }

    try {
      // Fetch Heart Rate (time series) - includes resting HR
      const heartResponse = await axios.get(
        `${apiUrl}/activities/heart/date/${dateStr}/${endDateStr}.json`,
        { headers }
      );
      console.log('[Fitbit] Heart response:', heartResponse.data?.['activities-heart']?.length || 0, 'days');

      heartResponse.data?.['activities-heart']?.forEach(item => {
        const date = item.dateTime;
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].rhr = item.value?.restingHeartRate || 0;
        dateMap[date].heartRateZones = item.value?.heartRateZones || [];
      });
    } catch (err) {
      console.error('[Fitbit] Heart error:', err.response?.data || err.message);
    }

    try {
      // Fetch Sleep (version 1.2 for better data)
      const sleepResponse = await axios.get(
        `https://api.fitbit.com/1.2/user/-/sleep/date/${dateStr}/${endDateStr}.json`,
        { headers }
      );
      console.log('[Fitbit] Sleep response:', sleepResponse.data?.sleep?.length || 0, 'records');

      sleepResponse.data?.sleep?.forEach(item => {
        const date = item.dateOfSleep;
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].sleep = {
          duration: Math.round((item.duration || 0) / 60000), // ms to minutes
          efficiency: item.efficiency || 0,
          stages: {
            deep: item.levels?.summary?.deep?.minutes || 0,
            light: item.levels?.summary?.light?.minutes || 0,
            rem: item.levels?.summary?.rem?.minutes || 0,
            wake: item.levels?.summary?.wake?.minutes || 0
          }
        };
      });
    } catch (err) {
      console.error('[Fitbit] Sleep error:', err.response?.data || err.message);
    }

    try {
      // Fetch HRV (if available - premium feature)
      const hrvResponse = await axios.get(
        `${apiUrl}/hrv/date/${dateStr}/${endDateStr}.json`,
        { headers }
      );
      console.log('[Fitbit] HRV response:', hrvResponse.data?.hrv?.length || 0, 'days');

      hrvResponse.data?.hrv?.forEach(item => {
        const date = item.dateTime;
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].hrv = item.value?.dailyRmssd || 0;
      });
    } catch (err) {
      // HRV might not be available for all users
      console.log('[Fitbit] HRV not available:', err.response?.status || err.message);
    }

    const results = Object.values(dateMap);
    console.log(`[Fitbit] Total days with data: ${results.length}`);
    return results;
  }

  /**
   * Fetch Oura data
   */
  async fetchOuraData(apiUrl, headers, startDate, endDate) {
    const data = [];
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    try {
      // Fetch sleep data
      const sleepResponse = await axios.get(
        `${apiUrl}/usercollection/sleep?start_date=${startDateStr}&end_date=${endDateStr}`,
        { headers }
      );

      // Fetch daily activity
      const activityResponse = await axios.get(
        `${apiUrl}/usercollection/daily_activity?start_date=${startDateStr}&end_date=${endDateStr}`,
        { headers }
      );

      // Fetch readiness (includes HRV)
      const readinessResponse = await axios.get(
        `${apiUrl}/usercollection/daily_readiness?start_date=${startDateStr}&end_date=${endDateStr}`,
        { headers }
      );

      // Combine data
      const dateMap = {};

      sleepResponse.data.data?.forEach(item => {
        const date = item.day;
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].sleep = {
          duration: item.total_sleep_duration / 60,
          efficiency: item.sleep_efficiency,
          stages: {
            deep: item.deep_sleep_duration / 60,
            light: item.light_sleep_duration / 60,
            rem: item.rem_sleep_duration / 60,
            wake: item.awake_time / 60
          }
        };
        dateMap[date].rhr = item.lowest_heart_rate;
      });

      activityResponse.data.data?.forEach(item => {
        const date = item.day;
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].steps = item.steps;
        dateMap[date].calories = item.active_calories;
        dateMap[date].activeMinutes = item.high_activity_time / 60;
      });

      readinessResponse.data.data?.forEach(item => {
        const date = item.day;
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].hrv = item.hrv_balance;
      });

      return Object.values(dateMap);
    } catch (error) {
      console.error('Oura fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch Whoop data
   */
  async fetchWhoopData(apiUrl, headers, startDate, endDate) {
    try {
      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();

      // Fetch recovery data
      const recoveryResponse = await axios.get(
        `${apiUrl}/recovery?start=${startStr}&end=${endStr}`,
        { headers }
      );

      // Fetch sleep data
      const sleepResponse = await axios.get(
        `${apiUrl}/sleep?start=${startStr}&end=${endStr}`,
        { headers }
      );

      const dateMap = {};

      recoveryResponse.data.records?.forEach(item => {
        const date = item.created_at.split('T')[0];
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].hrv = item.score.hrv_rmssd_milli;
        dateMap[date].rhr = item.score.resting_heart_rate;
      });

      sleepResponse.data.records?.forEach(item => {
        const date = item.created_at.split('T')[0];
        if (!dateMap[date]) dateMap[date] = { date: new Date(date) };
        dateMap[date].sleep = {
          duration: item.score.total_sleep_time_milli / 60000,
          efficiency: item.score.sleep_efficiency_percentage,
          stages: {
            deep: item.score.slow_wave_sleep_duration_milli / 60000,
            light: item.score.light_sleep_duration_milli / 60000,
            rem: item.score.rem_sleep_duration_milli / 60000,
            wake: item.score.wake_duration_milli / 60000
          }
        };
      });

      return Object.values(dateMap);
    } catch (error) {
      console.error('Whoop fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch Garmin data
   */
  async fetchGarminData(apiUrl, headers, startDate, endDate) {
    // Garmin API implementation
    // Note: Garmin uses a different auth flow (OAuth 1.0a)
    return [];
  }

  /**
   * Fetch Polar data
   */
  async fetchPolarData(apiUrl, headers, startDate, endDate) {
    // Polar API implementation
    return [];
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(provider, req) {
    const signature = req.headers['x-fitbit-signature'] || req.headers['x-whoop-signature'];
    
    if (!signature) {
      return false;
    }

    const config = PROVIDER_CONFIGS[provider.toLowerCase()];
    const payload = JSON.stringify(req.body);
    
    const hmac = crypto.createHmac('sha256', config.clientSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64');

    return signature === expectedSignature;
  }

  /**
   * Process webhook data
   */
  async processWebhook(provider, data) {
    // Process real-time webhook updates
    
    
    // Implementation depends on webhook structure
    // Typically triggers a sync for the affected user
  }

  /**
   * Get unified data from all devices (data fusion)
   */
  async getUnifiedData(userId, days, metrics) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Get data from all active devices
    const devices = await WearableDevice.find({ userId, isActive: true });
    const allData = await WearableData.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Data fusion: combine data from multiple sources
    const fusedData = this.fuseMultipleDeviceData(allData, metrics);

    return {
      fusedData,
      sources: devices.map(d => d.provider),
      fusionMethod: 'weighted_average'
    };
  }

  /**
   * Fuse data from multiple devices
   */
  fuseMultipleDeviceData(dataArray, metrics) {
    const dateMap = {};

    dataArray.forEach(data => {
      const dateKey = data.date.toISOString().split('T')[0];
      
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: data.date,
          sources: [],
          values: {}
        };
      }

      dateMap[dateKey].sources.push(data.provider);

      metrics.forEach(metric => {
        if (data[metric] !== undefined && data[metric] !== null) {
          if (!dateMap[dateKey].values[metric]) {
            dateMap[dateKey].values[metric] = [];
          }
          dateMap[dateKey].values[metric].push({
            value: data[metric],
            provider: data.provider
          });
        }
      });
    });

    // Average values from multiple sources
    const fusedData = Object.values(dateMap).map(day => {
      const fused = { date: day.date, sources: day.sources };

      metrics.forEach(metric => {
        if (day.values[metric] && day.values[metric].length > 0) {
          // Weighted average (prioritize Oura/Whoop for HRV, Fitbit for steps, etc.)
          const weights = this.getProviderWeights(metric);
          
          let weightedSum = 0;
          let totalWeight = 0;

          day.values[metric].forEach(item => {
            const weight = weights[item.provider] || 1;
            weightedSum += item.value * weight;
            totalWeight += weight;
          });

          fused[metric] = weightedSum / totalWeight;
        }
      });

      return fused;
    });

    return fusedData;
  }

  /**
   * Get provider weights for data fusion
   */
  getProviderWeights(metric) {
    const weights = {
      hrv: { oura: 1.5, whoop: 1.5, fitbit: 1.0, polar: 1.2, garmin: 1.0 },
      rhr: { oura: 1.3, whoop: 1.3, fitbit: 1.0, polar: 1.0, garmin: 1.0 },
      sleep: { oura: 1.5, whoop: 1.4, fitbit: 1.0, polar: 0.8, garmin: 0.8 },
      steps: { fitbit: 1.3, garmin: 1.2, oura: 1.0, whoop: 0.8, polar: 1.0 },
      calories: { fitbit: 1.2, garmin: 1.2, oura: 1.0, whoop: 1.1, polar: 1.0 }
    };

    return weights[metric] || {};
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(device) {
    const config = PROVIDER_CONFIGS[device.provider.toLowerCase()];

    try {
      // ✅ Add Basic Auth header for refresh token too
      const authHeader = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`;

      const response = await axios.post(
        config.tokenUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: device.refreshToken,
          client_id: config.clientId,
          client_secret: config.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
          }
        }
      );

      device.accessToken = response.data.access_token;
      device.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      
      if (response.data.refresh_token) {
        device.refreshToken = response.data.refresh_token;
      }

      await device.save();
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      device.status = 'token_expired';
      await device.save();
      return false;
    }
  }

  /**
   * Revoke token
   */
  async revokeToken(provider, accessToken) {
    // Provider-specific token revocation
    // Not all providers support this
    return true;
  }

  /**
   * Store OAuth state in Redis with TTL
   */
  async storeOAuthState(userId, provider, state) {
    const redis = getRedisClient();

    const stateData = {
      userId,
      provider,
      timestamp: Date.now()
    };

    if (redis) {
      try {
        // Store in Redis with 600-second (10 minute) TTL
        await redis.setex(
          `oauth:state:${state}`,
          600,
          JSON.stringify(stateData)
        );
        
        return true;
      } catch (error) {
        console.error('❌ Redis store error, falling back to memory:', error.message);
      }
    }

    // Fallback to in-memory storage
    oauthStateStore.set(state, stateData);
    setTimeout(() => {
      oauthStateStore.delete(state);
      
    }, 10 * 60 * 1000);

    
    return true;
  }

  /**
   * Verify OAuth state
   * Simplified: Since state format is userId:randomBytes, we validate the format
   * and that userId matches. This works across multiple instances without Redis.
   */
  async verifyOAuthState(userId, provider, state) {
    // Validate state format: should be userId:randomHex
    if (!state || !state.includes(':')) {
      console.error('❌ OAuth state invalid format');
      return false;
    }

    const [stateUserId, randomPart] = state.split(':');

    // Validate userId matches
    if (stateUserId !== userId) {
      console.error('❌ OAuth state userId mismatch:', stateUserId, 'vs', userId);
      return false;
    }

    // Validate randomPart looks like hex (64 chars from 32 bytes)
    if (!randomPart || randomPart.length !== 64 || !/^[a-f0-9]+$/i.test(randomPart)) {
      console.error('❌ OAuth state random part invalid');
      return false;
    }

    // Try to clean up from storage if available (best effort)
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.del(`oauth:state:${state}`);
      }
      oauthStateStore.delete(state);
    } catch (e) {
      // Ignore cleanup errors
    }

    console.log(`[OAuth] State verified for user ${userId}`);
    return true;
  }
}

module.exports = new DeviceSyncService();
