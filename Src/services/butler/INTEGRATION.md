# Phoenix Butler - Integration Guide

This guide shows how to integrate the Butler session manager into your Phoenix backend.

## What's Included

The Butler service now includes two complementary browser automation tools:

### 1. Session Manager (NEW)
**File:** `sessionManager.js`

**Purpose:** Long-term session persistence for ANY website. User logs in once, Phoenix remembers forever.

**Use Cases:**
- Gmail automation
- Banking account access
- Food delivery (DoorDash, Uber Eats)
- Ride-sharing (Uber, Lyft)
- Any service requiring persistent authentication

**Key Features:**
- Per-user browser profiles with persistent cookies
- Stealth mode to avoid bot detection
- Automatic session validation
- 30-minute inactivity timeout
- Event emitters for lifecycle tracking

### 2. Browserless Service (EXISTING)
**File:** `browserless.js`

**Purpose:** Hosted browser automation with live viewing capabilities.

**Use Cases:**
- Temporary browser sessions
- Live debugging (watch browser in real-time)
- Web scraping tasks
- Screenshot capture
- PDF generation

**Key Features:**
- Cloud-hosted browsers (6 hours free/month)
- Live view URLs for debugging
- Automatic fallback to local Puppeteer
- Session management with auto-cleanup

---

## When to Use Which?

### Use Session Manager When:
- You need persistent login sessions
- User needs to authenticate manually (2FA, CAPTCHA)
- Sessions should survive server restarts
- You want to save cookies and local storage
- Examples: Gmail, Banking, Food Delivery

### Use Browserless When:
- You need temporary browser automation
- You want to watch the browser in real-time
- You're doing web scraping (no login needed)
- You need cloud-hosted browsers
- Examples: Scraping, Screenshots, PDF generation

---

## Quick Start

### Session Manager Setup

```javascript
const sessionManager = require('./services/butler/sessionManager');

// Setup Google session (user logs in manually once)
await sessionManager.setupGoogleSession('user123');

// Use session anytime (headless, automatic)
const { browser, page } = await sessionManager.getGoogleSession('user123');
await page.goto('https://gmail.com');

// Session persists across server restarts!
```

### Browserless Setup

```javascript
const { execute } = require('./services/butler/browserless');

// Execute a task with automatic cleanup
const result = await execute(async (browser, sessionInfo) => {
  console.log('Watch live:', sessionInfo.liveViewUrl);

  const page = await browser.newPage();
  await page.goto('https://example.com');

  return await page.title();
});
```

---

## Integration into Phoenix

### Step 1: Add Routes to server.js

```javascript
// In server.js, add butler routes

const { setupButlerRoutes, setupShutdownHandlers } = require('./Src/services/butler/controller-example');

// Setup routes
setupButlerRoutes(app);

// Setup graceful shutdown
setupShutdownHandlers();

console.log('[Butler] Service initialized');
```

### Step 2: Create Butler Controller

Create `/Src/controllers/butlerController.js`:

```javascript
const sessionManager = require('../services/butler/sessionManager');

class ButlerController {
  // Gmail
  async setupGmail(req, res) {
    try {
      const userId = req.user.id;
      await sessionManager.setupGoogleSession(userId);

      res.json({
        success: true,
        message: 'Gmail connected successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async checkGmail(req, res) {
    try {
      const userId = req.user.id;
      const { browser, page } = await sessionManager.getGoogleSession(userId);

      await page.goto('https://mail.google.com/mail/u/0/#inbox');

      const unreadCount = await page.evaluate(() => {
        const elem = document.querySelector('.aio.UKr6le');
        return elem ? parseInt(elem.textContent) : 0;
      });

      res.json({
        success: true,
        unreadCount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Banking
  async setupBank(req, res) {
    try {
      const userId = req.user.id;
      const { bankName, loginUrl } = req.body;

      await sessionManager.setupBankingSession(userId, bankName, loginUrl);

      res.json({
        success: true,
        message: `${bankName} connected successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Food Delivery
  async setupDoorDash(req, res) {
    try {
      const userId = req.user.id;
      await sessionManager.setupFoodDeliverySession(userId, 'doordash');

      res.json({
        success: true,
        message: 'DoorDash connected successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ButlerController();
```

### Step 3: Add Routes

Create `/Src/routes/butler.js`:

```javascript
const express = require('express');
const router = express.Router();
const butlerController = require('../controllers/butlerController');
const { authenticateToken } = require('../middleware/auth');

// All butler routes require authentication
router.use(authenticateToken);

// Gmail routes
router.post('/gmail/setup', butlerController.setupGmail);
router.get('/gmail/check', butlerController.checkGmail);

// Banking routes
router.post('/banking/setup', butlerController.setupBank);

// Food delivery routes
router.post('/food/doordash/setup', butlerController.setupDoorDash);

module.exports = router;
```

### Step 4: Register Routes in server.js

```javascript
// In server.js
const butlerRoutes = require('./Src/routes/butler');

app.use('/api/butler', butlerRoutes);
```

---

## Advanced Usage

### Event Listeners

Monitor session lifecycle events:

```javascript
const sessionManager = require('./services/butler/sessionManager');

sessionManager.on('session:setup:complete', ({ userId, service }) => {
  // Notify user that setup is complete
  io.to(userId).emit('butler:connected', { service });
});

sessionManager.on('session:disconnected', ({ userId, service }) => {
  // Notify user that session expired
  io.to(userId).emit('butler:disconnected', { service });
});
```

### Error Handling with Retry

```javascript
async function withRetry(action, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      if (error.message.includes('Session expired') && i < maxRetries - 1) {
        // Re-authenticate and retry
        await sessionManager.setupGoogleSession(userId);
      } else {
        throw error;
      }
    }
  }
}

// Usage
const emails = await withRetry(async () => {
  const { browser, page } = await sessionManager.getGoogleSession(userId);
  await page.goto('https://gmail.com');
  return await page.$$('.email-item');
});
```

### Custom Services

Add support for any website:

```javascript
// Netflix example
await sessionManager.setupSession(
  'user123',
  'netflix',
  'https://www.netflix.com/login',
  {
    timeout: 10 * 60 * 1000, // 10 minutes for login
    successUrl: '/browse' // Redirect after login
  }
);

// Use Netflix session
const { browser, page } = await sessionManager.getSession('user123', 'netflix');
await page.goto('https://www.netflix.com/browse');
```

---

## Frontend Integration

### Setup Flow (User Perspective)

1. User clicks "Connect Gmail" in Phoenix app
2. Backend calls `setupGoogleSession(userId)`
3. **Browser window opens automatically**
4. User logs into Google manually (handles 2FA, CAPTCHA, etc.)
5. User closes browser when done
6. Phoenix saves the session forever
7. All future Gmail operations are automatic (headless)

### Frontend API Calls

```javascript
// React/Frontend example

// Step 1: Request setup
async function connectGmail() {
  try {
    const response = await fetch('/api/butler/gmail/setup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      alert('Browser opened! Please login to Gmail.');
      // Browser window opened on server side
      // User logs in manually
    }
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Step 2: Use the connected service
async function checkGmail() {
  try {
    const response = await fetch('/api/butler/gmail/check', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      console.log(`You have ${data.unreadCount} unread emails`);
    } else if (data.requiresSetup) {
      // Session expired, need to reconnect
      await connectGmail();
    }
  } catch (error) {
    console.error('Check failed:', error);
  }
}
```

---

## Production Considerations

### Security

1. **Protect browser profiles:**
   ```bash
   chmod 700 ./Src/services/butler/data/browser-profiles
   ```

2. **Encrypt sensitive data:**
   - Consider encrypting browser profiles at rest
   - Use environment variables for secrets
   - Never commit the `data/` directory

3. **User consent:**
   - Always get explicit user permission
   - Show clear privacy policy
   - Allow users to disconnect services

### Performance

1. **Session timeouts:**
   - Default: 30 minutes of inactivity
   - Adjust in `sessionManager.js` if needed

2. **Memory management:**
   - Sessions auto-close after timeout
   - Graceful shutdown on server restart
   - Monitor with `getActiveSessions()`

3. **Headless mode:**
   - Setup: headless=false (user sees browser)
   - Usage: headless=true (background automation)

### Monitoring

```javascript
// Health check endpoint
app.get('/api/butler/health', (req, res) => {
  const sessions = sessionManager.getActiveSessions();

  res.json({
    status: 'healthy',
    activeSessions: sessions.length,
    sessions: sessions.map(s => ({
      service: s.service,
      userId: s.userId,
      connected: s.isConnected,
      lastActivity: s.lastActivity
    }))
  });
});
```

---

## Debugging

### Enable Verbose Logging

The session manager logs all operations. Watch logs:

```bash
# In development
npm run dev

# Look for:
# [SessionManager] Setting up session for user123/google
# [SessionManager] Browser launched for user123/google
# [SessionManager] Session setup complete for user123/google
```

### Test Individual Components

```bash
# Run test suite
cd /Users/moderndavinci/Desktop/Phoenix/pal-backend
node Src/services/butler/test.js

# Run examples
node Src/services/butler/example.js
```

### Common Issues

**Issue:** Session not persisting

**Solution:**
```bash
# Check profile directory exists and is writable
ls -la Src/services/butler/data/browser-profiles
chmod -R 755 Src/services/butler/data/browser-profiles
```

**Issue:** Bot detection / CAPTCHA

**Solution:**
- Stealth plugin is already enabled
- For manual login (setupSession), user solves CAPTCHA
- Add delays between actions:
  ```javascript
  await page.waitForTimeout(Math.random() * 2000 + 1000);
  ```

**Issue:** Memory leaks

**Solution:**
- Sessions auto-close after 30 minutes
- Call `shutdown()` on server restart
- Monitor with `getActiveSessions()`

---

## Examples

See these files for complete examples:

- **Basic Usage:** `example.js`
- **Controller Integration:** `controller-example.js`
- **Test Suite:** `test.js`
- **Full Documentation:** `README.md`

---

## API Reference

### Core Methods

- `setupSession(userId, service, [loginUrl], [options])` - Setup new session
- `getSession(userId, service, [headless])` - Get logged-in session
- `checkSession(userId, service)` - Verify session validity
- `clearSession(userId, service)` - Remove session

### Service Helpers

- `setupGoogleSession(userId)` - Setup Google (Gmail, Drive, Calendar)
- `setupBankingSession(userId, bankName, loginUrl)` - Setup bank
- `setupFoodDeliverySession(userId, platform)` - Setup DoorDash/UberEats
- `setupRideSession(userId, platform)` - Setup Uber/Lyft

### Utility Methods

- `getActiveSessions()` - List all active sessions
- `shutdown()` - Cleanup all sessions

---

## Support

For issues or questions:
1. Check `README.md` for full documentation
2. Review examples in `example.js`
3. Run test suite: `node test.js`
4. Contact Phoenix development team

---

**Built with love for the Phoenix Personal Operating System**
