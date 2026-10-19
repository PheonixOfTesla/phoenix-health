/**
 * Example Phoenix Controller Integration
 *
 * This shows how to integrate the session manager into Phoenix controllers
 * for butler automation tasks.
 */

const sessionManager = require('./sessionManager');

/**
 * Example Controller: Gmail Butler
 */
class GmailButlerController {
  /**
   * Setup Gmail access for user
   * POST /api/butler/gmail/setup
   */
  async setupGmail(req, res) {
    try {
      const userId = req.user.id; // From auth middleware

      // Setup session - this will open a browser for user to login
      const result = await sessionManager.setupGoogleSession(userId);

      res.json({
        success: true,
        message: 'Gmail session setup complete. You can now use Gmail automation features.',
        data: result
      });
    } catch (error) {
      console.error('Gmail setup failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to setup Gmail session',
        error: error.message
      });
    }
  }

  /**
   * Check Gmail unread count
   * GET /api/butler/gmail/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      // Verify session exists
      const isValid = await sessionManager.checkGoogleSession(userId);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Gmail session not found or expired. Please setup again.',
          requiresSetup: true
        });
      }

      // Get session
      const { browser, page } = await sessionManager.getGoogleSession(userId);

      // Navigate to Gmail
      await page.goto('https://mail.google.com/mail/u/0/#inbox', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for inbox to load
      await page.waitForSelector('[role="main"]', { timeout: 10000 });

      // Get unread count
      const unreadCount = await page.evaluate(() => {
        const unreadElement = document.querySelector('.aio.UKr6le');
        return unreadElement ? parseInt(unreadElement.textContent) : 0;
      });

      res.json({
        success: true,
        data: {
          unreadCount,
          checkedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to get unread count:', error);

      if (error.message.includes('Session expired')) {
        return res.status(401).json({
          success: false,
          message: 'Gmail session expired. Please setup again.',
          requiresSetup: true
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to check Gmail',
        error: error.message
      });
    }
  }

  /**
   * Get recent emails
   * GET /api/butler/gmail/recent?limit=10
   */
  async getRecentEmails(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      // Get session
      const { browser, page } = await sessionManager.getGoogleSession(userId);

      // Navigate to Gmail
      await page.goto('https://mail.google.com/mail/u/0/#inbox', {
        waitUntil: 'networkidle2'
      });

      // Wait for emails
      await page.waitForSelector('.zA', { timeout: 10000 });

      // Get emails
      const emails = await page.evaluate((emailLimit) => {
        const emailElements = document.querySelectorAll('.zA');

        return Array.from(emailElements).slice(0, emailLimit).map(email => {
          const isUnread = email.classList.contains('zE');
          const subject = email.querySelector('.bog')?.textContent || '';
          const sender = email.querySelector('.yW')?.textContent || '';
          const time = email.querySelector('.xW')?.textContent || '';

          return { sender, subject, time, isUnread };
        });
      }, limit);

      res.json({
        success: true,
        data: {
          emails,
          count: emails.length,
          limit
        }
      });
    } catch (error) {
      console.error('Failed to get emails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emails',
        error: error.message
      });
    }
  }

  /**
   * Disconnect Gmail
   * DELETE /api/butler/gmail/disconnect
   */
  async disconnectGmail(req, res) {
    try {
      const userId = req.user.id;

      await sessionManager.clearGoogleSession(userId);

      res.json({
        success: true,
        message: 'Gmail session disconnected successfully'
      });
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect Gmail',
        error: error.message
      });
    }
  }
}

/**
 * Example Controller: Banking Butler
 */
class BankingButlerController {
  /**
   * Setup bank connection
   * POST /api/butler/banking/setup
   * Body: { bankName: 'Chase', loginUrl: 'https://...' }
   */
  async setupBank(req, res) {
    try {
      const userId = req.user.id;
      const { bankName, loginUrl } = req.body;

      if (!bankName || !loginUrl) {
        return res.status(400).json({
          success: false,
          message: 'Bank name and login URL are required'
        });
      }

      const result = await sessionManager.setupBankingSession(userId, bankName, loginUrl);

      res.json({
        success: true,
        message: `${bankName} session setup complete`,
        data: result
      });
    } catch (error) {
      console.error('Bank setup failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to setup bank session',
        error: error.message
      });
    }
  }

  /**
   * Get account balances
   * GET /api/butler/banking/:bankName/balances
   */
  async getBalances(req, res) {
    try {
      const userId = req.user.id;
      const { bankName } = req.params;

      const { browser, page } = await sessionManager.getBankingSession(userId, bankName);

      // Navigate to accounts page (example - varies by bank)
      await page.goto('https://secure.chase.com/web/auth/dashboard#/dashboard/accounts', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for accounts to load
      await page.waitForSelector('.account-tile', { timeout: 10000 });

      // Get account balances
      const accounts = await page.evaluate(() => {
        const accountElements = document.querySelectorAll('.account-tile');

        return Array.from(accountElements).map(account => ({
          name: account.querySelector('.account-name')?.textContent.trim(),
          balance: account.querySelector('.account-balance')?.textContent.trim(),
          type: account.querySelector('.account-type')?.textContent.trim()
        }));
      });

      res.json({
        success: true,
        data: {
          accounts,
          bankName,
          checkedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to get balances:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch account balances',
        error: error.message
      });
    }
  }
}

/**
 * Example Controller: Food Delivery Butler
 */
class FoodDeliveryButlerController {
  /**
   * Setup DoorDash connection
   * POST /api/butler/food/doordash/setup
   */
  async setupDoorDash(req, res) {
    try {
      const userId = req.user.id;

      const result = await sessionManager.setupFoodDeliverySession(userId, 'doordash');

      res.json({
        success: true,
        message: 'DoorDash session setup complete',
        data: result
      });
    } catch (error) {
      console.error('DoorDash setup failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to setup DoorDash session',
        error: error.message
      });
    }
  }

  /**
   * Get recent orders
   * GET /api/butler/food/doordash/orders
   */
  async getOrders(req, res) {
    try {
      const userId = req.user.id;

      const { browser, page } = await sessionManager.getFoodDeliverySession(userId, 'doordash');

      // Navigate to orders
      await page.goto('https://www.doordash.com/orders/', {
        waitUntil: 'networkidle2'
      });

      // Wait for orders
      await page.waitForSelector('[data-anchor-id="OrderCard"]', { timeout: 10000 });

      // Get orders
      const orders = await page.evaluate(() => {
        const orderCards = document.querySelectorAll('[data-anchor-id="OrderCard"]');

        return Array.from(orderCards).slice(0, 10).map(card => ({
          restaurant: card.querySelector('[data-anchor-id="MerchantName"]')?.textContent.trim(),
          status: card.querySelector('[data-anchor-id="OrderStatus"]')?.textContent.trim(),
          items: card.querySelector('[data-anchor-id="OrderItems"]')?.textContent.trim(),
          date: card.querySelector('[data-anchor-id="OrderDate"]')?.textContent.trim()
        }));
      });

      res.json({
        success: true,
        data: {
          orders,
          count: orders.length
        }
      });
    } catch (error) {
      console.error('Failed to get orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  }

  /**
   * Reorder from DoorDash
   * POST /api/butler/food/doordash/reorder
   * Body: { orderId: '...' }
   */
  async reorder(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      const { browser, page } = await sessionManager.getFoodDeliverySession(userId, 'doordash');

      // Navigate to order
      await page.goto(`https://www.doordash.com/orders/${orderId}`, {
        waitUntil: 'networkidle2'
      });

      // Click reorder button
      const reorderButton = await page.$('[data-anchor-id="ReorderButton"]');

      if (!reorderButton) {
        return res.status(404).json({
          success: false,
          message: 'Reorder button not found. Order may not support reordering.'
        });
      }

      await reorderButton.click();

      // Wait for cart page
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

      res.json({
        success: true,
        message: 'Order added to cart. Ready for checkout.',
        data: {
          orderId,
          cartUrl: page.url()
        }
      });
    } catch (error) {
      console.error('Failed to reorder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder',
        error: error.message
      });
    }
  }
}

/**
 * Example Express Route Setup
 */
function setupButlerRoutes(app) {
  const gmailController = new GmailButlerController();
  const bankingController = new BankingButlerController();
  const foodController = new FoodDeliveryButlerController();

  // Gmail routes
  app.post('/api/butler/gmail/setup', gmailController.setupGmail);
  app.get('/api/butler/gmail/unread-count', gmailController.getUnreadCount);
  app.get('/api/butler/gmail/recent', gmailController.getRecentEmails);
  app.delete('/api/butler/gmail/disconnect', gmailController.disconnectGmail);

  // Banking routes
  app.post('/api/butler/banking/setup', bankingController.setupBank);
  app.get('/api/butler/banking/:bankName/balances', bankingController.getBalances);

  // Food delivery routes
  app.post('/api/butler/food/doordash/setup', foodController.setupDoorDash);
  app.get('/api/butler/food/doordash/orders', foodController.getOrders);
  app.post('/api/butler/food/doordash/reorder', foodController.reorder);

  console.log('[Butler] Routes registered successfully');
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandlers() {
  const shutdown = async () => {
    console.log('[Butler] Shutting down session manager...');
    await sessionManager.shutdown();
    console.log('[Butler] Session manager closed');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Export controllers and setup function
module.exports = {
  GmailButlerController,
  BankingButlerController,
  FoodDeliveryButlerController,
  setupButlerRoutes,
  setupShutdownHandlers
};
