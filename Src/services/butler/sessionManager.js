/**
 * Phoenix Butler Session Manager
 *
 * Unified browser session manager for ANY website.
 * User logs in once manually, Phoenix saves the session forever.
 *
 * Features:
 * - Per-user, per-service browser profiles with persistent cookies
 * - Stealth mode to avoid bot detection
 * - Automatic session validation and recovery
 * - Support for Google, Banking, Food Delivery, Ride-sharing services
 *
 * @module sessionManager
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

// Add stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// Constants
const BROWSER_PROFILES_DIR = path.join(__dirname, 'data', 'browser-profiles');
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

// Service-specific configuration
const SERVICE_CONFIG = {
  // Google services (gmail, drive, calendar share one session)
  google: {
    loginUrl: 'https://accounts.google.com',
    sessionCheckUrl: 'https://myaccount.google.com',
    sessionCheckSelector: '[data-email]',
    sharedServices: ['gmail', 'drive', 'calendar', 'youtube', 'photos'],
    viewport: { width: 1280, height: 800 }
  },

  // Banking (generic - works with most banks)
  banking: {
    loginUrl: null, // Set dynamically per bank
    sessionCheckUrl: null,
    sessionCheckSelector: '.account-balance, .accounts-summary, [data-testid="account"]',
    viewport: { width: 1366, height: 768 }
  },

  // Food delivery services
  doordash: {
    loginUrl: 'https://www.doordash.com/accounts/login',
    sessionCheckUrl: 'https://www.doordash.com/orders/',
    sessionCheckSelector: '[data-anchor-id="UserAccount"]',
    viewport: { width: 1280, height: 800 }
  },

  ubereats: {
    loginUrl: 'https://www.ubereats.com/login-redirect',
    sessionCheckUrl: 'https://www.ubereats.com/orders',
    sessionCheckSelector: '[data-testid="user-profile"]',
    viewport: { width: 1280, height: 800 }
  },

  // Ride-sharing services
  uber: {
    loginUrl: 'https://auth.uber.com/login',
    sessionCheckUrl: 'https://riders.uber.com',
    sessionCheckSelector: '[data-testid="profile-menu"]',
    viewport: { width: 1280, height: 800 }
  },

  lyft: {
    loginUrl: 'https://account.lyft.com/auth/login',
    sessionCheckUrl: 'https://www.lyft.com/rider',
    sessionCheckSelector: '[data-testid="user-menu"]',
    viewport: { width: 1280, height: 800 }
  }
};

/**
 * SessionManager - Singleton class for managing browser sessions
 */
class SessionManager extends EventEmitter {
  constructor() {
    super();

    if (SessionManager.instance) {
      return SessionManager.instance;
    }

    this.sessions = new Map(); // userId_service -> { browser, page, lastActivity }
    this.setupCleanupInterval();

    SessionManager.instance = this;
  }

  /**
   * Setup automatic cleanup of inactive sessions
   * @private
   */
  setupCleanupInterval() {
    setInterval(async () => {
      const now = Date.now();

      for (const [key, session] of this.sessions.entries()) {
        if (now - session.lastActivity > SESSION_TIMEOUT) {
          const [userId, service] = key.split('_');
          console.log(`[SessionManager] Cleaning up inactive session: ${userId}/${service}`);
          await this.closeSession(userId, service);
        }
      }
    }, SESSION_CHECK_INTERVAL);
  }

  /**
   * Get the profile directory for a user and service
   * @private
   */
  getProfilePath(userId, service) {
    return path.join(BROWSER_PROFILES_DIR, userId, service);
  }

  /**
   * Get session key for internal tracking
   * @private
   */
  getSessionKey(userId, service) {
    return `${userId}_${service}`;
  }

  /**
   * Ensure profile directory exists
   * @private
   */
  async ensureProfileDirectory(userId, service) {
    const profilePath = this.getProfilePath(userId, service);

    try {
      await fs.access(profilePath);
    } catch {
      await fs.mkdir(profilePath, { recursive: true });
      console.log(`[SessionManager] Created profile directory: ${profilePath}`);
    }

    return profilePath;
  }

  /**
   * Get service configuration
   * @private
   */
  getServiceConfig(service) {
    // Check if service is a Google service
    for (const [key, config] of Object.entries(SERVICE_CONFIG)) {
      if (config.sharedServices && config.sharedServices.includes(service)) {
        return { ...config, actualService: service, baseService: key };
      }
    }

    return SERVICE_CONFIG[service] || null;
  }

  /**
   * Launch browser with user profile
   * @private
   */
  async launchBrowser(userId, service, headless = false) {
    const profilePath = await this.ensureProfileDirectory(userId, service);
    const config = this.getServiceConfig(service);

    const launchOptions = {
      headless: headless ? 'new' : false,
      userDataDir: profilePath,
      defaultViewport: config?.viewport || { width: 1280, height: 800 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--lang=en-US,en',
      ]
    };

    // Use system Chromium in Docker
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    try {
      const browser = await puppeteer.launch(launchOptions);
      console.log(`[SessionManager] Browser launched for ${userId}/${service} (headless: ${headless})`);

      // Handle browser disconnect
      browser.on('disconnected', () => {
        console.log(`[SessionManager] Browser disconnected for ${userId}/${service}`);
        this.sessions.delete(this.getSessionKey(userId, service));
        this.emit('session:disconnected', { userId, service });
      });

      return browser;
    } catch (error) {
      console.error(`[SessionManager] Failed to launch browser for ${userId}/${service}:`, error);
      throw new Error(`Failed to launch browser: ${error.message}`);
    }
  }

  /**
   * Setup session for a user to login manually
   * Opens a visible browser window and waits for user to complete login
   *
   * @param {string} userId - User ID
   * @param {string} service - Service name (google, banking, doordash, etc.)
   * @param {string} [customLoginUrl] - Custom login URL (optional, overrides default)
   * @param {object} [options] - Additional options
   * @param {number} [options.timeout] - Max time to wait for login (default: 10 minutes)
   * @param {string} [options.successUrl] - URL pattern that indicates successful login
   * @returns {Promise<object>} Session info
   */
  async setupSession(userId, service, customLoginUrl = null, options = {}) {
    try {
      console.log(`[SessionManager] Setting up session for ${userId}/${service}`);

      const config = this.getServiceConfig(service);
      if (!config && !customLoginUrl) {
        throw new Error(`Unknown service: ${service}. Please provide a custom login URL.`);
      }

      // Use base service for shared sessions (e.g., google for gmail)
      const actualService = config?.baseService || service;
      const loginUrl = customLoginUrl || config.loginUrl;

      if (!loginUrl) {
        throw new Error(`No login URL configured for ${service}`);
      }

      // Close existing session if any
      await this.closeSession(userId, actualService);

      // Launch visible browser for user to login
      const browser = await this.launchBrowser(userId, actualService, false);
      const page = await browser.newPage();

      // Navigate to login page
      await page.goto(loginUrl, { waitUntil: 'networkidle2' });

      console.log(`[SessionManager] Browser opened for user login. Please complete the login process.`);
      this.emit('session:setup:started', { userId, service, loginUrl });

      // Wait for navigation that indicates login success
      const timeout = options.timeout || 10 * 60 * 1000; // 10 minutes default

      const loginSuccess = await new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          resolve(false);
        }, timeout);

        // Watch for navigation changes
        page.on('framenavigated', async (frame) => {
          if (frame === page.mainFrame()) {
            const url = page.url();

            // Check if we're no longer on login page
            if (!url.includes('login') && !url.includes('signin') && !url.includes('auth')) {
              clearTimeout(timeoutId);
              resolve(true);
            }

            // Check for custom success URL
            if (options.successUrl && url.includes(options.successUrl)) {
              clearTimeout(timeoutId);
              resolve(true);
            }
          }
        });
      });

      if (!loginSuccess) {
        await browser.close();
        throw new Error('Login timeout - user did not complete login in time');
      }

      // Verify session is valid
      const isValid = await this.checkSession(userId, actualService, browser, page);

      if (!isValid) {
        await browser.close();
        throw new Error('Login verification failed');
      }

      // Store session
      this.sessions.set(this.getSessionKey(userId, actualService), {
        browser,
        page,
        lastActivity: Date.now(),
        service: actualService
      });

      console.log(`[SessionManager] Session setup complete for ${userId}/${service}`);
      this.emit('session:setup:complete', { userId, service });

      return {
        success: true,
        userId,
        service: actualService,
        message: 'Session setup successful'
      };

    } catch (error) {
      console.error(`[SessionManager] Setup session failed for ${userId}/${service}:`, error);
      this.emit('session:setup:failed', { userId, service, error: error.message });
      throw error;
    }
  }

  /**
   * Get an active session or create a new one
   *
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @param {boolean} [headless=true] - Run in headless mode
   * @returns {Promise<object>} Browser and page objects
   */
  async getSession(userId, service, headless = true) {
    try {
      const config = this.getServiceConfig(service);
      const actualService = config?.baseService || service;
      const sessionKey = this.getSessionKey(userId, actualService);

      // Check if we have an active session
      const existingSession = this.sessions.get(sessionKey);

      if (existingSession) {
        // Verify browser is still connected
        if (existingSession.browser.isConnected()) {
          // Update last activity
          existingSession.lastActivity = Date.now();
          console.log(`[SessionManager] Reusing existing session for ${userId}/${service}`);

          return {
            browser: existingSession.browser,
            page: existingSession.page
          };
        } else {
          // Session expired, remove it
          this.sessions.delete(sessionKey);
        }
      }

      // Check if profile exists (user has logged in before)
      const profilePath = this.getProfilePath(userId, actualService);

      try {
        await fs.access(profilePath);
      } catch {
        throw new Error(`No saved session found for ${userId}/${service}. Please run setupSession first.`);
      }

      // Launch browser with saved profile
      const browser = await this.launchBrowser(userId, actualService, headless);
      const page = await browser.newPage();

      // Verify session is still valid
      const isValid = await this.checkSession(userId, actualService, browser, page);

      if (!isValid) {
        await browser.close();
        throw new Error(`Session expired for ${userId}/${service}. Please login again using setupSession.`);
      }

      // Store session
      this.sessions.set(sessionKey, {
        browser,
        page,
        lastActivity: Date.now(),
        service: actualService
      });

      console.log(`[SessionManager] New session created for ${userId}/${service}`);
      this.emit('session:created', { userId, service });

      return { browser, page };

    } catch (error) {
      console.error(`[SessionManager] Get session failed for ${userId}/${service}:`, error);
      throw error;
    }
  }

  /**
   * Check if a session is still valid
   *
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @param {object} [browser] - Existing browser instance (optional)
   * @param {object} [page] - Existing page instance (optional)
   * @returns {Promise<boolean>} True if session is valid
   */
  async checkSession(userId, service, browser = null, page = null) {
    let browserToClose = null;

    try {
      const config = this.getServiceConfig(service);
      const actualService = config?.baseService || service;

      if (!config) {
        console.warn(`[SessionManager] No config for ${service}, cannot verify session`);
        return false;
      }

      // Use provided browser/page or get from session
      let checkBrowser = browser;
      let checkPage = page;

      if (!checkBrowser || !checkPage) {
        const sessionKey = this.getSessionKey(userId, actualService);
        const session = this.sessions.get(sessionKey);

        if (!session) {
          // Try to launch browser with saved profile
          const profilePath = this.getProfilePath(userId, actualService);

          try {
            await fs.access(profilePath);
            checkBrowser = await this.launchBrowser(userId, actualService, true);
            checkPage = await checkBrowser.newPage();
            browserToClose = checkBrowser;
          } catch {
            return false;
          }
        } else {
          checkBrowser = session.browser;
          checkPage = session.page;
        }
      }

      // Navigate to session check URL
      if (config.sessionCheckUrl) {
        await checkPage.goto(config.sessionCheckUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait for session indicator element
        try {
          await checkPage.waitForSelector(config.sessionCheckSelector, { timeout: 5000 });
          console.log(`[SessionManager] Session valid for ${userId}/${service}`);
          return true;
        } catch {
          console.log(`[SessionManager] Session invalid for ${userId}/${service}`);
          return false;
        }
      }

      // If no check URL, assume valid if profile exists
      return true;

    } catch (error) {
      console.error(`[SessionManager] Session check failed for ${userId}/${service}:`, error);
      return false;
    } finally {
      // Close browser if we created it for checking
      if (browserToClose) {
        await browserToClose.close();
      }
    }
  }

  /**
   * Clear a saved session (removes browser profile)
   *
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @returns {Promise<object>} Result
   */
  async clearSession(userId, service) {
    try {
      const config = this.getServiceConfig(service);
      const actualService = config?.baseService || service;

      console.log(`[SessionManager] Clearing session for ${userId}/${service}`);

      // Close active session if any
      await this.closeSession(userId, actualService);

      // Remove profile directory
      const profilePath = this.getProfilePath(userId, actualService);

      try {
        await fs.access(profilePath);
        await fs.rm(profilePath, { recursive: true, force: true });
        console.log(`[SessionManager] Profile deleted: ${profilePath}`);
      } catch (error) {
        console.log(`[SessionManager] No profile found to delete: ${profilePath}`);
      }

      this.emit('session:cleared', { userId, service });

      return {
        success: true,
        userId,
        service: actualService,
        message: 'Session cleared successfully'
      };

    } catch (error) {
      console.error(`[SessionManager] Clear session failed for ${userId}/${service}:`, error);
      throw error;
    }
  }

  /**
   * Close active browser session (keeps profile)
   * @private
   */
  async closeSession(userId, service) {
    const sessionKey = this.getSessionKey(userId, service);
    const session = this.sessions.get(sessionKey);

    if (session) {
      try {
        if (session.browser.isConnected()) {
          await session.browser.close();
          console.log(`[SessionManager] Closed browser for ${userId}/${service}`);
        }
      } catch (error) {
        console.error(`[SessionManager] Error closing browser for ${userId}/${service}:`, error);
      }

      this.sessions.delete(sessionKey);
    }
  }

  /**
   * Helper: Setup Google session (gmail, drive, calendar, etc.)
   *
   * @param {string} userId - User ID
   * @returns {Promise<object>} Session info
   */
  async setupGoogleSession(userId) {
    return this.setupSession(userId, 'google');
  }

  /**
   * Helper: Get Google session
   *
   * @param {string} userId - User ID
   * @param {boolean} [headless=true] - Run in headless mode
   * @returns {Promise<object>} Browser and page
   */
  async getGoogleSession(userId, headless = true) {
    return this.getSession(userId, 'google', headless);
  }

  /**
   * Helper: Check Google session
   *
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if valid
   */
  async checkGoogleSession(userId) {
    return this.checkSession(userId, 'google');
  }

  /**
   * Helper: Clear Google session
   *
   * @param {string} userId - User ID
   * @returns {Promise<object>} Result
   */
  async clearGoogleSession(userId) {
    return this.clearSession(userId, 'google');
  }

  /**
   * Helper: Setup banking session
   *
   * @param {string} userId - User ID
   * @param {string} bankName - Bank name (for profile storage)
   * @param {string} loginUrl - Bank's login URL
   * @returns {Promise<object>} Session info
   */
  async setupBankingSession(userId, bankName, loginUrl) {
    const service = `banking_${bankName.toLowerCase().replace(/\s+/g, '_')}`;
    return this.setupSession(userId, service, loginUrl);
  }

  /**
   * Helper: Get banking session
   *
   * @param {string} userId - User ID
   * @param {string} bankName - Bank name
   * @param {boolean} [headless=true] - Run in headless mode
   * @returns {Promise<object>} Browser and page
   */
  async getBankingSession(userId, bankName, headless = true) {
    const service = `banking_${bankName.toLowerCase().replace(/\s+/g, '_')}`;
    return this.getSession(userId, service, headless);
  }

  /**
   * Helper: Setup food delivery session
   *
   * @param {string} userId - User ID
   * @param {string} platform - Platform name (doordash, ubereats)
   * @returns {Promise<object>} Session info
   */
  async setupFoodDeliverySession(userId, platform) {
    const service = platform.toLowerCase();

    if (!SERVICE_CONFIG[service]) {
      throw new Error(`Unknown food delivery platform: ${platform}`);
    }

    return this.setupSession(userId, service);
  }

  /**
   * Helper: Get food delivery session
   *
   * @param {string} userId - User ID
   * @param {string} platform - Platform name (doordash, ubereats)
   * @param {boolean} [headless=true] - Run in headless mode
   * @returns {Promise<object>} Browser and page
   */
  async getFoodDeliverySession(userId, platform, headless = true) {
    const service = platform.toLowerCase();
    return this.getSession(userId, service, headless);
  }

  /**
   * Helper: Setup ride-sharing session
   *
   * @param {string} userId - User ID
   * @param {string} platform - Platform name (uber, lyft)
   * @returns {Promise<object>} Session info
   */
  async setupRideSession(userId, platform) {
    const service = platform.toLowerCase();

    if (!SERVICE_CONFIG[service]) {
      throw new Error(`Unknown ride-sharing platform: ${platform}`);
    }

    return this.setupSession(userId, service);
  }

  /**
   * Helper: Get ride-sharing session
   *
   * @param {string} userId - User ID
   * @param {string} platform - Platform name (uber, lyft)
   * @param {boolean} [headless=true] - Run in headless mode
   * @returns {Promise<object>} Browser and page
   */
  async getRideSession(userId, platform, headless = true) {
    const service = platform.toLowerCase();
    return this.getSession(userId, service, headless);
  }

  /**
   * Get all active sessions
   *
   * @returns {Array<object>} List of active sessions
   */
  getActiveSessions() {
    const sessions = [];

    for (const [key, session] of this.sessions.entries()) {
      const [userId, service] = key.split('_');
      sessions.push({
        userId,
        service,
        lastActivity: new Date(session.lastActivity),
        isConnected: session.browser.isConnected()
      });
    }

    return sessions;
  }

  /**
   * Cleanup all sessions and shutdown
   */
  async shutdown() {
    console.log('[SessionManager] Shutting down...');

    const closePromises = [];

    for (const [key, session] of this.sessions.entries()) {
      if (session.browser.isConnected()) {
        closePromises.push(
          session.browser.close().catch(err =>
            console.error(`Error closing browser for ${key}:`, err)
          )
        );
      }
    }

    await Promise.all(closePromises);
    this.sessions.clear();

    console.log('[SessionManager] Shutdown complete');
  }
}

// Export singleton instance
module.exports = new SessionManager();
