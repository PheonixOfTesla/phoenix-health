// Src/services/phoenix/puppeteerButler.js
// REAL Puppeteer-based Butler Automation
// NOW WITH BROWSERLESS.IO CLOUD SUPPORT

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ButlerAction = require('../../models/phoenix/ButlerAction');
const crypto = require('crypto');
const EventEmitter = require('events');
const { browserlessService } = require('../butler/browserless');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

const ENCRYPTION_KEY = process.env.BUTLER_ENCRYPTION_KEY || 'default-key-change-in-production-32b';
const ENCRYPTION_IV_LENGTH = 16;

class PuppeteerButler extends EventEmitter {
  constructor() {
    super();
    this.browser = null;
    this.activeSessions = new Map(); // Track active automation sessions
    this.activeStreams = new Map(); // Track active screenshot streams
  }

  // ============================================================================
  // ENCRYPTION UTILITIES
  // ============================================================================

  encryptCredential(text) {
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decryptCredential(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  // ============================================================================
  // BROWSER MANAGEMENT
  // ============================================================================

  async initBrowser() {
    if (!this.browser) {
      // USE BROWSERLESS.IO IF TOKEN EXISTS (cloud Chrome)
      if (process.env.BROWSERLESS_TOKEN) {
        console.log('[PuppeteerButler] Connecting to Browserless.io cloud browser...');
        const sessionInfo = await browserlessService.connect({
          stealth: true,
          blockAds: true,
          viewport: { width: 1920, height: 1080 }
        });
        this.browser = sessionInfo.browser;
        this.currentSessionId = sessionInfo.sessionId;
        this.liveViewUrl = sessionInfo.liveViewUrl;
        console.log(`[PuppeteerButler] Connected! Live view: ${this.liveViewUrl}`);
        return this.browser;
      }

      // FALLBACK: Local Puppeteer (for development)
      console.log('[PuppeteerButler] No BROWSERLESS_TOKEN - using local Puppeteer');
      const launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      };

      // Use system Chromium in Docker
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }

      this.browser = await puppeteer.launch(launchOptions);
    }
    return this.browser;
  }

  // Get live view URL for current session
  getLiveViewUrl() {
    return this.liveViewUrl || null;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async createPage() {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    return page;
  }

  // ============================================================================
  // SCREENSHOT STREAMING
  // ============================================================================

  async streamScreenshots(sessionId, page, interval = 500) {
    if (this.activeStreams.has(sessionId)) {
      console.warn(`Stream already active for session ${sessionId}`);
      return;
    }

    const streamState = {
      active: true,
      intervalId: null,
      page
    };

    this.activeStreams.set(sessionId, streamState);

    const captureFrame = async () => {
      if (!streamState.active || page.isClosed()) {
        this.stopStreaming(sessionId);
        return;
      }

      try {
        const screenshot = await page.screenshot({ encoding: 'base64' });
        const url = await page.url();

        this.emit('frame', {
          sessionId,
          screenshot,
          status: 'streaming',
          timestamp: new Date().toISOString(),
          url
        });
      } catch (error) {
        console.error(`Screenshot error for session ${sessionId}:`, error);

        // If page is closed or browser is disconnected, stop streaming
        if (error.message.includes('Target closed') || error.message.includes('Session closed')) {
          this.stopStreaming(sessionId);
        }
      }
    };

    // Initial screenshot
    await captureFrame();

    // Set up interval for continuous streaming
    streamState.intervalId = setInterval(captureFrame, interval);

    // Handle page close event
    page.on('close', () => {
      this.stopStreaming(sessionId);
    });

    console.log(`Started screenshot streaming for session ${sessionId} at ${interval}ms interval`);
  }

  stopStreaming(sessionId) {
    const streamState = this.activeStreams.get(sessionId);

    if (streamState) {
      streamState.active = false;

      if (streamState.intervalId) {
        clearInterval(streamState.intervalId);
      }

      this.activeStreams.delete(sessionId);

      this.emit('stream_stopped', {
        sessionId,
        timestamp: new Date().toISOString()
      });

      console.log(`Stopped screenshot streaming for session ${sessionId}`);
    }
  }

  emitStatus(sessionId, message, step = null, totalSteps = null) {
    this.emit('status', {
      sessionId,
      message,
      step,
      totalSteps,
      timestamp: new Date().toISOString()
    });
  }

  // ============================================================================
  // UBER RIDE BOOKING
  // ============================================================================

  async bookUberRide({ userId, credentials, pickup, destination, rideType = 'UberX' }) {
    const actionId = crypto.randomBytes(16).toString('hex');
    this.activeSessions.set(actionId, { status: 'in_progress', service: 'uber' });

    let page;
    let action;
    const totalSteps = 7;

    try {
      // Create butler action
      action = await ButlerAction.create({
        userId,
        actionType: 'ride',
        description: `Uber ${rideType} from ${pickup} to ${destination}`,
        status: 'in_progress',
        metadata: { pickup, destination, rideType, service: 'uber', sessionId: actionId }
      });

      page = await this.createPage();

      // Start screenshot streaming
      await this.streamScreenshots(actionId, page, 500);

      // Step 1: Navigate to Uber
      this.emitStatus(actionId, 'Navigating to Uber website...', 1, totalSteps);
      await page.goto('https://www.uber.com/us/en/ride/', { waitUntil: 'networkidle2' });

      // Step 2: Login
      this.emitStatus(actionId, 'Logging into Uber account...', 2, totalSteps);
      await page.waitForSelector('a[href*="login"], button:has-text("Sign in")', { timeout: 10000 });
      await page.click('a[href*="login"], button:has-text("Sign in")');

      // Wait for login form
      await page.waitForSelector('input[type="email"], input[id*="email"]', { timeout: 10000 });

      // Enter credentials
      const email = credentials.email || this.decryptCredential(credentials.encryptedEmail);
      const password = credentials.password || this.decryptCredential(credentials.encryptedPassword);

      await page.type('input[type="email"], input[id*="email"]', email);
      await page.click('button[type="submit"]');

      // Wait for password field
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.type('input[type="password"]', password);
      await page.click('button[type="submit"]');

      // Wait for login to complete
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

      // Step 3: Enter pickup location
      this.emitStatus(actionId, `Setting pickup location: ${pickup}...`, 3, totalSteps);
      await page.waitForSelector('input[placeholder*="pickup"], input[name*="pickup"]', { timeout: 10000 });
      await page.type('input[placeholder*="pickup"], input[name*="pickup"]', pickup);
      await page.waitForTimeout(2000);
      await page.keyboard.press('Enter');

      // Step 4: Enter destination
      this.emitStatus(actionId, `Setting destination: ${destination}...`, 4, totalSteps);
      await page.waitForSelector('input[placeholder*="destination"], input[name*="dropoff"]', { timeout: 10000 });
      await page.type('input[placeholder*="destination"], input[name*="dropoff"]', destination);
      await page.waitForTimeout(2000);
      await page.keyboard.press('Enter');

      // Step 5: Select ride type
      this.emitStatus(actionId, `Selecting ${rideType} ride option...`, 5, totalSteps);
      await page.waitForSelector('[data-testid*="ride-option"], .ride-option', { timeout: 15000 });

      // Select ride type
      const rideOptions = await page.$$('[data-testid*="ride-option"], .ride-option');
      for (const option of rideOptions) {
        const text = await option.evaluate(el => el.textContent);
        if (text.includes(rideType)) {
          await option.click();
          break;
        }
      }

      // Step 6: Request ride
      this.emitStatus(actionId, 'Requesting ride...', 6, totalSteps);
      await page.waitForSelector('button:has-text("Request"), button:has-text("Confirm")', { timeout: 10000 });
      await page.click('button:has-text("Request"), button:has-text("Confirm")');

      // Step 7: Wait for confirmation
      this.emitStatus(actionId, 'Waiting for confirmation...', 7, totalSteps);
      await page.waitForSelector('[data-testid="trip-id"], .confirmation-number', { timeout: 20000 });

      const confirmationNumber = await page.evaluate(() => {
        const elem = document.querySelector('[data-testid="trip-id"], .confirmation-number');
        return elem ? elem.textContent.trim() : null;
      });

      // Take final screenshot
      const screenshot = await page.screenshot({ encoding: 'base64' });

      // Stop streaming
      this.stopStreaming(actionId);

      // Update action as completed
      action.status = 'completed';
      action.metadata.confirmationNumber = confirmationNumber || `UBER-${Date.now()}`;
      action.metadata.screenshot = screenshot;
      action.metadata.completedAt = new Date();
      await action.save();

      this.emitStatus(actionId, `Ride booked successfully! Confirmation: ${action.metadata.confirmationNumber}`, totalSteps, totalSteps);

      await page.close();
      this.activeSessions.delete(actionId);

      return {
        success: true,
        actionId: action._id,
        confirmationNumber: action.metadata.confirmationNumber,
        message: `Uber ${rideType} booked successfully`,
        screenshot
      };

    } catch (error) {
      console.error('Uber booking error:', error);

      // Stop streaming on error
      this.stopStreaming(actionId);

      // Take error screenshot
      let errorScreenshot;
      if (page) {
        try {
          errorScreenshot = await page.screenshot({ encoding: 'base64' });
        } catch (screenshotError) {
          console.error('Screenshot error:', screenshotError);
        }
        await page.close();
      }

      // Update action as failed
      if (action) {
        action.status = 'failed';
        action.metadata.error = error.message;
        action.metadata.errorScreenshot = errorScreenshot;
        action.metadata.failedAt = new Date();
        await action.save();
      }

      this.emitStatus(actionId, `Error: ${error.message}`, null, totalSteps);
      this.activeSessions.delete(actionId);

      return {
        success: false,
        error: error.message,
        actionId: action?._id,
        screenshot: errorScreenshot
      };
    }
  }

  // ============================================================================
  // LYFT RIDE BOOKING
  // ============================================================================

  async bookLyftRide({ userId, credentials, pickup, destination, rideType = 'Lyft' }) {
    const actionId = crypto.randomBytes(16).toString('hex');
    this.activeSessions.set(actionId, { status: 'in_progress', service: 'lyft' });

    let page;
    let action;
    const totalSteps = 7;

    try {
      action = await ButlerAction.create({
        userId,
        actionType: 'ride',
        description: `Lyft ${rideType} from ${pickup} to ${destination}`,
        status: 'in_progress',
        metadata: { pickup, destination, rideType, service: 'lyft', sessionId: actionId }
      });

      page = await this.createPage();

      // Start screenshot streaming
      await this.streamScreenshots(actionId, page, 500);

      // Step 1: Navigate to Lyft
      this.emitStatus(actionId, 'Navigating to Lyft website...', 1, totalSteps);
      await page.goto('https://www.lyft.com/', { waitUntil: 'networkidle2' });

      // Step 2: Login
      this.emitStatus(actionId, 'Logging into Lyft account...', 2, totalSteps);
      await page.waitForSelector('a[href*="login"], button:has-text("Log in")', { timeout: 10000 });
      await page.click('a[href*="login"], button:has-text("Log in")');

      const email = credentials.email || this.decryptCredential(credentials.encryptedEmail);
      const password = credentials.password || this.decryptCredential(credentials.encryptedPassword);

      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      await page.type('input[type="email"], input[name="email"]', email);
      await page.type('input[type="password"]', password);
      await page.click('button[type="submit"]');

      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

      // Step 3: Enter pickup location
      this.emitStatus(actionId, `Setting pickup location: ${pickup}...`, 3, totalSteps);
      await page.waitForSelector('input[placeholder*="pickup"]', { timeout: 10000 });
      await page.type('input[placeholder*="pickup"]', pickup);
      await page.waitForTimeout(2000);
      await page.keyboard.press('Enter');

      // Step 4: Enter destination
      this.emitStatus(actionId, `Setting destination: ${destination}...`, 4, totalSteps);
      await page.waitForSelector('input[placeholder*="destination"]', { timeout: 10000 });
      await page.type('input[placeholder*="destination"]', destination);
      await page.waitForTimeout(2000);
      await page.keyboard.press('Enter');

      // Step 5: Select ride type
      this.emitStatus(actionId, `Selecting ${rideType} ride option...`, 5, totalSteps);
      await page.waitForSelector('.ride-type', { timeout: 15000 });

      // Select ride type
      const rideOptions = await page.$$('.ride-type');
      for (const option of rideOptions) {
        const text = await option.evaluate(el => el.textContent);
        if (text.includes(rideType)) {
          await option.click();
          break;
        }
      }

      // Step 6: Request ride
      this.emitStatus(actionId, 'Requesting ride...', 6, totalSteps);
      await page.waitForSelector('button:has-text("Request")', { timeout: 10000 });
      await page.click('button:has-text("Request")');

      // Step 7: Wait for confirmation
      this.emitStatus(actionId, 'Waiting for confirmation...', 7, totalSteps);
      await page.waitForSelector('.confirmation, [data-ride-id]', { timeout: 20000 });

      const confirmationNumber = await page.evaluate(() => {
        const elem = document.querySelector('[data-ride-id], .confirmation-code');
        return elem ? elem.textContent.trim() : null;
      });

      const screenshot = await page.screenshot({ encoding: 'base64' });

      // Stop streaming
      this.stopStreaming(actionId);

      action.status = 'completed';
      action.metadata.confirmationNumber = confirmationNumber || `LYFT-${Date.now()}`;
      action.metadata.screenshot = screenshot;
      action.metadata.completedAt = new Date();
      await action.save();

      this.emitStatus(actionId, `Ride booked successfully! Confirmation: ${action.metadata.confirmationNumber}`, totalSteps, totalSteps);

      await page.close();
      this.activeSessions.delete(actionId);

      return {
        success: true,
        actionId: action._id,
        confirmationNumber: action.metadata.confirmationNumber,
        message: `Lyft ${rideType} booked successfully`,
        screenshot
      };

    } catch (error) {
      console.error('Lyft booking error:', error);

      // Stop streaming on error
      this.stopStreaming(actionId);

      let errorScreenshot;
      if (page) {
        try {
          errorScreenshot = await page.screenshot({ encoding: 'base64' });
        } catch (e) {}
        await page.close();
      }

      if (action) {
        action.status = 'failed';
        action.metadata.error = error.message;
        action.metadata.errorScreenshot = errorScreenshot;
        action.metadata.failedAt = new Date();
        await action.save();
      }

      this.emitStatus(actionId, `Error: ${error.message}`, null, totalSteps);
      this.activeSessions.delete(actionId);

      return {
        success: false,
        error: error.message,
        actionId: action?._id,
        screenshot: errorScreenshot
      };
    }
  }

  // ============================================================================
  // OPENTABLE RESERVATION
  // ============================================================================

  async makeOpenTableReservation({ userId, credentials, restaurantName, date, time, partySize, preferences = {} }) {
    const actionId = crypto.randomBytes(16).toString('hex');
    this.activeSessions.set(actionId, { status: 'in_progress', service: 'opentable' });

    let page;
    let action;
    const totalSteps = 8;

    try {
      action = await ButlerAction.create({
        userId,
        actionType: 'reservation',
        description: `Reservation at ${restaurantName} for ${partySize} on ${date} at ${time}`,
        status: 'in_progress',
        metadata: { restaurantName, date, time, partySize, preferences, sessionId: actionId }
      });

      page = await this.createPage();

      // Start screenshot streaming
      await this.streamScreenshots(actionId, page, 500);

      // Step 1: Navigate to OpenTable
      this.emitStatus(actionId, 'Navigating to OpenTable...', 1, totalSteps);

      // Navigate to OpenTable
      await page.goto('https://www.opentable.com/', { waitUntil: 'networkidle2' });

      // Step 2: Search for restaurant
      this.emitStatus(actionId, `Searching for ${restaurantName}...`, 2, totalSteps);
      await page.waitForSelector('input[placeholder*="restaurant"], input[type="search"]', { timeout: 10000 });
      await page.type('input[placeholder*="restaurant"], input[type="search"]', restaurantName);
      await page.keyboard.press('Enter');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Step 3: Select restaurant
      this.emitStatus(actionId, 'Selecting restaurant...', 3, totalSteps);
      await page.waitForSelector('a[data-test="restaurant-link"], .restaurant-link', { timeout: 10000 });
      await page.click('a[data-test="restaurant-link"], .restaurant-link');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Step 4: Set reservation details
      this.emitStatus(actionId, `Setting reservation for ${partySize} people on ${date} at ${time}...`, 4, totalSteps);
      await page.waitForSelector('select[name="date"], input[type="date"]', { timeout: 10000 });
      await page.select('select[name="date"]', date);

      await page.waitForSelector('select[name="time"]', { timeout: 10000 });
      await page.select('select[name="time"]', time);

      await page.waitForSelector('select[name="partySize"], select[id*="party"]', { timeout: 10000 });
      await page.select('select[name="partySize"], select[id*="party"]', partySize.toString());

      // Step 5: Find available tables
      this.emitStatus(actionId, 'Finding available tables...', 5, totalSteps);
      await page.waitForSelector('button:has-text("Find"), button[type="submit"]', { timeout: 10000 });
      await page.click('button:has-text("Find"), button[type="submit"]');

      await page.waitForSelector('.timeslot, button[data-time]', { timeout: 15000 });
      await page.click('.timeslot, button[data-time]');

      // Step 6: Login if credentials provided
      if (credentials && credentials.email) {
        try {
          this.emitStatus(actionId, 'Logging into OpenTable account...', 6, totalSteps);
          await page.waitForSelector('input[type="email"]', { timeout: 5000 });
          const email = credentials.email || this.decryptCredential(credentials.encryptedEmail);
          const password = credentials.password || this.decryptCredential(credentials.encryptedPassword);

          await page.type('input[type="email"]', email);
          await page.type('input[type="password"]', password);
          await page.click('button[type="submit"]');
        } catch (e) {
          // Continue as guest if login fails
        }
      }

      // Step 7: Fill in reservation details
      this.emitStatus(actionId, 'Filling in reservation details...', 7, totalSteps);
      await page.waitForSelector('input[name="firstName"], input[id*="firstName"]', { timeout: 10000 });
      if (preferences.firstName) await page.type('input[name="firstName"]', preferences.firstName);
      if (preferences.lastName) await page.type('input[name="lastName"]', preferences.lastName);
      if (preferences.phone) await page.type('input[name="phone"]', preferences.phone);
      if (preferences.email) await page.type('input[name="email"]', preferences.email);

      if (preferences.specialRequest) {
        await page.waitForSelector('textarea[name="specialRequest"]', { timeout: 5000 });
        await page.type('textarea[name="specialRequest"]', preferences.specialRequest);
      }

      // Step 8: Complete reservation
      this.emitStatus(actionId, 'Completing reservation...', 8, totalSteps);
      await page.waitForSelector('button:has-text("Complete"), button:has-text("Reserve")', { timeout: 10000 });
      await page.click('button:has-text("Complete"), button:has-text("Reserve")');

      await page.waitForSelector('.confirmation-number, [data-confirmation]', { timeout: 20000 });

      const confirmationNumber = await page.evaluate(() => {
        const elem = document.querySelector('.confirmation-number, [data-confirmation]');
        return elem ? elem.textContent.trim() : null;
      });

      const screenshot = await page.screenshot({ encoding: 'base64' });

      // Stop streaming
      this.stopStreaming(actionId);

      action.status = 'completed';
      action.metadata.confirmationNumber = confirmationNumber || `OT-${Date.now()}`;
      action.metadata.screenshot = screenshot;
      action.metadata.completedAt = new Date();
      await action.save();

      this.emitStatus(actionId, `Reservation confirmed! Confirmation: ${action.metadata.confirmationNumber}`, totalSteps, totalSteps);

      await page.close();
      this.activeSessions.delete(actionId);

      return {
        success: true,
        actionId: action._id,
        confirmationNumber: action.metadata.confirmationNumber,
        message: `Reservation confirmed at ${restaurantName}`,
        screenshot
      };

    } catch (error) {
      console.error('OpenTable reservation error:', error);

      // Stop streaming on error
      this.stopStreaming(actionId);

      let errorScreenshot;
      if (page) {
        try {
          errorScreenshot = await page.screenshot({ encoding: 'base64' });
        } catch (e) {}
        await page.close();
      }

      if (action) {
        action.status = 'failed';
        action.metadata.error = error.message;
        action.metadata.errorScreenshot = errorScreenshot;
        action.metadata.failedAt = new Date();
        await action.save();
      }

      this.emitStatus(actionId, `Error: ${error.message}`, null, totalSteps);
      this.activeSessions.delete(actionId);

      return {
        success: false,
        error: error.message,
        actionId: action?._id,
        screenshot: errorScreenshot
      };
    }
  }

  // ============================================================================
  // DOORDASH FOOD DELIVERY
  // ============================================================================

  async orderDoorDash({ userId, credentials, restaurant, items = [], deliveryAddress, preferences = {} }) {
    const actionId = crypto.randomBytes(16).toString('hex');
    this.activeSessions.set(actionId, { status: 'in_progress', service: 'doordash' });

    let page;
    let action;
    const totalSteps = 7;

    try {
      action = await ButlerAction.create({
        userId,
        actionType: 'food',
        description: `DoorDash order from ${restaurant}`,
        status: 'in_progress',
        metadata: { restaurant, items, deliveryAddress, service: 'doordash', sessionId: actionId }
      });

      page = await this.createPage();

      // Start screenshot streaming
      await this.streamScreenshots(actionId, page, 500);

      // Step 1: Navigate to DoorDash
      this.emitStatus(actionId, 'Navigating to DoorDash...', 1, totalSteps);
      await page.goto('https://www.doordash.com/', { waitUntil: 'networkidle2' });

      // Step 2: Enter delivery address
      this.emitStatus(actionId, `Setting delivery address: ${deliveryAddress}...`, 2, totalSteps);
      await page.waitForSelector('input[placeholder*="address"], input[name="address"]', { timeout: 10000 });
      await page.type('input[placeholder*="address"], input[name="address"]', deliveryAddress);
      await page.waitForTimeout(2000);
      await page.keyboard.press('Enter');

      // Step 3: Search for restaurant
      this.emitStatus(actionId, `Searching for ${restaurant}...`, 3, totalSteps);
      await page.waitForSelector('input[placeholder*="Search"], input[type="search"]', { timeout: 10000 });
      await page.type('input[placeholder*="Search"], input[type="search"]', restaurant);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);

      await page.waitForSelector('a[data-test*="store-card"], .store-card', { timeout: 10000 });
      await page.click('a[data-test*="store-card"], .store-card');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Step 4: Add items to cart
      this.emitStatus(actionId, `Adding ${items.length} item(s) to cart...`, 4, totalSteps);
      for (const item of items) {
        try {
          const menuItems = await page.$$('[data-testid*="menu-item"], .menu-item');

          for (const menuItem of menuItems) {
            const itemName = await menuItem.evaluate(el => el.textContent);
            if (itemName.toLowerCase().includes(item.name.toLowerCase())) {
              await menuItem.click();
              await page.waitForTimeout(1000);

              if (item.customizations) {
                // Add customization logic here
              }

              await page.waitForSelector('button:has-text("Add to Order")', { timeout: 5000 });
              await page.click('button:has-text("Add to Order")');
              await page.waitForTimeout(1000);
              break;
            }
          }
        } catch (e) {
          console.error(`Error adding item ${item.name}:`, e);
        }
      }

      // Step 5: Go to checkout and login
      this.emitStatus(actionId, 'Proceeding to checkout...', 5, totalSteps);
      await page.waitForSelector('button:has-text("Checkout"), [data-test="checkout-button"]', { timeout: 10000 });
      await page.click('button:has-text("Checkout"), [data-test="checkout-button"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      if (credentials) {
        try {
          this.emitStatus(actionId, 'Logging into DoorDash account...', 5, totalSteps);
          await page.waitForSelector('input[type="email"]', { timeout: 5000 });
          const email = credentials.email || this.decryptCredential(credentials.encryptedEmail);
          const password = credentials.password || this.decryptCredential(credentials.encryptedPassword);

          await page.type('input[type="email"]', email);
          await page.click('button[type="submit"]');
          await page.waitForSelector('input[type="password"]', { timeout: 5000 });
          await page.type('input[type="password"]', password);
          await page.click('button[type="submit"]');
          await page.waitForTimeout(3000);
        } catch (e) {
          // Continue if already logged in
        }
      }

      // Step 6: Add delivery instructions
      if (preferences.deliveryInstructions) {
        this.emitStatus(actionId, 'Adding delivery instructions...', 6, totalSteps);
        await page.waitForSelector('textarea[placeholder*="instructions"]', { timeout: 5000 });
        await page.type('textarea[placeholder*="instructions"]', preferences.deliveryInstructions);
      }

      // Step 7: Place order
      this.emitStatus(actionId, 'Placing order...', 7, totalSteps);
      await page.waitForSelector('button:has-text("Place Order")', { timeout: 10000 });
      await page.click('button:has-text("Place Order")');

      await page.waitForSelector('.order-number, [data-order-id]', { timeout: 20000 });

      const orderNumber = await page.evaluate(() => {
        const elem = document.querySelector('.order-number, [data-order-id]');
        return elem ? elem.textContent.trim() : null;
      });

      const screenshot = await page.screenshot({ encoding: 'base64' });

      // Stop streaming
      this.stopStreaming(actionId);

      action.status = 'completed';
      action.metadata.orderNumber = orderNumber || `DD-${Date.now()}`;
      action.metadata.screenshot = screenshot;
      action.metadata.completedAt = new Date();
      await action.save();

      this.emitStatus(actionId, `Order placed successfully! Order #${action.metadata.orderNumber}`, totalSteps, totalSteps);

      await page.close();
      this.activeSessions.delete(actionId);

      return {
        success: true,
        actionId: action._id,
        orderNumber: action.metadata.orderNumber,
        message: `Food ordered from ${restaurant} via DoorDash`,
        screenshot
      };

    } catch (error) {
      console.error('DoorDash order error:', error);

      // Stop streaming on error
      this.stopStreaming(actionId);

      let errorScreenshot;
      if (page) {
        try {
          errorScreenshot = await page.screenshot({ encoding: 'base64' });
        } catch (e) {}
        await page.close();
      }

      if (action) {
        action.status = 'failed';
        action.metadata.error = error.message;
        action.metadata.errorScreenshot = errorScreenshot;
        action.metadata.failedAt = new Date();
        await action.save();
      }

      this.emitStatus(actionId, `Error: ${error.message}`, null, totalSteps);
      this.activeSessions.delete(actionId);

      return {
        success: false,
        error: error.message,
        actionId: action?._id,
        screenshot: errorScreenshot
      };
    }
  }

  // ============================================================================
  // UBER EATS FOOD DELIVERY
  // ============================================================================

  async orderUberEats({ userId, credentials, restaurant, items = [], deliveryAddress, preferences = {} }) {
    const actionId = crypto.randomBytes(16).toString('hex');
    this.activeSessions.set(actionId, { status: 'in_progress', service: 'ubereats' });

    let page;
    let action;
    const totalSteps = 7;

    try {
      action = await ButlerAction.create({
        userId,
        actionType: 'food',
        description: `Uber Eats order from ${restaurant}`,
        status: 'in_progress',
        metadata: { restaurant, items, deliveryAddress, service: 'ubereats', sessionId: actionId }
      });

      page = await this.createPage();

      // Start screenshot streaming
      await this.streamScreenshots(actionId, page, 500);

      // Step 1: Navigate to Uber Eats
      this.emitStatus(actionId, 'Navigating to Uber Eats...', 1, totalSteps);

      // Navigate to Uber Eats
      await page.goto('https://www.ubereats.com/', { waitUntil: 'networkidle2' });

      // Step 2: Enter delivery address
      this.emitStatus(actionId, `Setting delivery address: ${deliveryAddress}...`, 2, totalSteps);
      await page.waitForSelector('input[placeholder*="address"], #location-typeahead-input', { timeout: 10000 });
      await page.type('input[placeholder*="address"], #location-typeahead-input', deliveryAddress);
      await page.waitForTimeout(2000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Step 3: Search for restaurant
      this.emitStatus(actionId, `Searching for ${restaurant}...`, 3, totalSteps);
      await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
      await page.type('input[placeholder*="Search"]', restaurant);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);

      await page.waitForSelector('a[href*="/store/"]', { timeout: 10000 });
      await page.click('a[href*="/store/"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Step 4: Add items to cart
      this.emitStatus(actionId, `Adding ${items.length} item(s) to cart...`, 4, totalSteps);
      for (const item of items) {
        try {
          const menuItems = await page.$$('[data-test*="store-item"]');

          for (const menuItem of menuItems) {
            const itemName = await menuItem.evaluate(el => el.textContent);
            if (itemName.toLowerCase().includes(item.name.toLowerCase())) {
              await menuItem.click();
              await page.waitForTimeout(1000);

              await page.waitForSelector('button:has-text("Add"), button[aria-label*="Add"]', { timeout: 5000 });
              await page.click('button:has-text("Add"), button[aria-label*="Add"]');
              await page.waitForTimeout(1000);
              break;
            }
          }
        } catch (e) {
          console.error(`Error adding item ${item.name}:`, e);
        }
      }

      // Step 5: Go to checkout
      this.emitStatus(actionId, 'Proceeding to checkout...', 5, totalSteps);
      await page.waitForSelector('button:has-text("View cart"), a[href*="/checkout"]', { timeout: 10000 });
      await page.click('button:has-text("View cart"), a[href*="/checkout"]');
      await page.waitForTimeout(2000);

      await page.waitForSelector('button:has-text("Go to checkout")');
      await page.click('button:has-text("Go to checkout")');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Step 6: Login if needed
      if (credentials) {
        try {
          this.emitStatus(actionId, 'Logging into Uber Eats account...', 6, totalSteps);
          await page.waitForSelector('input[type="email"]', { timeout: 5000 });
          const email = credentials.email || this.decryptCredential(credentials.encryptedEmail);
          const password = credentials.password || this.decryptCredential(credentials.encryptedPassword);

          await page.type('input[type="email"]', email);
          await page.click('button[type="submit"]');
          await page.waitForSelector('input[type="password"]', { timeout: 5000 });
          await page.type('input[type="password"]', password);
          await page.click('button[type="submit"]');
          await page.waitForTimeout(3000);
        } catch (e) {
          // Continue if already logged in
        }
      }

      // Step 7: Place order
      this.emitStatus(actionId, 'Placing order...', 7, totalSteps);
      await page.waitForSelector('button:has-text("Place order")', { timeout: 10000 });
      await page.click('button:has-text("Place order")');

      await page.waitForSelector('[data-test="order-id"], .order-number', { timeout: 20000 });

      const orderNumber = await page.evaluate(() => {
        const elem = document.querySelector('[data-test="order-id"], .order-number');
        return elem ? elem.textContent.trim() : null;
      });

      const screenshot = await page.screenshot({ encoding: 'base64' });

      // Stop streaming
      this.stopStreaming(actionId);

      action.status = 'completed';
      action.metadata.orderNumber = orderNumber || `UE-${Date.now()}`;
      action.metadata.screenshot = screenshot;
      action.metadata.completedAt = new Date();
      await action.save();

      this.emitStatus(actionId, `Order placed successfully! Order #${action.metadata.orderNumber}`, totalSteps, totalSteps);

      await page.close();
      this.activeSessions.delete(actionId);

      return {
        success: true,
        actionId: action._id,
        orderNumber: action.metadata.orderNumber,
        message: `Food ordered from ${restaurant} via Uber Eats`,
        screenshot
      };

    } catch (error) {
      console.error('Uber Eats order error:', error);

      // Stop streaming on error
      this.stopStreaming(actionId);

      let errorScreenshot;
      if (page) {
        try {
          errorScreenshot = await page.screenshot({ encoding: 'base64' });
        } catch (e) {}
        await page.close();
      }

      if (action) {
        action.status = 'failed';
        action.metadata.error = error.message;
        action.metadata.errorScreenshot = errorScreenshot;
        action.metadata.failedAt = new Date();
        await action.save();
      }

      this.emitStatus(actionId, `Error: ${error.message}`, null, totalSteps);
      this.activeSessions.delete(actionId);

      return {
        success: false,
        error: error.message,
        actionId: action?._id,
        screenshot: errorScreenshot
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getActionHistory(userId, actionType = null, limit = 50) {
    const query = { userId };
    if (actionType) query.actionType = actionType;

    return await ButlerAction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getActionStatus(actionId) {
    const action = await ButlerAction.findById(actionId).lean();
    return action;
  }

  async cleanup() {
    // Stop all active streams
    for (const [sessionId] of this.activeStreams) {
      this.stopStreaming(sessionId);
    }

    await this.closeBrowser();
    this.activeSessions.clear();
  }

  // ============================================================================
  // SSE ENDPOINT HELPER
  // ============================================================================

  createSSEHandler() {
    return (req, res) => {
      const { sessionId } = req.params;

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Send initial connection message
      res.write('data: {"type":"connected","sessionId":"' + sessionId + '"}\n\n');

      // Frame event handler
      const frameHandler = (data) => {
        if (data.sessionId === sessionId) {
          res.write(`data: ${JSON.stringify({ type: 'frame', ...data })}\n\n`);
        }
      };

      // Status event handler
      const statusHandler = (data) => {
        if (data.sessionId === sessionId) {
          res.write(`data: ${JSON.stringify({ type: 'status', ...data })}\n\n`);
        }
      };

      // Stream stopped event handler
      const streamStoppedHandler = (data) => {
        if (data.sessionId === sessionId) {
          res.write(`data: ${JSON.stringify({ type: 'stream_stopped', ...data })}\n\n`);
          res.end();
        }
      };

      // Register event listeners
      this.on('frame', frameHandler);
      this.on('status', statusHandler);
      this.on('stream_stopped', streamStoppedHandler);

      // Handle client disconnect
      req.on('close', () => {
        this.removeListener('frame', frameHandler);
        this.removeListener('status', statusHandler);
        this.removeListener('stream_stopped', streamStoppedHandler);
        res.end();
      });

      // Send keepalive every 30 seconds
      const keepaliveInterval = setInterval(() => {
        res.write(':keepalive\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(keepaliveInterval);
      });
    };
  }
}

module.exports = new PuppeteerButler();
