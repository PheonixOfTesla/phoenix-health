/**
 * Browserless.io Integration Service
 *
 * Provides hosted browser automation with live viewing capabilities.
 * Falls back to local Puppeteer when BROWSERLESS_TOKEN is not configured.
 *
 * Free tier: 6 hours/month
 * Dashboard: https://cloud.browserless.io/
 */

const puppeteer = require('puppeteer');
const { cookieManager, SERVICE_LOGIN_URLS } = require('./cookieManager');
const ButlerSession = require('../../models/ButlerSession');

// Simple logger (no external dependency)
const logger = {
  info: (...args) => console.log('[Browserless]', ...args),
  warn: (...args) => console.warn('[Browserless]', ...args),
  error: (...args) => console.error('[Browserless]', ...args),
  debug: (...args) => console.log('[Browserless:debug]', ...args)
};

class BrowserlessService {
  constructor() {
    this.token = process.env.BROWSERLESS_TOKEN;
    this.baseUrl = process.env.BROWSERLESS_URL || 'chrome.browserless.io';
    this.useBrowserless = !!this.token;
    this.activeSessions = new Map();

    if (this.useBrowserless) {
      logger.info('Browserless.io integration enabled');
    } else {
      logger.info('Running with local Puppeteer (BROWSERLESS_TOKEN not set)');
    }
  }

  /**
   * Connect to a browser instance
   * Uses Browserless.io if token is available, otherwise local Puppeteer
   *
   * @param {Object} options - Browser launch options
   * @returns {Promise<Object>} Browser instance and session info
   */
  async connect(options = {}) {
    try {
      if (this.useBrowserless) {
        return await this._connectBrowserless(options);
      } else {
        return await this._connectLocal(options);
      }
    } catch (error) {
      logger.error('Failed to connect to browser:', error);

      // Fallback to local if Browserless fails
      if (this.useBrowserless) {
        logger.warn('Falling back to local Puppeteer');
        return await this._connectLocal(options);
      }

      throw error;
    }
  }

  /**
   * Connect to Browserless.io hosted browser
   *
   * @param {Object} options - Browser options
   * @returns {Promise<Object>} Browser instance and session info
   */
  async _connectBrowserless(options = {}) {
    const queryParams = new URLSearchParams({
      token: this.token,
      ...(options.blockAds && { blockAds: 'true' }),
      ...(options.stealth && { stealth: 'true' }),
      ...(options.timeout && { timeout: options.timeout }),
    });

    const wsEndpoint = `wss://${this.baseUrl}?${queryParams.toString()}`;

    logger.info('Connecting to Browserless.io...');

    const browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: options.viewport || { width: 1920, height: 1080 },
    });

    // Extract session ID from the WebSocket endpoint
    const sessionId = this._extractSessionId(browser);

    const sessionInfo = {
      browser,
      sessionId,
      isRemote: true,
      liveViewUrl: this.getLiveViewUrl(sessionId),
      createdAt: new Date(),
    };

    this.activeSessions.set(sessionId, sessionInfo);

    logger.info(`Browserless session created: ${sessionId}`);
    logger.info(`Live view: ${sessionInfo.liveViewUrl}`);

    return sessionInfo;
  }

  /**
   * Connect to local Puppeteer instance
   *
   * @param {Object} options - Browser launch options
   * @returns {Promise<Object>} Browser instance and session info
   */
  async _connectLocal(options = {}) {
    logger.info('Launching local Puppeteer browser...');

    const browser = await puppeteer.launch({
      headless: options.headless !== false ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        ...(options.args || []),
      ],
      defaultViewport: options.viewport || { width: 1920, height: 1080 },
    });

    const sessionId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const sessionInfo = {
      browser,
      sessionId,
      isRemote: false,
      liveViewUrl: null,
      createdAt: new Date(),
    };

    this.activeSessions.set(sessionId, sessionInfo);

    logger.info(`Local browser session created: ${sessionId}`);

    return sessionInfo;
  }

  /**
   * Get the live view URL for a Browserless session
   * Users can watch the browser automation in real-time
   *
   * @param {string} sessionId - Browserless session ID
   * @returns {string|null} Live view URL or null if not available
   */
  getLiveViewUrl(sessionId) {
    if (!this.useBrowserless || !sessionId) {
      return null;
    }

    // Browserless dashboard live view URL
    return `https://cloud.browserless.io/sessions/${sessionId}`;
  }

  /**
   * Extract session ID from browser WebSocket endpoint
   *
   * @param {Object} browser - Puppeteer browser instance
   * @returns {string} Session ID
   */
  _extractSessionId(browser) {
    try {
      const wsEndpoint = browser.wsEndpoint();
      // Extract session ID from WebSocket URL
      // Format: wss://chrome.browserless.io/devtools/browser/SESSION_ID
      const match = wsEndpoint.match(/\/devtools\/browser\/([^?]+)/);
      return match ? match[1] : `unknown-${Date.now()}`;
    } catch (error) {
      logger.warn('Could not extract session ID:', error.message);
      return `session-${Date.now()}`;
    }
  }

  /**
   * Get session information
   *
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session info or null if not found
   */
  getSession(sessionId) {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   *
   * @returns {Array<Object>} Array of active session info
   */
  getAllSessions() {
    return Array.from(this.activeSessions.values()).map(session => ({
      sessionId: session.sessionId,
      isRemote: session.isRemote,
      liveViewUrl: session.liveViewUrl,
      createdAt: session.createdAt,
      uptime: Date.now() - session.createdAt.getTime(),
    }));
  }

  /**
   * Close a specific browser session
   *
   * @param {string} sessionId - Session ID to close
   * @returns {Promise<boolean>} True if session was closed
   */
  async closeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return false;
    }

    try {
      await session.browser.close();
      this.activeSessions.delete(sessionId);
      logger.info(`Session closed: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`Error closing session ${sessionId}:`, error);
      this.activeSessions.delete(sessionId);
      return false;
    }
  }

  /**
   * Close all active browser sessions
   *
   * @returns {Promise<number>} Number of sessions closed
   */
  async closeAllSessions() {
    const sessionIds = Array.from(this.activeSessions.keys());
    let closedCount = 0;

    for (const sessionId of sessionIds) {
      const closed = await this.closeSession(sessionId);
      if (closed) closedCount++;
    }

    logger.info(`Closed ${closedCount} sessions`);
    return closedCount;
  }

  /**
   * Create a new page in an existing session
   *
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} New page instance
   */
  async createPage(sessionId) {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const page = await session.browser.newPage();
    logger.debug(`New page created in session: ${sessionId}`);

    return page;
  }

  /**
   * Execute a function in a browser context
   * Automatically handles session creation and cleanup
   *
   * @param {Function} fn - Async function that receives (browser, sessionInfo)
   * @param {Object} options - Browser options
   * @returns {Promise<any>} Result from the function
   */
  async execute(fn, options = {}) {
    let sessionInfo = null;

    try {
      sessionInfo = await this.connect(options);
      const result = await fn(sessionInfo.browser, sessionInfo);
      return result;
    } finally {
      if (sessionInfo && options.autoClose !== false) {
        await this.closeSession(sessionInfo.sessionId);
      }
    }
  }

  /**
   * Check Browserless account status
   *
   * @returns {Promise<Object>} Account usage information
   */
  async getAccountStatus() {
    if (!this.useBrowserless) {
      return {
        enabled: false,
        message: 'BROWSERLESS_TOKEN not configured',
      };
    }

    try {
      // Browserless provides usage stats via API
      const response = await fetch(`https://${this.baseUrl}/stats?token=${this.token}`);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const stats = await response.json();

      return {
        enabled: true,
        stats,
        message: 'Browserless.io connected',
      };
    } catch (error) {
      logger.error('Error checking Browserless status:', error);
      return {
        enabled: true,
        error: error.message,
        message: 'Status check failed',
      };
    }
  }

  /**
   * Health check for the service
   *
   * @returns {Object} Service health status
   */
  getHealthStatus() {
    return {
      service: 'browserless',
      enabled: this.useBrowserless,
      mode: this.useBrowserless ? 'remote' : 'local',
      activeSessions: this.activeSessions.size,
      sessions: this.getAllSessions(),
    };
  }

  // ================================================================
  // SESSION-AWARE METHODS (Cookie-based auth for returning users)
  // ================================================================

  /**
   * Connect with saved session cookies (bypass CAPTCHA)
   *
   * @param {string} userId - User ID
   * @param {string} service - Service name (doordash, uber, etc.)
   * @param {Object} options - Browser options
   * @returns {Promise<Object>} { browser, page, sessionInfo, hasSession }
   */
  async connectWithSession(userId, service, options = {}) {
    try {
      // Connect to browser
      const sessionInfo = await this.connect({ stealth: true, ...options });
      const page = await sessionInfo.browser.newPage();

      // Check if user has saved session
      const hasSession = await cookieManager.hasSession(userId, service);

      if (hasSession) {
        // Load saved cookies
        const savedSession = await cookieManager.loadSession(userId, service, page);

        if (savedSession) {
          logger.info(`Loaded saved session for ${userId}/${service}`);

          // Navigate to the service to validate session
          const loginUrl = SERVICE_LOGIN_URLS[service.toLowerCase()];
          if (loginUrl) {
            const baseUrl = new URL(loginUrl).origin;
            await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // Verify session is still valid
            const isValid = await cookieManager.verifySession(page, service);

            if (!isValid) {
              logger.warn(`Saved session invalid for ${userId}/${service}, needs re-login`);
              await cookieManager.invalidateSession(userId, service, 'Session expired');
              return { browser: sessionInfo.browser, page, sessionInfo, hasSession: false, needsLogin: true };
            }

            logger.info(`Session verified for ${userId}/${service} - bypassing CAPTCHA`);
          }

          return { browser: sessionInfo.browser, page, sessionInfo, hasSession: true, needsLogin: false };
        }
      }

      logger.info(`No saved session for ${userId}/${service}`);
      return { browser: sessionInfo.browser, page, sessionInfo, hasSession: false, needsLogin: true };

    } catch (error) {
      logger.error(`Failed to connect with session for ${userId}/${service}:`, error);
      throw error;
    }
  }

  /**
   * Save current session cookies to database
   *
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<Object>} Saved session
   */
  async saveSession(userId, service, page) {
    try {
      const session = await cookieManager.saveSession(userId, service, page);
      logger.info(`Session saved for ${userId}/${service}`);
      return session;
    } catch (error) {
      logger.error(`Failed to save session for ${userId}/${service}:`, error);
      throw error;
    }
  }

  /**
   * Execute automation with session support
   * Automatically loads cookies if available, bypassing CAPTCHA
   *
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @param {Function} fn - Async function (page, sessionInfo, hasSession) => result
   * @param {Object} options - Browser options
   * @returns {Promise<Object>} { result, sessionInfo, hadSession }
   */
  async executeWithSession(userId, service, fn, options = {}) {
    let sessionInfo = null;
    let page = null;

    try {
      const connection = await this.connectWithSession(userId, service, options);
      sessionInfo = connection.sessionInfo;
      page = connection.page;

      // If no session and login required, return early with login prompt
      if (connection.needsLogin && options.requireSession) {
        return {
          success: false,
          needsLogin: true,
          service,
          loginUrl: SERVICE_LOGIN_URLS[service.toLowerCase()],
          liveViewUrl: sessionInfo.liveViewUrl,
          sessionId: sessionInfo.sessionId,
          message: `Please login to ${service} first via the live view URL`
        };
      }

      // Execute the automation function
      const result = await fn(page, sessionInfo, connection.hasSession);

      // If automation successful and we have new cookies, save them
      if (result && result.saveSession !== false) {
        try {
          await this.saveSession(userId, service, page);
        } catch (saveError) {
          logger.warn(`Failed to save session after automation:`, saveError.message);
        }
      }

      return {
        success: true,
        result,
        hadSession: connection.hasSession,
        sessionInfo
      };

    } catch (error) {
      logger.error(`executeWithSession failed for ${userId}/${service}:`, error);

      // Invalidate session if it failed
      if (sessionInfo) {
        await cookieManager.invalidateSession(userId, service, error.message);
      }

      throw error;
    } finally {
      if (sessionInfo && options.autoClose !== false) {
        await this.closeSession(sessionInfo.sessionId);
      }
    }
  }

  /**
   * Start a login session for user to authenticate via live view
   *
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @param {Object} options - Options including timeout
   * @returns {Promise<Object>} { sessionId, liveViewUrl, loginUrl }
   */
  async startLoginSession(userId, service, options = {}) {
    try {
      const loginUrl = SERVICE_LOGIN_URLS[service.toLowerCase()];
      if (!loginUrl) {
        throw new Error(`Unknown service: ${service}`);
      }

      // Connect to Browserless
      const sessionInfo = await this.connect({ stealth: true, ...options });
      const page = await sessionInfo.browser.newPage();

      // Navigate to login page
      await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      logger.info(`Login session started for ${userId}/${service}`);
      logger.info(`Live view: ${sessionInfo.liveViewUrl}`);

      // Store session info for later retrieval
      this.activeSessions.set(sessionInfo.sessionId, {
        ...sessionInfo,
        userId,
        service,
        page,
        isLoginSession: true,
        startedAt: new Date()
      });

      return {
        success: true,
        sessionId: sessionInfo.sessionId,
        liveViewUrl: sessionInfo.liveViewUrl,
        loginUrl,
        service,
        message: `Open the live view URL to login to ${service}. Your session will be saved automatically.`,
        expiresIn: options.timeout || 600000 // 10 minutes default
      };

    } catch (error) {
      logger.error(`Failed to start login session for ${userId}/${service}:`, error);
      throw error;
    }
  }

  /**
   * Complete login session and save cookies
   * Called after user has logged in via live view
   *
   * @param {string} sessionId - Browser session ID
   * @returns {Promise<Object>} Result with saved session info
   */
  async completeLoginSession(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);

      if (!session || !session.isLoginSession) {
        throw new Error('Login session not found or expired');
      }

      const { userId, service, page } = session;

      // Verify user actually logged in
      const isLoggedIn = await cookieManager.verifySession(page, service);

      if (!isLoggedIn) {
        return {
          success: false,
          message: 'Login not detected. Please complete the login process and try again.',
          sessionId,
          liveViewUrl: session.liveViewUrl
        };
      }

      // Save cookies
      const savedSession = await this.saveSession(userId, service, page);

      // Close the browser
      await this.closeSession(sessionId);

      logger.info(`Login session completed for ${userId}/${service}`);

      return {
        success: true,
        message: `Successfully logged in to ${service}. Future automations will bypass CAPTCHA.`,
        service,
        connectedAt: savedSession.createdAt
      };

    } catch (error) {
      logger.error(`Failed to complete login session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get all connected services for a user
   *
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of connected services
   */
  async getUserConnectedServices(userId) {
    return await cookieManager.getUserSessions(userId);
  }

  /**
   * Disconnect a service (delete saved session)
   *
   * @param {string} userId - User ID
   * @param {string} service - Service name
   */
  async disconnectService(userId, service) {
    await cookieManager.deleteSession(userId, service);
    logger.info(`Disconnected ${service} for user ${userId}`);
  }
}

// Export singleton instance
const browserlessService = new BrowserlessService();

module.exports = {
  browserlessService,

  // Export methods for easy access
  connect: (options) => browserlessService.connect(options),
  execute: (fn, options) => browserlessService.execute(fn, options),
  getLiveViewUrl: (sessionId) => browserlessService.getLiveViewUrl(sessionId),
  getSession: (sessionId) => browserlessService.getSession(sessionId),
  getAllSessions: () => browserlessService.getAllSessions(),
  closeSession: (sessionId) => browserlessService.closeSession(sessionId),
  closeAllSessions: () => browserlessService.closeAllSessions(),
  createPage: (sessionId) => browserlessService.createPage(sessionId),
  getAccountStatus: () => browserlessService.getAccountStatus(),
  getHealthStatus: () => browserlessService.getHealthStatus(),

  // Session-aware methods (cookie-based auth)
  connectWithSession: (userId, service, options) => browserlessService.connectWithSession(userId, service, options),
  saveSession: (userId, service, page) => browserlessService.saveSession(userId, service, page),
  executeWithSession: (userId, service, fn, options) => browserlessService.executeWithSession(userId, service, fn, options),
  startLoginSession: (userId, service, options) => browserlessService.startLoginSession(userId, service, options),
  completeLoginSession: (sessionId) => browserlessService.completeLoginSession(sessionId),
  getUserConnectedServices: (userId) => browserlessService.getUserConnectedServices(userId),
  disconnectService: (userId, service) => browserlessService.disconnectService(userId, service),
};
