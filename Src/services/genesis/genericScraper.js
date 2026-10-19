/**
 * GENERIC WEB SCRAPER - Automate ANY Website
 *
 * Unlike puppeteerButler.js (locked to 5 sites), this works on ANY URL.
 * Phoenix can now interact with the entire internet.
 *
 * Capabilities:
 * - Navigate to any URL
 * - Click any element
 * - Fill any form
 * - Extract any data
 * - Take screenshots
 * - Handle authentication
 * - Execute custom scripts
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth to avoid detection
puppeteer.use(StealthPlugin());

class GenericScraper {
  constructor() {
    this.browser = null;
    this.activeSessions = new Map();
    this.maxConcurrentSessions = 5;
  }

  /**
   * Launch browser instance
   */
  async launchBrowser() {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
      console.log('[SCRAPER] Browser launched');
    }
    return this.browser;
  }

  /**
   * Create a new scraping session
   */
  async createSession(sessionId = null) {
    const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (this.activeSessions.size >= this.maxConcurrentSessions) {
      throw new Error(`Max concurrent sessions (${this.maxConcurrentSessions}) reached`);
    }

    const browser = await this.launchBrowser();
    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Enable request interception for monitoring
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // Block unnecessary resources for speed
      const blockedTypes = ['image', 'stylesheet', 'font'];
      if (blockedTypes.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const session = {
      id,
      page,
      createdAt: new Date(),
      history: []
    };

    this.activeSessions.set(id, session);
    console.log(`[SCRAPER] Session created: ${id}`);

    return { sessionId: id };
  }

  /**
   * Navigate to any URL
   */
  async navigate(sessionId, url, options = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const { waitUntil = 'networkidle2', timeout = 30000 } = options;

    try {
      console.log(`[SCRAPER] Navigating to: ${url}`);

      await session.page.goto(url, { waitUntil, timeout });

      const title = await session.page.title();
      const currentUrl = session.page.url();

      session.history.push({ action: 'navigate', url, timestamp: new Date() });

      return {
        success: true,
        url: currentUrl,
        title,
        sessionId
      };
    } catch (error) {
      console.error(`[SCRAPER] Navigation failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Click on any element
   */
  async click(sessionId, selector, options = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const { waitFor = true, delay = 100 } = options;

    try {
      if (waitFor) {
        await session.page.waitForSelector(selector, { timeout: 10000 });
      }

      await session.page.click(selector, { delay });

      session.history.push({ action: 'click', selector, timestamp: new Date() });

      return { success: true, action: 'click', selector };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Type text into any input
   */
  async type(sessionId, selector, text, options = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const { delay = 50, clear = false } = options;

    try {
      await session.page.waitForSelector(selector, { timeout: 10000 });

      if (clear) {
        await session.page.click(selector, { clickCount: 3 });
      }

      await session.page.type(selector, text, { delay });

      session.history.push({ action: 'type', selector, textLength: text.length, timestamp: new Date() });

      return { success: true, action: 'type', selector };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Fill a form with multiple fields
   */
  async fillForm(sessionId, fields) {
    const results = [];

    for (const field of fields) {
      const result = await this.type(sessionId, field.selector, field.value, field.options);
      results.push({ ...field, ...result });
    }

    return { success: results.every(r => r.success), fields: results };
  }

  /**
   * Extract data from page
   */
  async extract(sessionId, extractions) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const data = {};

    for (const extraction of extractions) {
      const { name, selector, attribute = 'textContent', multiple = false } = extraction;

      try {
        if (multiple) {
          data[name] = await session.page.$$eval(selector, (elements, attr) => {
            return elements.map(el => attr === 'textContent' ? el.textContent.trim() : el.getAttribute(attr));
          }, attribute);
        } else {
          data[name] = await session.page.$eval(selector, (el, attr) => {
            return attr === 'textContent' ? el.textContent.trim() : el.getAttribute(attr);
          }, attribute);
        }
      } catch (error) {
        data[name] = null;
      }
    }

    return { success: true, data };
  }

  /**
   * Get full page HTML
   */
  async getHTML(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const html = await session.page.content();
    return { success: true, html, length: html.length };
  }

  /**
   * Get page text content (no HTML)
   */
  async getText(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const text = await session.page.evaluate(() => document.body.innerText);
    return { success: true, text, length: text.length };
  }

  /**
   * Take screenshot
   */
  async screenshot(sessionId, options = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const { fullPage = false, encoding = 'base64' } = options;

    const screenshot = await session.page.screenshot({
      fullPage,
      encoding
    });

    return {
      success: true,
      screenshot,
      encoding,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute custom JavaScript on page
   */
  async evaluate(sessionId, script) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    try {
      const result = await session.page.evaluate(script);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Wait for element or condition
   */
  async wait(sessionId, options) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const { selector, timeout = 30000, visible = true } = options;

    try {
      if (selector) {
        await session.page.waitForSelector(selector, { timeout, visible });
      } else if (options.navigation) {
        await session.page.waitForNavigation({ timeout });
      } else if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle login/authentication
   */
  async login(sessionId, config) {
    const { url, usernameSelector, passwordSelector, username, password, submitSelector } = config;

    // Navigate to login page
    await this.navigate(sessionId, url);

    // Fill credentials
    await this.type(sessionId, usernameSelector, username);
    await this.type(sessionId, passwordSelector, password);

    // Submit
    await this.click(sessionId, submitSelector);

    // Wait for navigation
    await this.wait(sessionId, { navigation: true });

    const session = this.activeSessions.get(sessionId);
    const currentUrl = session.page.url();

    return {
      success: !currentUrl.includes('login'),
      url: currentUrl
    };
  }

  /**
   * Execute a sequence of actions
   */
  async executeSequence(sessionId, actions) {
    const results = [];

    for (const action of actions) {
      let result;

      switch (action.type) {
        case 'navigate':
          result = await this.navigate(sessionId, action.url, action.options);
          break;
        case 'click':
          result = await this.click(sessionId, action.selector, action.options);
          break;
        case 'type':
          result = await this.type(sessionId, action.selector, action.text, action.options);
          break;
        case 'wait':
          result = await this.wait(sessionId, action.options);
          break;
        case 'extract':
          result = await this.extract(sessionId, action.extractions);
          break;
        case 'screenshot':
          result = await this.screenshot(sessionId, action.options);
          break;
        case 'evaluate':
          result = await this.evaluate(sessionId, action.script);
          break;
        default:
          result = { success: false, error: `Unknown action type: ${action.type}` };
      }

      results.push({ action: action.type, ...result });

      // Stop on failure if specified
      if (!result.success && action.stopOnFailure) {
        break;
      }
    }

    return { success: results.every(r => r.success), results };
  }

  /**
   * Quick scrape - single URL, extract data
   */
  async quickScrape(url, extractions) {
    const { sessionId } = await this.createSession();

    try {
      await this.navigate(sessionId, url);
      const data = await this.extract(sessionId, extractions);
      await this.closeSession(sessionId);
      return data;
    } catch (error) {
      await this.closeSession(sessionId);
      return { success: false, error: error.message };
    }
  }

  /**
   * Close a session
   */
  async closeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      await session.page.close();
      this.activeSessions.delete(sessionId);
      console.log(`[SCRAPER] Session closed: ${sessionId}`);
    }
    return { success: true };
  }

  /**
   * Close all sessions and browser
   */
  async shutdown() {
    for (const [sessionId] of this.activeSessions) {
      await this.closeSession(sessionId);
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    console.log('[SCRAPER] Shutdown complete');
    return { success: true };
  }

  /**
   * Get active sessions
   */
  getSessions() {
    const sessions = [];
    for (const [id, session] of this.activeSessions) {
      sessions.push({
        id,
        createdAt: session.createdAt,
        historyLength: session.history.length
      });
    }
    return sessions;
  }
}

module.exports = new GenericScraper();
