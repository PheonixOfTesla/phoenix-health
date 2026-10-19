# Phoenix Butler Session Manager

A production-ready, unified browser session manager for ANY website. User logs in once manually, Phoenix saves the session forever.

## Features

- **Universal Session Management**: Works with any website
- **Persistent Storage**: Per-user browser profiles stored locally
- **Stealth Mode**: Uses puppeteer-extra with stealth plugin to avoid bot detection
- **Automatic Session Validation**: Checks if sessions are still valid
- **Service-Specific Helpers**: Pre-configured for Google, Banking, Food Delivery, and Ride-sharing
- **Session Sharing**: Google services (Gmail, Drive, Calendar) share one session
- **Auto-Cleanup**: Removes inactive sessions after 30 minutes
- **Event Emitter**: Subscribe to session lifecycle events

## Installation

All dependencies are already included in the Phoenix backend `package.json`:

```json
{
  "puppeteer": "^24.27.0",
  "puppeteer-extra": "^3.3.6",
  "puppeteer-extra-plugin-stealth": "^2.11.2"
}
```

## Quick Start

```javascript
const sessionManager = require('./services/butler/sessionManager');

// Setup a new session (opens visible browser for user to login)
await sessionManager.setupSession('user123', 'google');

// Get logged-in session (headless)
const { browser, page } = await sessionManager.getSession('user123', 'google');

// Use the session
await page.goto('https://gmail.com');
const emails = await page.$$('.email-item');

// Check if session is still valid
const isValid = await sessionManager.checkSession('user123', 'google');

// Clear session
await sessionManager.clearSession('user123', 'google');
```

## API Reference

### Core Methods

#### `setupSession(userId, service, customLoginUrl, options)`

Opens a visible browser window for the user to login manually. Phoenix saves all cookies and session data.

**Parameters:**
- `userId` (string): User ID
- `service` (string): Service name (google, banking, doordash, ubereats, uber, lyft)
- `customLoginUrl` (string, optional): Custom login URL if service is not pre-configured
- `options` (object, optional):
  - `timeout` (number): Max time to wait for login (default: 10 minutes)
  - `successUrl` (string): URL pattern indicating successful login

**Returns:** `Promise<object>` - Session info

**Example:**
```javascript
// Pre-configured service
await sessionManager.setupSession('user123', 'google');

// Custom service
await sessionManager.setupSession(
  'user123',
  'mybank',
  'https://mybank.com/login',
  { timeout: 15 * 60 * 1000 }
);
```

---

#### `getSession(userId, service, headless)`

Returns an active logged-in browser session. Reuses existing session if available, or creates a new one from saved profile.

**Parameters:**
- `userId` (string): User ID
- `service` (string): Service name
- `headless` (boolean, optional): Run in headless mode (default: true)

**Returns:** `Promise<object>` - `{ browser, page }`

**Example:**
```javascript
const { browser, page } = await sessionManager.getSession('user123', 'google');

// Navigate to Gmail
await page.goto('https://gmail.com');

// Get emails
const unreadCount = await page.evaluate(() => {
  return document.querySelectorAll('.zE').length;
});

console.log(`Unread emails: ${unreadCount}`);
```

---

#### `checkSession(userId, service, browser, page)`

Verifies if a session is still valid by checking for session indicators.

**Parameters:**
- `userId` (string): User ID
- `service` (string): Service name
- `browser` (object, optional): Existing browser instance
- `page` (object, optional): Existing page instance

**Returns:** `Promise<boolean>` - True if session is valid

**Example:**
```javascript
const isValid = await sessionManager.checkSession('user123', 'google');

if (!isValid) {
  console.log('Session expired, please login again');
  await sessionManager.setupSession('user123', 'google');
}
```

---

#### `clearSession(userId, service)`

Removes saved session and browser profile. User will need to login again.

**Parameters:**
- `userId` (string): User ID
- `service` (string): Service name

**Returns:** `Promise<object>` - Result object

**Example:**
```javascript
await sessionManager.clearSession('user123', 'google');
```

---

### Service-Specific Helpers

#### Google Services

Gmail, Google Drive, Calendar, YouTube, and Photos all share one Google session.

```javascript
// Setup Google session
await sessionManager.setupGoogleSession('user123');

// Get Google session
const { browser, page } = await sessionManager.getGoogleSession('user123');

// Check Google session
const isValid = await sessionManager.checkGoogleSession('user123');

// Clear Google session
await sessionManager.clearGoogleSession('user123');
```

---

#### Banking

```javascript
// Setup banking session
await sessionManager.setupBankingSession(
  'user123',
  'Chase',
  'https://secure.chase.com/web/auth'
);

// Get banking session
const { browser, page } = await sessionManager.getBankingSession('user123', 'Chase');

// Navigate to accounts
await page.goto('https://secure.chase.com/web/auth/dashboard');

// Get account balance
const balance = await page.evaluate(() => {
  return document.querySelector('.account-balance')?.textContent;
});
```

---

#### Food Delivery

```javascript
// Setup DoorDash
await sessionManager.setupFoodDeliverySession('user123', 'doordash');

// Get DoorDash session
const { browser, page } = await sessionManager.getFoodDeliverySession('user123', 'doordash');

// Navigate to orders
await page.goto('https://www.doordash.com/orders/');

// Get recent orders
const orders = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.order-item')).map(item => ({
    restaurant: item.querySelector('.restaurant-name')?.textContent,
    date: item.querySelector('.order-date')?.textContent
  }));
});
```

**Supported platforms:** `doordash`, `ubereats`

---

#### Ride-sharing

```javascript
// Setup Uber
await sessionManager.setupRideSession('user123', 'uber');

// Get Uber session
const { browser, page } = await sessionManager.getRideSession('user123', 'uber');

// Navigate to trips
await page.goto('https://riders.uber.com/trips');

// Get trip history
const trips = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.trip-item')).map(item => ({
    destination: item.querySelector('.destination')?.textContent,
    date: item.querySelector('.trip-date')?.textContent
  }));
});
```

**Supported platforms:** `uber`, `lyft`

---

### Utility Methods

#### `getActiveSessions()`

Returns list of all currently active sessions.

**Returns:** `Array<object>`

**Example:**
```javascript
const sessions = sessionManager.getActiveSessions();

console.log(sessions);
// [
//   {
//     userId: 'user123',
//     service: 'google',
//     lastActivity: 2025-12-19T22:30:00.000Z,
//     isConnected: true
//   }
// ]
```

---

#### `shutdown()`

Cleanup all sessions and shutdown manager. Call this during graceful shutdown.

**Example:**
```javascript
process.on('SIGTERM', async () => {
  await sessionManager.shutdown();
  process.exit(0);
});
```

---

## Events

SessionManager extends EventEmitter and emits the following events:

```javascript
// Session setup started
sessionManager.on('session:setup:started', ({ userId, service, loginUrl }) => {
  console.log(`User ${userId} is setting up ${service}`);
});

// Session setup completed
sessionManager.on('session:setup:complete', ({ userId, service }) => {
  console.log(`Session ready for ${userId}/${service}`);
});

// Session setup failed
sessionManager.on('session:setup:failed', ({ userId, service, error }) => {
  console.error(`Setup failed for ${userId}/${service}: ${error}`);
});

// New session created
sessionManager.on('session:created', ({ userId, service }) => {
  console.log(`New session created for ${userId}/${service}`);
});

// Session disconnected
sessionManager.on('session:disconnected', ({ userId, service }) => {
  console.log(`Session disconnected for ${userId}/${service}`);
});

// Session cleared
sessionManager.on('session:cleared', ({ userId, service }) => {
  console.log(`Session cleared for ${userId}/${service}`);
});
```

---

## Configuration

### Pre-configured Services

The session manager comes with pre-configured settings for:

- **Google** (gmail, drive, calendar, youtube, photos)
- **DoorDash**
- **Uber Eats**
- **Uber**
- **Lyft**
- **Banking** (generic)

### Adding Custom Services

To add a new service, modify the `SERVICE_CONFIG` object:

```javascript
const SERVICE_CONFIG = {
  netflix: {
    loginUrl: 'https://www.netflix.com/login',
    sessionCheckUrl: 'https://www.netflix.com/browse',
    sessionCheckSelector: '.profile-icon',
    viewport: { width: 1920, height: 1080 }
  }
};
```

---

## Storage

Browser profiles are stored in:
```
./data/browser-profiles/{userId}/{service}/
```

Each profile contains:
- Cookies
- Local storage
- Session storage
- IndexedDB
- Cache

**Important:** Backup this directory to preserve user sessions!

---

## Security Considerations

1. **Protect profile directory**: Ensure proper file permissions
2. **Encrypt at rest**: Consider encrypting browser profiles
3. **Secure transmission**: Use HTTPS for all requests
4. **User consent**: Always get user permission before accessing their accounts
5. **Data minimization**: Only access what's needed
6. **Audit logging**: Log all session access for security

---

## Error Handling

All methods throw errors that should be caught:

```javascript
try {
  const { browser, page } = await sessionManager.getSession('user123', 'google');
  // Use session
} catch (error) {
  if (error.message.includes('No saved session found')) {
    // User needs to login
    await sessionManager.setupSession('user123', 'google');
  } else if (error.message.includes('Session expired')) {
    // Session expired, need to re-login
    await sessionManager.setupSession('user123', 'google');
  } else {
    // Other error
    console.error('Session error:', error);
  }
}
```

---

## Best Practices

### 1. Session Lifecycle

```javascript
// Setup once
await sessionManager.setupSession('user123', 'google');

// Use many times
const { browser, page } = await sessionManager.getSession('user123', 'google');

// Cleanup when done
await sessionManager.clearSession('user123', 'google');
```

### 2. Session Validation

```javascript
// Always check before use
const isValid = await sessionManager.checkSession('user123', 'google');

if (!isValid) {
  await sessionManager.setupSession('user123', 'google');
}

const { browser, page } = await sessionManager.getSession('user123', 'google');
```

### 3. Error Recovery

```javascript
async function withSessionRetry(userId, service, action) {
  try {
    const { browser, page } = await sessionManager.getSession(userId, service);
    return await action(browser, page);
  } catch (error) {
    if (error.message.includes('Session expired')) {
      // Re-login and retry
      await sessionManager.setupSession(userId, service);
      const { browser, page } = await sessionManager.getSession(userId, service);
      return await action(browser, page);
    }
    throw error;
  }
}

// Usage
const emails = await withSessionRetry('user123', 'google', async (browser, page) => {
  await page.goto('https://gmail.com');
  return await page.$$('.email-item');
});
```

### 4. Cleanup on Shutdown

```javascript
// In server.js or main app file
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await sessionManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await sessionManager.shutdown();
  process.exit(0);
});
```

---

## Troubleshooting

### Session not persisting

**Issue:** Session is lost after browser restart

**Solution:** Ensure profile directory has write permissions:
```bash
chmod -R 755 ./data/browser-profiles
```

---

### Bot detection

**Issue:** Website blocks automated access

**Solution:** The stealth plugin is already enabled, but you can also:
- Add random delays between actions
- Randomize mouse movements
- Use residential proxies

```javascript
// Add delays
await page.waitForTimeout(Math.random() * 2000 + 1000);

// Human-like typing
await page.type('#username', 'user@example.com', { delay: 100 });
```

---

### Memory leaks

**Issue:** Browser sessions consuming too much memory

**Solution:** Sessions auto-close after 30 minutes of inactivity. Adjust timeout:

```javascript
// In sessionManager.js
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
```

---

### Login timeout

**Issue:** User doesn't complete login in time

**Solution:** Increase timeout:

```javascript
await sessionManager.setupSession('user123', 'google', null, {
  timeout: 20 * 60 * 1000 // 20 minutes
});
```

---

## Examples

### Complete Gmail Automation

```javascript
const sessionManager = require('./services/butler/sessionManager');

async function checkGmail(userId) {
  try {
    // Ensure session is valid
    const isValid = await sessionManager.checkGoogleSession(userId);

    if (!isValid) {
      console.log('Session expired, please login again');
      await sessionManager.setupGoogleSession(userId);
    }

    // Get session
    const { browser, page } = await sessionManager.getGoogleSession(userId);

    // Navigate to Gmail
    await page.goto('https://mail.google.com/mail/u/0/#inbox', {
      waitUntil: 'networkidle2'
    });

    // Wait for emails to load
    await page.waitForSelector('.zA', { timeout: 10000 });

    // Get unread emails
    const emails = await page.evaluate(() => {
      const emailElements = document.querySelectorAll('.zA.zE');

      return Array.from(emailElements).slice(0, 10).map(email => {
        const subject = email.querySelector('.bog')?.textContent || '';
        const sender = email.querySelector('.yW')?.textContent || '';
        const time = email.querySelector('.xW')?.textContent || '';

        return { sender, subject, time };
      });
    });

    console.log(`Found ${emails.length} unread emails`);
    return emails;

  } catch (error) {
    console.error('Gmail check failed:', error);
    throw error;
  }
}

// Usage
checkGmail('user123').then(emails => {
  emails.forEach(email => {
    console.log(`From: ${email.sender}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Time: ${email.time}`);
    console.log('---');
  });
});
```

---

### Banking Transaction History

```javascript
async function getBankTransactions(userId) {
  try {
    const { browser, page } = await sessionManager.getBankingSession(userId, 'Chase');

    // Navigate to transactions
    await page.goto('https://secure.chase.com/web/auth/dashboard#/dashboard/transactions', {
      waitUntil: 'networkidle2'
    });

    // Wait for transactions to load
    await page.waitForSelector('.transaction-row', { timeout: 10000 });

    // Get transactions
    const transactions = await page.evaluate(() => {
      const rows = document.querySelectorAll('.transaction-row');

      return Array.from(rows).slice(0, 20).map(row => ({
        date: row.querySelector('.transaction-date')?.textContent.trim(),
        description: row.querySelector('.transaction-description')?.textContent.trim(),
        amount: row.querySelector('.transaction-amount')?.textContent.trim()
      }));
    });

    return transactions;

  } catch (error) {
    console.error('Failed to get transactions:', error);
    throw error;
  }
}
```

---

### DoorDash Order Tracking

```javascript
async function getRecentOrders(userId) {
  try {
    const { browser, page } = await sessionManager.getFoodDeliverySession(userId, 'doordash');

    // Navigate to orders
    await page.goto('https://www.doordash.com/orders/', {
      waitUntil: 'networkidle2'
    });

    // Wait for orders to load
    await page.waitForSelector('[data-anchor-id="OrderCard"]', { timeout: 10000 });

    // Get orders
    const orders = await page.evaluate(() => {
      const orderCards = document.querySelectorAll('[data-anchor-id="OrderCard"]');

      return Array.from(orderCards).slice(0, 10).map(card => ({
        restaurant: card.querySelector('[data-anchor-id="MerchantName"]')?.textContent.trim(),
        status: card.querySelector('[data-anchor-id="OrderStatus"]')?.textContent.trim(),
        items: card.querySelector('[data-anchor-id="OrderItems"]')?.textContent.trim()
      }));
    });

    return orders;

  } catch (error) {
    console.error('Failed to get orders:', error);
    throw error;
  }
}
```

---

## License

MIT - Part of Phoenix Personal Operating System

---

## Support

For issues or questions, contact the Phoenix development team.
