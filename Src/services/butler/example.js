/**
 * Phoenix Butler Session Manager - Usage Examples
 *
 * Practical examples showing how to use the session manager
 * for various automation tasks.
 */

const sessionManager = require('./sessionManager');

// Example 1: Setup and use Google session
async function exampleGoogleSetup() {
  console.log('\n=== Example 1: Google Session Setup ===\n');

  const userId = 'user123';

  try {
    // Setup session (opens visible browser for user to login)
    console.log('Opening browser for Google login...');
    await sessionManager.setupGoogleSession(userId);
    console.log('Google session setup complete!');

    // Now we can use the session
    const { browser, page } = await sessionManager.getGoogleSession(userId);

    // Navigate to Gmail
    await page.goto('https://mail.google.com', { waitUntil: 'networkidle2' });
    console.log('Successfully navigated to Gmail!');

    // Check session validity
    const isValid = await sessionManager.checkGoogleSession(userId);
    console.log(`Session is valid: ${isValid}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 2: Check Gmail unread count
async function exampleCheckGmail() {
  console.log('\n=== Example 2: Check Gmail ===\n');

  const userId = 'user123';

  try {
    // Verify session exists
    const isValid = await sessionManager.checkGoogleSession(userId);

    if (!isValid) {
      console.log('No valid session found. Please run setupGoogleSession first.');
      return;
    }

    // Get session
    const { browser, page } = await sessionManager.getGoogleSession(userId);

    // Navigate to Gmail inbox
    await page.goto('https://mail.google.com/mail/u/0/#inbox', {
      waitUntil: 'networkidle2'
    });

    // Wait for inbox to load
    await page.waitForSelector('[role="main"]', { timeout: 10000 });

    // Get unread count
    const unreadCount = await page.evaluate(() => {
      const unreadElement = document.querySelector('.aio.UKr6le');
      return unreadElement ? unreadElement.textContent : '0';
    });

    console.log(`Unread emails: ${unreadCount}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 3: Banking automation
async function exampleBanking() {
  console.log('\n=== Example 3: Banking Session ===\n');

  const userId = 'user123';
  const bankName = 'Chase';
  const loginUrl = 'https://secure.chase.com/web/auth';

  try {
    // Setup banking session
    console.log(`Setting up ${bankName} session...`);
    await sessionManager.setupBankingSession(userId, bankName, loginUrl);
    console.log('Banking session setup complete!');

    // Use session to check accounts
    const { browser, page } = await sessionManager.getBankingSession(userId, bankName);

    // Navigate to dashboard (example)
    await page.goto('https://secure.chase.com/web/auth/dashboard', {
      waitUntil: 'networkidle2'
    });

    console.log('Successfully accessed banking dashboard');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 4: DoorDash order tracking
async function exampleDoorDash() {
  console.log('\n=== Example 4: DoorDash Orders ===\n');

  const userId = 'user123';

  try {
    // Check if session exists
    const isValid = await sessionManager.checkSession(userId, 'doordash');

    if (!isValid) {
      console.log('Setting up DoorDash session...');
      await sessionManager.setupFoodDeliverySession(userId, 'doordash');
      console.log('DoorDash session setup complete!');
    }

    // Get session
    const { browser, page } = await sessionManager.getFoodDeliverySession(userId, 'doordash');

    // Navigate to orders
    await page.goto('https://www.doordash.com/orders/', {
      waitUntil: 'networkidle2'
    });

    console.log('Accessed DoorDash orders page');

    // Get recent orders (example selectors - may need adjustment)
    const orders = await page.evaluate(() => {
      const orderElements = document.querySelectorAll('[data-testid="order-card"]');

      return Array.from(orderElements).slice(0, 5).map(order => ({
        restaurant: order.querySelector('[data-testid="merchant-name"]')?.textContent || 'Unknown',
        status: order.querySelector('[data-testid="order-status"]')?.textContent || 'Unknown'
      }));
    });

    console.log(`Found ${orders.length} recent orders:`);
    orders.forEach((order, i) => {
      console.log(`${i + 1}. ${order.restaurant} - ${order.status}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 5: Uber trip history
async function exampleUber() {
  console.log('\n=== Example 5: Uber Trip History ===\n');

  const userId = 'user123';

  try {
    // Setup Uber session if needed
    const isValid = await sessionManager.checkSession(userId, 'uber');

    if (!isValid) {
      console.log('Setting up Uber session...');
      await sessionManager.setupRideSession(userId, 'uber');
      console.log('Uber session setup complete!');
    }

    // Get session
    const { browser, page } = await sessionManager.getRideSession(userId, 'uber');

    // Navigate to trips
    await page.goto('https://riders.uber.com/trips', {
      waitUntil: 'networkidle2'
    });

    console.log('Accessed Uber trips page');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 6: Session management
async function exampleSessionManagement() {
  console.log('\n=== Example 6: Session Management ===\n');

  try {
    // Get all active sessions
    const activeSessions = sessionManager.getActiveSessions();

    console.log(`Active sessions: ${activeSessions.length}`);

    activeSessions.forEach(session => {
      console.log(`- ${session.userId}/${session.service}`);
      console.log(`  Last activity: ${session.lastActivity}`);
      console.log(`  Connected: ${session.isConnected}`);
    });

    // Clear a specific session
    if (activeSessions.length > 0) {
      const session = activeSessions[0];
      console.log(`\nClearing session: ${session.userId}/${session.service}`);
      await sessionManager.clearSession(session.userId, session.service);
      console.log('Session cleared!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 7: Custom service
async function exampleCustomService() {
  console.log('\n=== Example 7: Custom Service ===\n');

  const userId = 'user123';
  const service = 'amazon';
  const loginUrl = 'https://www.amazon.com/ap/signin';

  try {
    // Setup custom service
    console.log('Setting up Amazon session...');

    await sessionManager.setupSession(userId, service, loginUrl, {
      timeout: 15 * 60 * 1000, // 15 minutes
      successUrl: '/gp/css/homepage.html' // Redirect after login
    });

    console.log('Amazon session setup complete!');

    // Use session
    const { browser, page } = await sessionManager.getSession(userId, service);

    await page.goto('https://www.amazon.com/gp/css/order-history', {
      waitUntil: 'networkidle2'
    });

    console.log('Successfully accessed Amazon order history');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 8: Error handling and retry logic
async function exampleErrorHandling() {
  console.log('\n=== Example 8: Error Handling ===\n');

  const userId = 'user123';

  async function withRetry(action, maxRetries = 2) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await action();
      } catch (error) {
        console.log(`Attempt ${i + 1} failed: ${error.message}`);

        if (error.message.includes('Session expired') || error.message.includes('No saved session')) {
          console.log('Re-authenticating...');
          await sessionManager.setupGoogleSession(userId);
        } else if (i === maxRetries - 1) {
          throw error;
        }
      }
    }
  }

  try {
    const result = await withRetry(async () => {
      const { browser, page } = await sessionManager.getGoogleSession(userId);

      await page.goto('https://mail.google.com', { waitUntil: 'networkidle2' });

      return { success: true };
    });

    console.log('Action completed successfully:', result);

  } catch (error) {
    console.error('All retries failed:', error.message);
  }
}

// Example 9: Event listeners
async function exampleEventListeners() {
  console.log('\n=== Example 9: Event Listeners ===\n');

  // Listen to session events
  sessionManager.on('session:setup:started', ({ userId, service, loginUrl }) => {
    console.log(`[EVENT] Setup started for ${userId}/${service}`);
  });

  sessionManager.on('session:setup:complete', ({ userId, service }) => {
    console.log(`[EVENT] Setup complete for ${userId}/${service}`);
  });

  sessionManager.on('session:setup:failed', ({ userId, service, error }) => {
    console.error(`[EVENT] Setup failed for ${userId}/${service}: ${error}`);
  });

  sessionManager.on('session:created', ({ userId, service }) => {
    console.log(`[EVENT] Session created for ${userId}/${service}`);
  });

  sessionManager.on('session:disconnected', ({ userId, service }) => {
    console.log(`[EVENT] Session disconnected for ${userId}/${service}`);
  });

  sessionManager.on('session:cleared', ({ userId, service }) => {
    console.log(`[EVENT] Session cleared for ${userId}/${service}`);
  });

  console.log('Event listeners registered. Events will be logged as they occur.');
}

// Example 10: Graceful shutdown
async function exampleGracefulShutdown() {
  console.log('\n=== Example 10: Graceful Shutdown ===\n');

  // Register shutdown handlers
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await sessionManager.shutdown();
    console.log('All sessions closed');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await sessionManager.shutdown();
    console.log('All sessions closed');
    process.exit(0);
  });

  console.log('Shutdown handlers registered. Press Ctrl+C to test graceful shutdown.');
}

// Main function to run examples
async function main() {
  console.log('Phoenix Butler Session Manager - Examples');
  console.log('==========================================');

  // Register event listeners first
  exampleEventListeners();

  // Register shutdown handlers
  exampleGracefulShutdown();

  // Uncomment the examples you want to run:

  // await exampleGoogleSetup();
  // await exampleCheckGmail();
  // await exampleBanking();
  // await exampleDoorDash();
  // await exampleUber();
  // await exampleSessionManagement();
  // await exampleCustomService();
  // await exampleErrorHandling();

  console.log('\n==========================================');
  console.log('Examples complete!');
  console.log('\nTo run specific examples, uncomment them in the main() function.');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export examples for use elsewhere
module.exports = {
  exampleGoogleSetup,
  exampleCheckGmail,
  exampleBanking,
  exampleDoorDash,
  exampleUber,
  exampleSessionManagement,
  exampleCustomService,
  exampleErrorHandling,
  exampleEventListeners,
  exampleGracefulShutdown
};
