# Universal Agent - Quick Reference

## One-Line Execution

```javascript
const universalAgent = require('./services/butler/universalAgent');

// Execute ANY task
await universalAgent.executeTask(userId, "Create a Facebook account");
await universalAgent.executeTask(userId, "Book a flight to Miami");
await universalAgent.executeTask(userId, "Order pizza from Domino's");
await universalAgent.executeTask(userId, "Send $50 to John on Venmo");
```

---

## Key Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `executeTask(userId, task, options)` | Execute any browser task | `await universalAgent.executeTask(userId, "Order groceries")` |
| `planTask(task, userId)` | Preview execution plan | `await universalAgent.planTask("Book hotel", userId)` |
| `findElement(page, description, userId, sessionId)` | Vision-based element detection | `await universalAgent.findElement(page, "sign up button", userId, sid)` |
| `getSessionStatus(sessionId)` | Check running task status | `universalAgent.getSessionStatus(sessionId)` |
| `getLiveScreenshot(sessionId)` | Get real-time screenshot | `await universalAgent.getLiveScreenshot(sessionId)` |
| `stopSession(sessionId)` | Cancel running task | `await universalAgent.stopSession(sessionId)` |

---

## Options

```javascript
{
  confirmed: true,        // Skip confirmation for risky tasks
  headless: false,        // Show browser (default: true)
  learn: true,           // Save workflow after success (default: true)
  timeout: 60000         // Custom timeout per step
}
```

---

## Events

```javascript
universalAgent.on('task:started', ({ userId, sessionId, taskDescription }) => {});
universalAgent.on('task:planned', ({ userId, sessionId, plan }) => {});
universalAgent.on('step:started', ({ userId, sessionId, step }) => {});
universalAgent.on('step:completed', ({ userId, sessionId, step, result }) => {});
universalAgent.on('screenshot', ({ userId, sessionId, stepNumber, screenshot }) => {});
universalAgent.on('task:completed', ({ userId, sessionId, success, executionTime }) => {});
universalAgent.on('task:failed', ({ userId, sessionId, error }) => {});
universalAgent.on('workflow:learned', ({ userId, workflowId, name }) => {});
```

---

## Response Format

```javascript
{
  success: true,                    // Task succeeded
  message: "Successfully completed", // User-friendly message
  sessionId: "universal_123",       // Session identifier
  executionTime: 12450,             // Time in milliseconds
  steps: [                          // Individual step results
    {
      stepNumber: 1,
      success: true,
      description: "Navigate to site",
      screenshot: "base64...",
      duration: 2340
    }
  ],
  finalScreenshot: "base64...",    // Final page state
  learned: true                     // Workflow saved for reuse
}
```

---

## Plan Format

```javascript
{
  goal: "Book flight to Miami",
  service: "Google Flights",
  url: "https://google.com/flights",
  requiresAuth: false,
  credentialKey: null,
  steps: [
    {
      stepNumber: 1,
      action: "navigate",
      description: "Go to Google Flights",
      target: { type: "url", value: "..." },
      waitAfter: 2000,
      screenshot: true,
      critical: true
    }
  ],
  summary: "Search for flights to Miami",
  estimatedTime: "1-2 minutes",
  needsConfirmation: false,
  riskLevel: "low"
}
```

---

## Step Actions

| Action | Description | Example |
|--------|-------------|---------|
| `navigate` | Go to URL | `{ action: "navigate", target: { type: "url", value: "google.com" }}` |
| `click` | Click element | `{ action: "click", target: { type: "description", value: "sign up button" }}` |
| `type` | Type text | `{ action: "type", target: { value: "email field" }, input: "user@email.com" }` |
| `wait` | Pause execution | `{ action: "wait", input: 2000 }` |
| `scroll` | Scroll page | `{ action: "scroll" }` |
| `screenshot` | Capture screen | `{ action: "screenshot" }` |
| `verify` | Check element exists | `{ action: "verify", target: { type: "selector", value: ".success" }}` |

---

## Target Types

```javascript
// URL
{ type: "url", value: "https://example.com" }

// CSS Selector (fast but fragile)
{ type: "selector", value: "#signup-button" }

// Natural Language (slow but flexible)
{ type: "description", value: "blue sign up button with white text" }
```

---

## Risk Levels

| Level | Example Tasks | Requires Confirmation |
|-------|--------------|----------------------|
| **Low** | Search, browse, screenshot | No |
| **Medium** | Data entry, form submission | No |
| **High** | Financial transactions, account changes | Yes |

---

## Credential Storage

```javascript
// In User model
user.butlerCredentials = {
  facebook: {
    username: "user@email.com",
    password: "encrypted_password",
    loginUrl: "https://facebook.com/login"
  },
  venmo: {
    username: "user@email.com",
    password: "encrypted_password",
    loginUrl: "https://venmo.com/account/sign-in"
  }
};

await user.save();
```

---

## Common Patterns

### Execute with Error Handling

```javascript
try {
  const result = await universalAgent.executeTask(userId, task);

  if (result.success) {
    console.log('Success:', result.message);
  } else {
    console.error('Failed:', result.message);
  }
} catch (error) {
  console.error('Exception:', error.message);
}
```

### Execute with Live Monitoring

```javascript
universalAgent.on('step:completed', ({ step, result }) => {
  console.log(`Step ${step.stepNumber}: ${result.success ? '✓' : '✗'}`);
});

const result = await universalAgent.executeTask(userId, task);
```

### Execute with Confirmation

```javascript
const preview = await universalAgent.executeTask(userId, task);

if (preview.needsConfirmation) {
  // Ask user
  const confirmed = await askUser(preview.confirmationPrompt);

  if (confirmed) {
    const result = await universalAgent.executeTask(
      userId,
      task,
      { confirmed: true }
    );
  }
}
```

### Execute and Stream Screenshots

```javascript
universalAgent.on('screenshot', ({ screenshot }) => {
  io.emit('butler:screenshot', screenshot);
});

const result = await universalAgent.executeTask(userId, task);
```

---

## Performance Benchmarks

| Scenario | First Time | Learned | Speedup |
|----------|-----------|---------|---------|
| Social signup | 25-35s | 8-12s | 3x |
| Food order | 30-45s | 5-10s | 5x |
| Flight search | 20-30s | 6-10s | 3x |
| Money transfer | 15-25s | 4-8s | 4x |

---

## Limitations

- ❌ Cannot bypass CAPTCHAs
- ❌ Cannot handle 2FA automatically
- ❌ Max 50 steps per task
- ❌ Vision accuracy: 85-95%
- ✅ Works on any website
- ✅ Learns from successful executions
- ✅ Handles dynamic page layouts
- ✅ Securely manages credentials

---

## Debugging

```javascript
// Enable detailed logging
process.env.DEBUG = 'universal-agent';

// Listen to all events
universalAgent.on('*', (event, data) => {
  console.log('[Event]', event, data);
});

// Get session details
const status = universalAgent.getSessionStatus(sessionId);
console.log('Session:', status);

// Get live screenshot
const screenshot = await universalAgent.getLiveScreenshot(sessionId);
console.log('Screenshot size:', screenshot.length);
```

---

## Production Checklist

- [ ] Set `ANTHROPIC_API_KEY` in environment
- [ ] Configure rate limiting (10 tasks/min per user)
- [ ] Enable headless mode in production
- [ ] Set up error monitoring (Sentry)
- [ ] Configure database indexes for LearnedWorkflow
- [ ] Implement user authentication
- [ ] Add request logging
- [ ] Set up screenshot storage (S3)
- [ ] Configure timeout limits
- [ ] Test in staging environment

---

## Support & Troubleshooting

**Task fails immediately:**
- Check AI provider (Claude) is configured
- Verify user credentials if auth required
- Review plan with `planTask()` first

**Vision can't find element:**
- Element might be in iframe
- Page might still be loading
- Try more specific description
- Check screenshot in step results

**Authentication fails:**
- Verify credentials in user vault
- Check login URL is correct
- 2FA might be required (manual)

**Workflow not learned:**
- Task must complete successfully
- `learn` option must be true (default)
- Check LearnedWorkflow collection

---

**Need help? Check the full guide: `UNIVERSAL_AGENT_GUIDE.md`**
