# Phoenix Butler - Universal Agent

## The Ultimate Browser Automation Engine

The Universal Agent is Phoenix's most powerful automation system. It can execute **ANY browser task** by combining:

1. **AI Planning** - Claude decomposes tasks into executable steps
2. **Vision Execution** - AI vision finds and interacts with elements
3. **Smart Learning** - Successful workflows are saved for instant replay
4. **Credential Management** - Securely uses user's saved credentials
5. **Live Monitoring** - Real-time screenshot streaming and progress events

---

## Quick Start

```javascript
const universalAgent = require('./services/butler/universalAgent');

// Execute any task with a single line
const result = await universalAgent.executeTask(
  userId,
  "Create a Facebook account"
);

console.log(result.success); // true
console.log(result.message); // "Successfully completed: Create Facebook account"
```

---

## How It Works

### Step 1: AI Planning

The agent sends your request to Claude with context about available credentials:

```
User Request: "Book a flight to Miami next Tuesday"

AI generates:
{
  "goal": "Book flight to Miami",
  "service": "Google Flights",
  "url": "https://www.google.com/travel/flights",
  "steps": [
    { "action": "navigate", "target": { "value": "google.com/travel/flights" } },
    { "action": "click", "target": { "value": "one-way button" } },
    { "action": "type", "target": { "value": "destination field" }, "input": "Miami" },
    { "action": "click", "target": { "value": "date picker" } },
    { "action": "click", "target": { "value": "next Tuesday date" } },
    { "action": "click", "target": { "value": "search button" } },
    { "action": "screenshot" }
  ]
}
```

### Step 2: Vision-Based Execution

For each step, the agent:

1. **Takes a screenshot** of the current page
2. **Sends to AI vision** with the element description
3. **Receives coordinates** of where to click/type
4. **Executes the action** with pixel-perfect accuracy

```javascript
// Vision finds "Sign Up button" on page
const element = await findElement(page, "sign up button");
// Returns: { x: 640, y: 450, confidence: 0.95 }

await page.mouse.click(element.x, element.y);
```

### Step 3: Learning & Optimization

After successful execution:

1. **Workflow is saved** to MongoDB
2. **Next time** same request comes in → instant execution
3. **No AI calls needed** - just replay the steps

```javascript
// First time: 30 seconds (AI planning + vision)
await universalAgent.executeTask(userId, "Order pizza from Domino's");

// Second time: 5 seconds (just execute learned workflow)
await universalAgent.executeTask(userId, "Order pizza from Domino's");
```

---

## Real-World Examples

### Example 1: Create Social Media Account

```javascript
const result = await universalAgent.executeTask(
  userId,
  "Create a Facebook account"
);

// Behind the scenes:
// 1. Navigate to facebook.com/r.php
// 2. Find email field using vision
// 3. Type user's email from profile
// 4. Find password field using vision
// 5. Generate secure password
// 6. Find name fields using vision
// 7. Type user's name
// 8. Find sign up button using vision
// 9. Click to create account
// 10. Screenshot for verification
```

### Example 2: Book Travel

```javascript
const result = await universalAgent.executeTask(
  userId,
  "Book a hotel in NYC for Dec 25-27",
  { confirmed: true }
);

// AI Plan:
// 1. Navigate to booking.com
// 2. Type "New York City" in destination
// 3. Click check-in date picker
// 4. Select Dec 25
// 5. Click check-out date picker
// 6. Select Dec 27
// 7. Click search
// 8. Filter by price (low to high)
// 9. Screenshot top 5 options
```

### Example 3: Send Money

```javascript
const result = await universalAgent.executeTask(
  userId,
  "Send $50 to John on Venmo",
  { confirmed: true }
);

// Uses credentials from user's vault:
// 1. Navigate to venmo.com
// 2. Login using saved credentials
// 3. Click "Pay or Request"
// 4. Type "John" in recipient field
// 5. Select John from autocomplete
// 6. Type "50" in amount field
// 7. Click Pay button
// 8. Confirm transaction
```

### Example 4: Order Food

```javascript
const result = await universalAgent.executeTask(
  userId,
  "Order my usual from Chipotle"
);

// Smart context awareness:
// - Checks user's order history
// - Finds "usual" order
// - Executes learned workflow
// - Completes in 10 seconds
```

---

## API Reference

### `executeTask(userId, taskDescription, options)`

Main entry point for executing any browser task.

**Parameters:**
- `userId` (String) - User ID
- `taskDescription` (String) - Natural language task description
- `options` (Object) - Optional configuration
  - `confirmed` (Boolean) - Skip confirmation for risky tasks
  - `headless` (Boolean) - Run browser in headless mode (default: true)
  - `learn` (Boolean) - Save workflow after success (default: true)

**Returns:**
```javascript
{
  success: true,
  message: "Successfully completed: Create Facebook account",
  sessionId: "universal_1234567890_abc123",
  executionTime: 12450,
  steps: [
    { stepNumber: 1, success: true, duration: 2340, screenshot: "..." },
    { stepNumber: 2, success: true, duration: 1890, screenshot: "..." }
  ],
  finalScreenshot: "base64...",
  learned: true
}
```

### `planTask(taskDescription, userId, options)`

Generate execution plan without executing.

**Returns:**
```javascript
{
  goal: "Book flight to Miami",
  service: "Google Flights",
  url: "https://www.google.com/travel/flights",
  requiresAuth: false,
  steps: [...],
  summary: "Search and display flight options to Miami",
  estimatedTime: "1-2 minutes",
  needsConfirmation: false,
  riskLevel: "low"
}
```

### `findElement(page, description, userId, sessionId)`

Use AI vision to find element on page.

**Parameters:**
- `page` (Page) - Puppeteer page instance
- `description` (String) - Natural language element description
- `userId` (String) - User ID for AI calls
- `sessionId` (String) - Session ID for events

**Returns:**
```javascript
{
  x: 640,
  y: 450,
  confidence: 0.95
}
```

### `getSessionStatus(sessionId)`

Get real-time status of running automation.

**Returns:**
```javascript
{
  sessionId: "universal_1234567890_abc123",
  status: "running",
  userId: "user123",
  goal: "Create Facebook account",
  uptime: 8450,
  currentUrl: "https://www.facebook.com/r.php"
}
```

### `getLiveScreenshot(sessionId)`

Get current screenshot of running automation.

**Returns:** Base64 encoded screenshot string

### `stopSession(sessionId)`

Cancel running automation.

**Returns:** Boolean (true if stopped successfully)

---

## Events

The Universal Agent emits events for real-time monitoring:

```javascript
universalAgent.on('task:started', ({ userId, sessionId, taskDescription }) => {
  console.log(`Task started: ${taskDescription}`);
});

universalAgent.on('task:planned', ({ userId, sessionId, plan }) => {
  console.log(`Plan generated: ${plan.steps.length} steps`);
});

universalAgent.on('step:started', ({ userId, sessionId, step }) => {
  console.log(`Step ${step.stepNumber}: ${step.description}`);
});

universalAgent.on('step:completed', ({ userId, sessionId, step, result }) => {
  console.log(`Step ${step.stepNumber} completed: ${result.success}`);
});

universalAgent.on('screenshot', ({ userId, sessionId, stepNumber, screenshot }) => {
  // Stream screenshot to frontend for live view
  io.to(userId).emit('butler:screenshot', { stepNumber, screenshot });
});

universalAgent.on('task:completed', ({ userId, sessionId, success, executionTime }) => {
  console.log(`Task completed: ${success} in ${executionTime}ms`);
});

universalAgent.on('task:failed', ({ userId, sessionId, error }) => {
  console.error(`Task failed: ${error}`);
});

universalAgent.on('workflow:learned', ({ userId, workflowId, name }) => {
  console.log(`New workflow learned: ${name}`);
});
```

---

## Integration with Phoenix

### 1. Voice Command Integration

```javascript
// In phoenixMind.js
const universalAgent = require('./services/butler/universalAgent');

// When user says something Butler can handle
if (intent === 'BUTLER_ACTION') {
  const result = await universalAgent.executeTask(userId, userMessage);

  return {
    response: result.message,
    screenshot: result.finalScreenshot,
    learned: result.learned
  };
}
```

### 2. API Endpoint

```javascript
// In routes/butler.js
router.post('/execute', async (req, res) => {
  const { userId, task, options } = req.body;

  const result = await universalAgent.executeTask(userId, task, options);

  res.json(result);
});
```

### 3. WebSocket Live View

```javascript
// In controllers/butlerController.js
const universalAgent = require('../services/butler/universalAgent');

// Stream screenshots in real-time
universalAgent.on('screenshot', ({ userId, screenshot }) => {
  io.to(userId).emit('butler:screenshot', screenshot);
});

// Stream progress updates
universalAgent.on('step:completed', ({ userId, step, result }) => {
  io.to(userId).emit('butler:progress', {
    step: step.stepNumber,
    description: step.description,
    success: result.success
  });
});
```

---

## Credential Management

### Storing Credentials

Users connect services once, credentials saved in encrypted vault:

```javascript
// In User model
{
  butlerCredentials: {
    facebook: {
      username: "user@email.com",
      password: "encrypted_password",
      loginUrl: "https://www.facebook.com/login"
    },
    venmo: {
      username: "user@email.com",
      password: "encrypted_password",
      loginUrl: "https://venmo.com/account/sign-in"
    }
  }
}
```

### Using Credentials

Universal Agent automatically uses credentials when needed:

```javascript
// Plan says requiresAuth: true, credentialKey: "facebook"
await handleAuthentication(page, plan, userId);

// Loads user.butlerCredentials.facebook
// Uses vision to find login fields
// Fills credentials securely
// Completes login flow
```

---

## Security & Safety

### Risk Assessment

Every task is analyzed for risk level:

- **Low Risk**: Read-only tasks (search, browse, screenshot)
- **Medium Risk**: Data entry, form submission
- **High Risk**: Financial transactions, account modifications

### Confirmation Flow

High-risk tasks require user confirmation:

```javascript
const result = await universalAgent.executeTask(
  userId,
  "Transfer $1000 from checking to savings"
);

if (result.needsConfirmation) {
  // Show user the plan and ask for confirmation
  return {
    message: result.confirmationPrompt,
    plan: result.steps,
    sessionId: result.sessionId
  };
}

// After user confirms:
const finalResult = await universalAgent.executeTask(
  userId,
  "Transfer $1000 from checking to savings",
  { confirmed: true, sessionId: result.sessionId }
);
```

### Rate Limiting

Automatic protection against abuse:

- Max 10 tasks per minute per user
- Max 100 tasks per hour per user
- Max 3 concurrent sessions per user

---

## Advanced Usage

### Custom Step Injection

```javascript
// Add custom verification step
plan.steps.push({
  stepNumber: 99,
  action: 'verify',
  description: 'Verify order total is under $50',
  target: { type: 'selector', value: '.order-total' },
  critical: true
});

const result = await universalAgent.executePlan(plan, userId, sessionId);
```

### Vision Debugging

```javascript
// Enable vision debugging
universalAgent.on('vision:analyzing', ({ description, attempt }) => {
  console.log(`Analyzing: "${description}" (attempt ${attempt})`);
});

// Get detailed vision results
const element = await universalAgent.findElement(
  page,
  "blue submit button with white text",
  userId,
  sessionId
);

console.log(`Found at (${element.x}, ${element.y}) with ${element.confidence} confidence`);
```

### Workflow Management

```javascript
// Get all learned workflows
const workflows = await LearnedWorkflow.find({ status: 'active' });

// Execute specific workflow
const workflow = await LearnedWorkflow.findById(workflowId);
const result = await universalAgent.executeLearnedWorkflow(
  workflow,
  userId,
  sessionId
);

// Delete workflow
await LearnedWorkflow.findByIdAndDelete(workflowId);
```

---

## Performance

### Benchmarks

| Task Type | First Execution | Learned Execution | Speedup |
|-----------|----------------|-------------------|---------|
| Social signup | 25-35s | 8-12s | 3x faster |
| Food order | 30-45s | 5-10s | 5x faster |
| Flight search | 20-30s | 6-10s | 3x faster |
| Money transfer | 15-25s | 4-8s | 4x faster |

### Optimization Tips

1. **Use learned workflows** - 3-5x faster than AI planning
2. **Batch similar tasks** - Reuse browser session
3. **Provide specific details** - Reduces vision search time
4. **Enable headless mode** - 20% faster execution

---

## Limitations & Future Enhancements

### Current Limitations

1. **CAPTCHAs** - Cannot bypass security challenges
2. **2FA** - Requires manual intervention
3. **Complex workflows** - Limited to 50 steps max
4. **Vision accuracy** - 85-95% depending on page complexity

### Planned Features

- [ ] CAPTCHA solving with 2Captcha integration
- [ ] 2FA handling with SMS/email integration
- [ ] Multi-page workflows (shopping carts across sites)
- [ ] Parallel execution (multiple browsers)
- [ ] Workflow marketplace (share workflows)
- [ ] Advanced vision with OCR and layout understanding

---

## Support

For issues or questions:
- Check existing workflows: `LearnedWorkflow.find()`
- Enable debug logs: `DEBUG=universal-agent node server.js`
- Review screenshots: Check `result.steps[].screenshot`
- Contact team: support@phoenix.com

---

**Built with love by the Phoenix team. Making automation accessible to everyone.**
