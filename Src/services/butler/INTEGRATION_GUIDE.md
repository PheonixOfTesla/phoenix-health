# Universal Agent Integration Guide

## Integrating with Existing Phoenix Systems

This guide shows how to connect the Universal Agent to Phoenix's existing architecture.

---

## 1. Route Integration

### Add to `/Src/routes/butler.js`

```javascript
const express = require('express');
const router = express.Router();
const universalAgent = require('../services/butler/universalAgent');
const auth = require('../middleware/auth');

/**
 * POST /api/butler/execute
 * Execute any browser task
 */
router.post('/execute', auth, async (req, res) => {
  try {
    const { task, options = {} } = req.body;
    const userId = req.user._id;

    const result = await universalAgent.executeTask(userId, task, options);

    res.json(result);

  } catch (error) {
    console.error('[Butler] Execute error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/butler/plan
 * Preview execution plan without running
 */
router.post('/plan', auth, async (req, res) => {
  try {
    const { task } = req.body;
    const userId = req.user._id;

    const plan = await universalAgent.planTask(task, userId);

    res.json(plan);

  } catch (error) {
    console.error('[Butler] Plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/butler/session/:sessionId
 * Get session status
 */
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const status = universalAgent.getSessionStatus(sessionId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json(status);

  } catch (error) {
    console.error('[Butler] Session status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/butler/session/:sessionId/screenshot
 * Get live screenshot
 */
router.get('/session/:sessionId/screenshot', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const screenshot = await universalAgent.getLiveScreenshot(sessionId);

    if (!screenshot) {
      return res.status(404).json({
        success: false,
        message: 'Screenshot not available'
      });
    }

    res.json({ screenshot });

  } catch (error) {
    console.error('[Butler] Screenshot error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/butler/session/:sessionId
 * Stop running session
 */
router.delete('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stopped = await universalAgent.stopSession(sessionId);

    res.json({ success: stopped });

  } catch (error) {
    console.error('[Butler] Stop session error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
```

---

## 2. WebSocket Integration

### Add to `/Src/controllers/butlerController.js`

```javascript
const universalAgent = require('../services/butler/universalAgent');

class ButlerController {
  constructor(io) {
    this.io = io;
    this.setupUniversalAgentEvents();
  }

  setupUniversalAgentEvents() {
    // Stream task progress to connected clients
    universalAgent.on('task:started', ({ userId, sessionId, taskDescription }) => {
      this.io.to(userId).emit('butler:task:started', {
        sessionId,
        task: taskDescription
      });
    });

    universalAgent.on('task:planned', ({ userId, sessionId, plan }) => {
      this.io.to(userId).emit('butler:task:planned', {
        sessionId,
        steps: plan.steps.length,
        estimatedTime: plan.estimatedTime,
        summary: plan.summary
      });
    });

    universalAgent.on('step:started', ({ userId, sessionId, step }) => {
      this.io.to(userId).emit('butler:step:started', {
        sessionId,
        stepNumber: step.stepNumber,
        description: step.description,
        totalSteps: step.totalSteps
      });
    });

    universalAgent.on('step:completed', ({ userId, sessionId, step, result }) => {
      this.io.to(userId).emit('butler:step:completed', {
        sessionId,
        stepNumber: step.stepNumber,
        success: result.success,
        duration: result.duration
      });
    });

    universalAgent.on('screenshot', ({ userId, sessionId, stepNumber, screenshot }) => {
      // Stream screenshot in real-time
      this.io.to(userId).emit('butler:screenshot', {
        sessionId,
        stepNumber,
        screenshot: screenshot.substring(0, 1000) + '...', // Send preview
        fullUrl: `/api/butler/session/${sessionId}/screenshot`
      });
    });

    universalAgent.on('task:completed', ({ userId, sessionId, success, executionTime }) => {
      this.io.to(userId).emit('butler:task:completed', {
        sessionId,
        success,
        executionTime
      });
    });

    universalAgent.on('task:failed', ({ userId, sessionId, error }) => {
      this.io.to(userId).emit('butler:task:failed', {
        sessionId,
        error
      });
    });

    universalAgent.on('workflow:learned', ({ userId, workflowId, name }) => {
      this.io.to(userId).emit('butler:workflow:learned', {
        workflowId,
        name,
        message: `I learned how to "${name}"! Next time will be faster.`
      });
    });
  }

  // Handle WebSocket connections
  handleConnection(socket) {
    const userId = socket.user._id;

    socket.on('butler:execute', async (data) => {
      try {
        const result = await universalAgent.executeTask(
          userId,
          data.task,
          data.options
        );

        socket.emit('butler:result', result);

      } catch (error) {
        socket.emit('butler:error', { message: error.message });
      }
    });

    socket.on('butler:stop', async (data) => {
      const stopped = await universalAgent.stopSession(data.sessionId);
      socket.emit('butler:stopped', { success: stopped });
    });
  }
}

module.exports = ButlerController;
```

---

## 3. Phoenix Mind Integration

### Add to `/Src/services/consciousness/phoenixMind.js`

```javascript
const universalAgent = require('../butler/universalAgent');

class PhoenixMind {
  async processIntent(intent, userMessage, userId, context) {
    // ... existing intent handling ...

    // Check if this is a Butler task
    if (this.isButlerTask(intent, userMessage)) {
      return await this.handleButlerTask(userMessage, userId, context);
    }

    // ... rest of intent handling ...
  }

  isButlerTask(intent, message) {
    const butlerKeywords = [
      'order', 'book', 'buy', 'create', 'send money', 'transfer',
      'search for', 'find me', 'get me', 'schedule', 'cancel'
    ];

    const lowerMessage = message.toLowerCase();
    return butlerKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  async handleButlerTask(message, userId, context) {
    try {
      // Check if user wants to see plan first
      const wantsPreview = message.toLowerCase().includes('what would') ||
                          message.toLowerCase().includes('how would');

      if (wantsPreview) {
        const plan = await universalAgent.planTask(message, userId);

        return {
          response: `Here's what I'd do:\n\n${plan.summary}\n\nSteps:\n${plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}\n\nEstimated time: ${plan.estimatedTime}\n\nWant me to do it?`,
          actionRequired: true,
          plan: plan
        };
      }

      // Execute the task
      const result = await universalAgent.executeTask(userId, message, {
        headless: true
      });

      if (result.needsConfirmation) {
        return {
          response: result.confirmationPrompt,
          actionRequired: true,
          confirmationType: 'butler_task',
          sessionId: result.sessionId
        };
      }

      if (result.success) {
        return {
          response: result.message + (result.learned ? " (I've learned this for next time!)" : ""),
          screenshot: result.finalScreenshot
        };
      } else {
        return {
          response: `I tried, but ran into an issue: ${result.message}`,
          error: true
        };
      }

    } catch (error) {
      console.error('[PhoenixMind] Butler task error:', error);
      return {
        response: "I'm having trouble with that task right now. Could you try rephrasing it?",
        error: true
      };
    }
  }
}
```

---

## 4. Voice Interface Integration

### Add to `/Src/services/phoenix/realtimeVoiceService.js`

```javascript
const universalAgent = require('../butler/universalAgent');

class RealtimeVoiceService {
  async handleVoiceCommand(transcript, userId) {
    // ... existing voice processing ...

    // Check if it's a Butler command
    if (this.isButlerCommand(transcript)) {
      // Start task in background
      const taskPromise = universalAgent.executeTask(userId, transcript, {
        headless: true
      });

      // Immediately acknowledge
      this.speak(userId, "On it. I'll let you know when it's done.");

      // Wait for result
      const result = await taskPromise;

      if (result.success) {
        this.speak(userId, result.message);
      } else {
        this.speak(userId, `I ran into an issue: ${result.message}`);
      }

      return result;
    }

    // ... rest of voice handling ...
  }

  isButlerCommand(transcript) {
    const actionVerbs = ['order', 'book', 'buy', 'create', 'send', 'find', 'search'];
    const lowerTranscript = transcript.toLowerCase();
    return actionVerbs.some(verb => lowerTranscript.startsWith(verb));
  }
}
```

---

## 5. Frontend Integration

### React Component Example

```javascript
import { useState } from 'react';
import io from 'socket.io-client';

function ButlerInterface() {
  const [task, setTask] = useState('');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState([]);
  const [screenshot, setScreenshot] = useState(null);

  const socket = io('http://localhost:3000');

  // Listen for progress updates
  socket.on('butler:step:started', (data) => {
    setProgress(prev => [...prev, {
      step: data.stepNumber,
      description: data.description,
      status: 'running'
    }]);
  });

  socket.on('butler:step:completed', (data) => {
    setProgress(prev => prev.map(p =>
      p.step === data.stepNumber
        ? { ...p, status: data.success ? 'success' : 'failed' }
        : p
    ));
  });

  socket.on('butler:screenshot', (data) => {
    setScreenshot(data.screenshot);
  });

  socket.on('butler:task:completed', (data) => {
    setStatus('completed');
  });

  const executeTask = async () => {
    setStatus('running');
    setProgress([]);

    const response = await fetch('/api/butler/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task })
    });

    const result = await response.json();
    console.log('Result:', result);
  };

  return (
    <div className="butler-interface">
      <h2>Phoenix Butler</h2>

      <div className="task-input">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What would you like me to do?"
        />
        <button onClick={executeTask} disabled={status === 'running'}>
          Execute
        </button>
      </div>

      {status === 'running' && (
        <div className="progress">
          <h3>Progress</h3>
          {progress.map(p => (
            <div key={p.step} className={`step ${p.status}`}>
              <span>Step {p.step}:</span>
              <span>{p.description}</span>
              <span className="status">{p.status}</span>
            </div>
          ))}
        </div>
      )}

      {screenshot && (
        <div className="live-view">
          <h3>Live View</h3>
          <img src={`data:image/png;base64,${screenshot}`} alt="Live view" />
        </div>
      )}
    </div>
  );
}

export default ButlerInterface;
```

---

## 6. Database Models

### Ensure LearnedWorkflow model exists

The Universal Agent uses `LearnedWorkflow` model. If it doesn't exist, create:

```javascript
// /Src/models/phoenix/LearnedWorkflow.js
const mongoose = require('mongoose');

const learnedWorkflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['food', 'ride', 'shopping', 'finance', 'travel', 'communication', 'productivity', 'entertainment', 'custom'],
    default: 'custom'
  },
  triggers: [{
    phrase: String,
    confidence: Number
  }],
  requiredParams: [{
    name: String,
    type: String,
    description: String
  }],
  steps: [{
    stepNumber: Number,
    action: String,
    target: mongoose.Schema.Types.Mixed,
    value: String,
    waitCondition: mongoose.Schema.Types.Mixed,
    screenshot: Boolean
  }],
  service: {
    name: String,
    baseUrl: String,
    loginRequired: Boolean
  },
  learned: {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    originalRequest: String,
    aiModel: String,
    learnedAt: {
      type: Date,
      default: Date.now
    }
  },
  executions: {
    total: { type: Number, default: 0 },
    successful: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    avgDuration: { type: Number, default: 0 }
  },
  scope: {
    type: String,
    enum: ['global', 'user', 'private'],
    default: 'global'
  },
  status: {
    type: String,
    enum: ['active', 'deprecated', 'disabled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Static method to find matching workflow
learnedWorkflowSchema.statics.findMatchingWorkflow = async function(query, userId) {
  const workflows = await this.find({
    status: 'active',
    $or: [
      { scope: 'global' },
      { scope: 'user', 'learned.fromUserId': userId }
    ]
  });

  // Simple matching - find workflow with highest trigger confidence
  let bestMatch = null;
  let bestScore = 0;

  for (const workflow of workflows) {
    for (const trigger of workflow.triggers) {
      if (query.toLowerCase().includes(trigger.phrase.toLowerCase())) {
        if (trigger.confidence > bestScore) {
          bestScore = trigger.confidence;
          bestMatch = workflow;
        }
      }
    }
  }

  return bestScore > 0.7 ? bestMatch : null;
};

// Instance method to record execution
learnedWorkflowSchema.methods.recordExecution = async function(success, duration) {
  this.executions.total += 1;
  if (success) {
    this.executions.successful += 1;
  } else {
    this.executions.failed += 1;
  }

  // Update average duration
  this.executions.avgDuration =
    (this.executions.avgDuration * (this.executions.total - 1) + duration) / this.executions.total;

  await this.save();
};

module.exports = mongoose.model('LearnedWorkflow', learnedWorkflowSchema);
```

---

## 7. Environment Variables

Add to `.env`:

```bash
# Universal Agent Configuration
UNIVERSAL_AGENT_MAX_STEPS=50
UNIVERSAL_AGENT_STEP_TIMEOUT=30000
UNIVERSAL_AGENT_VISION_RETRIES=3
UNIVERSAL_AGENT_HEADLESS=true

# AI Provider for Vision (Claude recommended)
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## 8. Testing

Create test file: `/tests/universalAgent.test.js`

```javascript
const universalAgent = require('../Src/services/butler/universalAgent');
const User = require('../Src/models/User');

describe('Universal Agent', () => {
  let testUserId;

  beforeAll(async () => {
    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123'
    });
    testUserId = user._id;
  });

  test('should plan a simple task', async () => {
    const plan = await universalAgent.planTask(
      "Search for flights to Miami",
      testUserId
    );

    expect(plan).toBeDefined();
    expect(plan.steps).toBeInstanceOf(Array);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.goal).toContain('Miami');
  });

  test('should handle unknown task gracefully', async () => {
    const result = await universalAgent.executeTask(
      testUserId,
      "Do something completely impossible"
    );

    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
  });

  test('should require confirmation for high-risk tasks', async () => {
    const result = await universalAgent.executeTask(
      testUserId,
      "Transfer $1000 to John on Venmo"
    );

    expect(result.needsConfirmation).toBe(true);
    expect(result.confirmationPrompt).toBeDefined();
  });
});
```

---

## Deployment Checklist

- [ ] Add routes to server.js
- [ ] Set up WebSocket event handlers
- [ ] Configure environment variables
- [ ] Create database indexes for LearnedWorkflow
- [ ] Test with headless browser in production
- [ ] Set up monitoring for execution failures
- [ ] Configure rate limiting
- [ ] Add user authentication checks
- [ ] Enable error logging to Sentry/LogRocket
- [ ] Document API endpoints for frontend team

---

**The Universal Agent is now fully integrated with Phoenix!**

Users can now automate ANY browser task through voice, chat, or API calls.
