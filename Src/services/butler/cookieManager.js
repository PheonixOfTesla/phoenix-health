/**
 * Phoenix Butler Cookie Manager
 *
 * Handles cookie export/import for Browserless.io sessions.
 * Enables session persistence across cloud browser instances.
 *
 * Features:
 * - Export all cookies from a browser page
 * - Import cookies into a new browser session
 * - Service-specific cookie filtering
 * - Cookie validation and cleanup
 */

const ButlerSession = require('../../models/ButlerSession');

// Service domain mappings
const SERVICE_DOMAINS = {
  doordash: ['.doordash.com', 'www.doordash.com', 'identity.doordash.com'],
  ubereats: ['.uber.com', 'www.ubereats.com', 'auth.uber.com'],
  uber: ['.uber.com', 'auth.uber.com', 'riders.uber.com', 'm.uber.com'],
  lyft: ['.lyft.com', 'www.lyft.com', 'account.lyft.com'],
  grubhub: ['.grubhub.com', 'www.grubhub.com'],
  postmates: ['.postmates.com', 'www.postmates.com'],
  instacart: ['.instacart.com', 'www.instacart.com'],
  opentable: ['.opentable.com', 'www.opentable.com'],
  resy: ['.resy.com', 'www.resy.com'],
  amazon: ['.amazon.com', 'www.amazon.com'],
  walmart: ['.walmart.com', 'www.walmart.com'],
  target: ['.target.com', 'www.target.com'],
  google: ['.google.com', 'accounts.google.com', 'myaccount.google.com'],
  facebook: ['.facebook.com', 'www.facebook.com'],
  twitter: ['.twitter.com', '.x.com', 'twitter.com', 'x.com'],
  instagram: ['.instagram.com', 'www.instagram.com'],
  linkedin: ['.linkedin.com', 'www.linkedin.com'],
  airbnb: ['.airbnb.com', 'www.airbnb.com'],
  booking: ['.booking.com', 'www.booking.com'],
  expedia: ['.expedia.com', 'www.expedia.com'],
  venmo: ['.venmo.com', 'venmo.com', 'account.venmo.com'],
  paypal: ['.paypal.com', 'www.paypal.com'],
  cashapp: ['.cash.app', 'cash.app']
};

// Login URLs for each service
const SERVICE_LOGIN_URLS = {
  doordash: 'https://www.doordash.com/accounts/login/',
  ubereats: 'https://www.ubereats.com/',
  uber: 'https://auth.uber.com/v2/',
  lyft: 'https://www.lyft.com/login',
  grubhub: 'https://www.grubhub.com/login',
  postmates: 'https://postmates.com/login',
  instacart: 'https://www.instacart.com/',
  opentable: 'https://www.opentable.com/my/profile',
  resy: 'https://resy.com/',
  amazon: 'https://www.amazon.com/ap/signin',
  walmart: 'https://www.walmart.com/account/login',
  target: 'https://www.target.com/account',
  google: 'https://accounts.google.com/',
  facebook: 'https://www.facebook.com/login',
  twitter: 'https://twitter.com/login',
  instagram: 'https://www.instagram.com/accounts/login/',
  linkedin: 'https://www.linkedin.com/login',
  airbnb: 'https://www.airbnb.com/login',
  booking: 'https://www.booking.com/signin.html',
  expedia: 'https://www.expedia.com/user/signin',
  venmo: 'https://account.venmo.com/sign-in',
  paypal: 'https://www.paypal.com/signin',
  cashapp: 'https://cash.app/login'
};

class CookieManager {
  constructor() {
    this.logger = {
      info: (...args) => console.log('[CookieManager]', ...args),
      warn: (...args) => console.warn('[CookieManager]', ...args),
      error: (...args) => console.error('[CookieManager]', ...args)
    };
  }

  /**
   * Get login URL for a service
   * @param {string} service - Service name
   * @returns {string} Login URL
   */
  getLoginUrl(service) {
    return SERVICE_LOGIN_URLS[service.toLowerCase()] || null;
  }

  /**
   * Get domains for a service
   * @param {string} service - Service name
   * @returns {Array} Array of domain strings
   */
  getServiceDomains(service) {
    return SERVICE_DOMAINS[service.toLowerCase()] || [];
  }

  /**
   * Export all cookies from a page
   * @param {Object} page - Puppeteer page instance
   * @returns {Array} Array of cookie objects
   */
  async exportCookies(page) {
    try {
      const cookies = await page.cookies();
      this.logger.info(`Exported ${cookies.length} cookies`);
      return cookies;
    } catch (error) {
      this.logger.error('Failed to export cookies:', error.message);
      return [];
    }
  }

  /**
   * Export cookies filtered by service
   * @param {Object} page - Puppeteer page instance
   * @param {string} service - Service name to filter by
   * @returns {Array} Filtered array of cookie objects
   */
  async exportServiceCookies(page, service) {
    try {
      const allCookies = await page.cookies();
      const domains = this.getServiceDomains(service);

      if (domains.length === 0) {
        // No domain filter, return all
        return allCookies;
      }

      const filtered = allCookies.filter(cookie => {
        return domains.some(domain => {
          if (domain.startsWith('.')) {
            return cookie.domain.endsWith(domain) || cookie.domain === domain.slice(1);
          }
          return cookie.domain === domain || cookie.domain === '.' + domain;
        });
      });

      this.logger.info(`Exported ${filtered.length}/${allCookies.length} cookies for ${service}`);
      return filtered;
    } catch (error) {
      this.logger.error('Failed to export service cookies:', error.message);
      return [];
    }
  }

  /**
   * Import cookies into a page
   * @param {Object} page - Puppeteer page instance
   * @param {Array} cookies - Array of cookie objects
   * @returns {boolean} Success status
   */
  async importCookies(page, cookies) {
    try {
      if (!cookies || cookies.length === 0) {
        this.logger.warn('No cookies to import');
        return false;
      }

      // Filter out expired cookies
      const now = Date.now() / 1000;
      const validCookies = cookies.filter(cookie => {
        if (cookie.expires && cookie.expires > 0 && cookie.expires < now) {
          return false; // Expired
        }
        return true;
      });

      if (validCookies.length === 0) {
        this.logger.warn('All cookies are expired');
        return false;
      }

      // Set cookies on the page
      await page.setCookie(...validCookies);
      this.logger.info(`Imported ${validCookies.length} cookies`);
      return true;
    } catch (error) {
      this.logger.error('Failed to import cookies:', error.message);
      return false;
    }
  }

  /**
   * Save session to database
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @param {Object} page - Puppeteer page instance
   * @param {Object} options - Additional options
   * @returns {Object} Saved session
   */
  async saveSession(userId, service, page, options = {}) {
    try {
      const cookies = await this.exportServiceCookies(page, service);

      if (cookies.length === 0) {
        throw new Error('No cookies to save');
      }

      const session = await ButlerSession.saveSession(userId, service, cookies, {
        userAgent: options.userAgent || await page.evaluate(() => navigator.userAgent),
        viewport: options.viewport || page.viewport(),
        loginUrl: this.getLoginUrl(service),
        ...options
      });

      this.logger.info(`Session saved for ${userId}/${service}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to save session for ${userId}/${service}:`, error.message);
      throw error;
    }
  }

  /**
   * Load session from database and import cookies
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @param {Object} page - Puppeteer page instance
   * @returns {Object|null} Session data or null if not found
   */
  async loadSession(userId, service, page) {
    try {
      const session = await ButlerSession.getSession(userId, service);

      if (!session) {
        this.logger.info(`No saved session for ${userId}/${service}`);
        return null;
      }

      // Set user agent if available
      if (session.userAgent) {
        await page.setUserAgent(session.userAgent);
      }

      // Set viewport if available
      if (session.viewport) {
        await page.setViewport(session.viewport);
      }

      // Import cookies
      const success = await this.importCookies(page, session.cookies);

      if (!success) {
        await ButlerSession.invalidateSession(userId, service, 'Failed to import cookies');
        return null;
      }

      this.logger.info(`Session loaded for ${userId}/${service} (${session.cookies.length} cookies)`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to load session for ${userId}/${service}:`, error.message);
      return null;
    }
  }

  /**
   * Check if user has a valid saved session
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @returns {boolean}
   */
  async hasSession(userId, service) {
    return await ButlerSession.hasValidSession(userId, service);
  }

  /**
   * Invalidate a session after failure
   * @param {string} userId - User ID
   * @param {string} service - Service name
   * @param {string} error - Error message
   */
  async invalidateSession(userId, service, error) {
    await ButlerSession.invalidateSession(userId, service, error);
  }

  /**
   * Delete a session
   * @param {string} userId - User ID
   * @param {string} service - Service name
   */
  async deleteSession(userId, service) {
    await ButlerSession.deleteSession(userId, service);
  }

  /**
   * Get all sessions for a user
   * @param {string} userId - User ID
   * @returns {Array} List of connected services
   */
  async getUserSessions(userId) {
    return await ButlerSession.getUserSessions(userId);
  }

  /**
   * Verify if session is still valid by checking for login indicators
   * @param {Object} page - Puppeteer page instance
   * @param {string} service - Service name
   * @returns {boolean} True if logged in
   */
  async verifySession(page, service) {
    try {
      const loginUrl = this.getLoginUrl(service);
      if (!loginUrl) {
        return true; // Can't verify, assume valid
      }

      const currentUrl = page.url();

      // Check if we're on a login page (indicates session expired)
      const loginIndicators = ['login', 'signin', 'sign-in', 'auth', 'account/login'];
      const isOnLoginPage = loginIndicators.some(indicator =>
        currentUrl.toLowerCase().includes(indicator)
      );

      if (isOnLoginPage) {
        this.logger.warn(`Session appears invalid for ${service} - on login page`);
        return false;
      }

      // Service-specific verification
      const verificationSelectors = {
        doordash: '[data-anchor-id="UserAccountButton"], [data-testid="AccountButton"]',
        ubereats: '[data-testid="user-account-button"], [data-testid="profile-menu"]',
        uber: '[data-testid="profile-button"], .profile-menu',
        amazon: '#nav-link-accountList', //, #nav-tools',
        google: '[data-email], .gb_d'
      };

      const selector = verificationSelectors[service.toLowerCase()];
      if (selector) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          this.logger.info(`Session verified for ${service}`);
          return true;
        } catch {
          this.logger.warn(`Session verification failed for ${service} - element not found`);
          return false;
        }
      }

      return true; // No selector defined, assume valid
    } catch (error) {
      this.logger.error(`Session verification error for ${service}:`, error.message);
      return false;
    }
  }
}

// Export singleton
const cookieManager = new CookieManager();

module.exports = {
  cookieManager,
  CookieManager,
  SERVICE_DOMAINS,
  SERVICE_LOGIN_URLS
};
