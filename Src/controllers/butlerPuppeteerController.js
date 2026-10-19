// Src/controllers/butlerPuppeteerController.js
// Butler Controller using REAL Puppeteer Automation (No OAuth, No API keys)

const puppeteerButler = require('../services/phoenix/puppeteerButler');
const User = require('../models/User');
const PendingButlerTask = require('../models/PendingButlerTask');
const asyncHandler = require('express-async-handler');

// Universal Agent for "do anything" automation
let universalAgent;
try {
  universalAgent = require('../services/butler/universalAgent');
} catch (e) {
  console.warn('[ButlerController] Universal Agent not available:', e.message);
}

// ============================================================================
// SSE STREAMING
// ============================================================================

// @desc    Stream real-time screenshots and status updates for a session
// @route   GET /api/butler/stream/:sessionId
// @access  Private
exports.streamSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  // Set up SSE headers immediately - don't wait for session
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  console.log(`[Butler Stream] Client connected for session: ${sessionId}`);

  // Send initial connection event
  res.write(`event: status\ndata: ${JSON.stringify({ status: 'connected', message: 'Waiting for task to start...' })}\n\n`);

  // Listen to universalAgent events
  if (universalAgent) {
    const onScreenshot = (data) => {
      if (data.sessionId === sessionId) {
        res.write(`event: screenshot\ndata: ${JSON.stringify({ screenshot: data.screenshot })}\n\n`);
      }
    };

    const onStepStarted = (data) => {
      if (data.sessionId === sessionId) {
        res.write(`event: progress\ndata: ${JSON.stringify({
          step: data.step.stepNumber,
          total: data.step.totalSteps || 10,
          description: data.step.description
        })}\n\n`);
      }
    };

    const onStepCompleted = (data) => {
      if (data.sessionId === sessionId && data.result?.screenshot) {
        res.write(`event: screenshot\ndata: ${JSON.stringify({ screenshot: data.result.screenshot })}\n\n`);
      }
    };

    const onTaskCompleted = (data) => {
      if (data.sessionId === sessionId) {
        res.write(`event: complete\ndata: ${JSON.stringify({
          success: data.success,
          totalSteps: data.steps || 0,
          executionTime: data.executionTime
        })}\n\n`);
      }
    };

    const onTaskFailed = (data) => {
      if (data.sessionId === sessionId) {
        res.write(`event: error_event\ndata: ${JSON.stringify({ error: data.error })}\n\n`);
      }
    };

    // Register listeners
    universalAgent.on('screenshot', onScreenshot);
    universalAgent.on('step:started', onStepStarted);
    universalAgent.on('step:completed', onStepCompleted);
    universalAgent.on('task:completed', onTaskCompleted);
    universalAgent.on('task:failed', onTaskFailed);

    // Cleanup on disconnect
    req.on('close', () => {
      console.log(`[Butler Stream] Client disconnected: ${sessionId}`);
      universalAgent.removeListener('screenshot', onScreenshot);
      universalAgent.removeListener('step:started', onStepStarted);
      universalAgent.removeListener('step:completed', onStepCompleted);
      universalAgent.removeListener('task:completed', onTaskCompleted);
      universalAgent.removeListener('task:failed', onTaskFailed);
    });
  }

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// @desc    Setup a session for manual login (visible browser)
// @route   POST /api/butler/session/setup
// @access  Private
exports.setupSession = asyncHandler(async (req, res) => {
  const { service } = req.body;

  if (!service) {
    res.status(400);
    throw new Error('Service name is required');
  }

  res.json({
    success: true,
    message: 'Manual session setup is not yet implemented',
    service,
    note: 'This feature would launch a visible browser for manual login and cookie capture'
  });
});

// @desc    Get session status for a service
// @route   GET /api/butler/session/status/:service
// @access  Private
exports.getSessionStatus = asyncHandler(async (req, res) => {
  const { service } = req.params;
  const user = await User.findById(req.user._id).select('butlerCredentials');

  const hasCredentials = user.butlerCredentials && user.butlerCredentials[service];

  res.json({
    success: true,
    service,
    hasCredentials,
    connectedAt: hasCredentials ? user.butlerCredentials[service].connectedAt : null
  });
});

// @desc    Execute a butler action with natural language
// @route   POST /api/butler/execute
// @access  Private
exports.executeAction = asyncHandler(async (req, res) => {
  const { goal, task } = req.body;
  const taskDescription = goal || task;

  if (!taskDescription) {
    res.status(400);
    throw new Error('Task/goal description is required');
  }

  if (!universalAgent) {
    res.status(500);
    throw new Error('Universal Agent not available');
  }

  console.log(`[Butler] Executing universal task: "${taskDescription}"`);

  // Execute via Universal Agent
  const result = await universalAgent.executeTask(
    req.user._id.toString(),
    taskDescription,
    { confirmed: true }
  );

  res.json({
    success: result.success,
    message: result.message,
    sessionId: result.sessionId,
    executionTime: result.executionTime,
    steps: result.steps,
    finalScreenshot: result.finalScreenshot,
    needsConfirmation: result.needsConfirmation,
    confirmationPrompt: result.confirmationPrompt,
    plan: result.plan
  });
});

// @desc    Execute universal "do anything" task
// @route   POST /api/butler/universal
// @access  Private
exports.executeUniversal = asyncHandler(async (req, res) => {
  const { task, goal, confirmed, skipLearned, additionalInfo } = req.body;
  let taskDescription = task || goal;

  // If additional info was provided (answers to follow-up questions), append to task
  if (additionalInfo && typeof additionalInfo === 'object') {
    const infoStr = Object.entries(additionalInfo)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    taskDescription = `${taskDescription}. Additional info: ${infoStr}`;
    console.log(`[Butler Universal] Task with additional info: "${taskDescription}"`);
  }

  if (!taskDescription) {
    res.status(400);
    throw new Error('Task description is required');
  }

  const userId = req.user._id.toString();
  console.log(`[Butler Universal] User ${userId} requested: "${taskDescription}"`);

  // Detect email tasks - route to Gmail API instead of Puppeteer
  const lowerTask = taskDescription.toLowerCase();
  const isEmailTask = (lowerTask.includes('send') || lowerTask.includes('write') || lowerTask.includes('compose')) &&
                      (lowerTask.includes('email') || lowerTask.includes('mail'));

  if (isEmailTask) {
    console.log(`[Butler Universal] Detected email task - routing to Gmail API`);

    // Extract email details using regex
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = taskDescription.match(emailRegex);
    const toEmail = emailMatch ? emailMatch[1] : null;

    // Extract message content (everything after "say" or "saying" or after the email)
    let messageBody = 'Hello!';
    const sayMatch = taskDescription.match(/(?:say(?:ing)?|with message|message:?)\s*[""']?(.+?)[""']?\s*$/i);
    if (sayMatch) {
      messageBody = sayMatch[1].replace(/[""']/g, '').trim();
    }

    if (!toEmail) {
      return res.json({
        success: false,
        needsConfirmation: true,
        confirmationPrompt: 'Who would you like to send the email to? Please provide an email address.',
        plan: 'Send an email',
        steps: ['Get recipient email address', 'Compose and send email'],
        sessionId: `email_${Date.now()}`
      });
    }

    // Check if user has Google connected
    const User = require('../models/User');
    const user = await User.findById(userId).select('googleTokens');

    if (!user?.googleTokens?.access_token) {
      return res.json({
        success: false,
        message: 'Please connect your Google account first to send emails. Go to Settings > Connect Google.',
        needsGoogleAuth: true
      });
    }

    try {
      // Use Gmail API to send email
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials(user.googleTokens);

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Get user's email
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const fromEmail = profile.data.emailAddress;

      // Create email
      const subject = 'Message from Phoenix';
      const rawEmail = [
        `From: ${fromEmail}`,
        `To: ${toEmail}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        messageBody
      ].join('\n');

      const encodedEmail = Buffer.from(rawEmail)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedEmail }
      });

      console.log(`[Butler Universal] Email sent to ${toEmail}`);

      return res.json({
        success: true,
        message: `Email sent to ${toEmail}!`,
        sessionId: `email_${Date.now()}`,
        executionTime: 500,
        steps: 1,
        learned: false
      });

    } catch (emailError) {
      console.error('[Butler Universal] Email send failed:', emailError.message);
      return res.json({
        success: false,
        message: `Failed to send email: ${emailError.message}`
      });
    }
  }

  // For non-email tasks, use Universal Agent
  if (!universalAgent) {
    res.status(500);
    throw new Error('Universal Agent not available. Please ensure puppeteer dependencies are installed.');
  }

  try {
    // Generate session ID upfront
    const sessionId = `universal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // First, do planning phase (quick) to check if we need more info or confirmation
    const plan = await universalAgent.planTask(taskDescription, userId, {
      additionalInfo: additionalInfo || {}
    });

    // If needs more information, return questions for user
    if (plan.needsMoreInfo && plan.missingInfo?.length > 0) {
      // Store pending task for conversation follow-up
      try {
        await PendingButlerTask.create({
          userId: userId,
          sessionId: sessionId,
          originalTask: task || goal,
          pendingQuestions: plan.missingInfo.map(info => ({
            field: info.field,
            question: info.question,
            type: info.type || 'text'
          })),
          planSummary: plan.summary,
          status: 'awaiting_answers'
        });
        console.log(`[Butler] Created pending task ${sessionId} with ${plan.missingInfo.length} questions`);
      } catch (err) {
        console.warn('[Butler] Failed to store pending task:', err.message);
      }

      return res.json({
        success: false,
        needsMoreInfo: true,
        message: `I need a bit more information to help you with "${taskDescription}":`,
        questions: plan.missingInfo.map(info => ({
          field: info.field,
          question: info.question,
          type: info.type || 'text'
        })),
        plan: plan.summary,
        sessionId: sessionId
      });
    }

    // If needs confirmation, return the plan for user approval
    if (plan.needsConfirmation && !confirmed) {
      return res.json({
        success: false,
        needsConfirmation: true,
        confirmationPrompt: plan.confirmationMessage || `I'll execute this task: ${plan.summary}. Proceed?`,
        plan: plan.summary,
        steps: plan.steps?.map(s => s.description) || [],
        sessionId: sessionId
      });
    }

    // Task is ready to execute - return sessionId immediately and execute in background
    console.log(`[Butler Universal] Starting async execution for session: ${sessionId}`);

    // Return immediately with the sessionId so frontend can connect to SSE
    res.json({
      success: true,
      message: 'Task started - connect to SSE stream for updates',
      sessionId: sessionId,
      plan: plan.summary,
      steps: plan.steps?.length || 0,
      executing: true
    });

    // Execute task in background (don't await - let it run asynchronously)
    setImmediate(async () => {
      try {
        console.log(`[Butler Universal] Background execution started: ${sessionId}`);
        await universalAgent.executeTask(userId, taskDescription, {
          confirmed: true,
          learn: true,
          skipLearned: skipLearned === true,
          additionalInfo: additionalInfo || {},
          sessionId: sessionId // Pass the pre-generated sessionId
        });
        console.log(`[Butler Universal] Background execution completed: ${sessionId}`);
      } catch (bgError) {
        console.error(`[Butler Universal] Background execution failed: ${sessionId}`, bgError.message);
        // Error will be emitted through SSE
        universalAgent.emit('task:failed', { sessionId, error: bgError.message, userId });
      }
    });

  } catch (error) {
    console.error('[Butler Universal] Execution error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute task',
      error: error.message
    });
  }
});

// @desc    Cancel a running automation session
// @route   POST /api/butler/cancel/:sessionId
// @access  Private
exports.cancelSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!universalAgent) {
    res.status(500);
    throw new Error('Universal Agent not available');
  }

  const stopped = await universalAgent.stopSession(sessionId);

  res.json({
    success: stopped,
    message: stopped ? 'Session cancelled' : 'Session not found or already completed'
  });
});

// ============================================================================
// CREDENTIAL MANAGEMENT
// ============================================================================

// @desc    Store encrypted credentials for a service
// @route   POST /api/butler/credentials/:service
// @access  Private
exports.storeCredentials = asyncHandler(async (req, res) => {
  const { service } = req.params;
  const { email, password } = req.body;

  // Validate service
  const validServices = ['uber', 'lyft', 'opentable', 'doordash', 'ubereats'];
  if (!validServices.includes(service)) {
    res.status(400);
    throw new Error(`Invalid service. Must be one of: ${validServices.join(', ')}`);
  }

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // Encrypt credentials
  const encryptedEmail = puppeteerButler.encryptCredential(email);
  const encryptedPassword = puppeteerButler.encryptCredential(password);

  // Store in user document
  const user = await User.findById(req.user._id);
  if (!user.butlerCredentials) {
    user.butlerCredentials = {};
  }

  user.butlerCredentials[service] = {
    encryptedEmail,
    encryptedPassword,
    connectedAt: new Date()
  };

  await user.save();

  res.json({
    success: true,
    message: `${service} credentials stored successfully`,
    service,
    connectedAt: user.butlerCredentials[service].connectedAt
  });
});

// @desc    Get list of connected services
// @route   GET /api/butler/credentials
// @access  Private
exports.getCredentials = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('butlerCredentials');

  const connections = {};
  if (user.butlerCredentials) {
    Object.keys(user.butlerCredentials).forEach(service => {
      connections[service] = {
        connected: true,
        connectedAt: user.butlerCredentials[service].connectedAt
      };
    });
  }

  res.json({
    success: true,
    connections
  });
});

// @desc    Remove credentials for a service
// @route   DELETE /api/butler/credentials/:service
// @access  Private
exports.removeCredentials = asyncHandler(async (req, res) => {
  const { service } = req.params;

  const user = await User.findById(req.user._id);

  if (user.butlerCredentials && user.butlerCredentials[service]) {
    delete user.butlerCredentials[service];
    await user.save();
  }

  res.json({
    success: true,
    message: `${service} credentials removed`
  });
});

// ============================================================================
// UBER RIDE BOOKING
// ============================================================================

// @desc    Book an Uber ride using Puppeteer automation
// @route   POST /api/butler/uber/book
// @access  Private
exports.bookUberRide = asyncHandler(async (req, res) => {
  const { pickup, destination, rideType = 'UberX' } = req.body;

  if (!pickup || !destination) {
    res.status(400);
    throw new Error('Pickup and destination addresses are required');
  }

  // Get user credentials
  const user = await User.findById(req.user._id).select('butlerCredentials');

  if (!user.butlerCredentials || !user.butlerCredentials.uber) {
    res.status(400);
    throw new Error('Uber credentials not found. Please store your credentials first.');
  }

  // Book ride using Puppeteer
  const result = await puppeteerButler.bookUberRide({
    userId: req.user._id,
    credentials: user.butlerCredentials.uber,
    pickup,
    destination,
    rideType
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// LYFT RIDE BOOKING
// ============================================================================

// @desc    Book a Lyft ride using Puppeteer automation
// @route   POST /api/butler/lyft/book
// @access  Private
exports.bookLyftRide = asyncHandler(async (req, res) => {
  const { pickup, destination, rideType = 'Lyft' } = req.body;

  if (!pickup || !destination) {
    res.status(400);
    throw new Error('Pickup and destination addresses are required');
  }

  // Get user credentials
  const user = await User.findById(req.user._id).select('butlerCredentials');

  if (!user.butlerCredentials || !user.butlerCredentials.lyft) {
    res.status(400);
    throw new Error('Lyft credentials not found. Please store your credentials first.');
  }

  // Book ride using Puppeteer
  const result = await puppeteerButler.bookLyftRide({
    userId: req.user._id,
    credentials: user.butlerCredentials.lyft,
    pickup,
    destination,
    rideType
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// OPENTABLE RESERVATIONS
// ============================================================================

// @desc    Make an OpenTable reservation using Puppeteer automation
// @route   POST /api/butler/opentable/reserve
// @access  Private
exports.makeOpenTableReservation = asyncHandler(async (req, res) => {
  const { restaurantName, date, time, partySize, preferences = {} } = req.body;

  if (!restaurantName || !date || !time || !partySize) {
    res.status(400);
    throw new Error('Restaurant name, date, time, and party size are required');
  }

  // Get user credentials (optional for OpenTable, can book as guest)
  const user = await User.findById(req.user._id).select('butlerCredentials name email phone');

  let credentials = null;
  if (user.butlerCredentials && user.butlerCredentials.opentable) {
    credentials = user.butlerCredentials.opentable;
  }

  // Add user info to preferences if not provided
  if (!preferences.firstName) preferences.firstName = user.name.split(' ')[0];
  if (!preferences.lastName) preferences.lastName = user.name.split(' ')[1] || '';
  if (!preferences.email) preferences.email = user.email;
  if (!preferences.phone) preferences.phone = user.phone;

  // Make reservation using Puppeteer
  const result = await puppeteerButler.makeOpenTableReservation({
    userId: req.user._id,
    credentials,
    restaurantName,
    date,
    time,
    partySize,
    preferences
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// DOORDASH FOOD DELIVERY
// ============================================================================

// @desc    Order food from DoorDash using Puppeteer automation
// @route   POST /api/butler/doordash/order
// @access  Private
exports.orderDoorDash = asyncHandler(async (req, res) => {
  const { restaurant, items = [], deliveryAddress, preferences = {} } = req.body;

  if (!restaurant || items.length === 0 || !deliveryAddress) {
    res.status(400);
    throw new Error('Restaurant, items, and delivery address are required');
  }

  // Get user credentials
  const user = await User.findById(req.user._id).select('butlerCredentials');

  if (!user.butlerCredentials || !user.butlerCredentials.doordash) {
    res.status(400);
    throw new Error('DoorDash credentials not found. Please store your credentials first.');
  }

  // Order food using Puppeteer
  const result = await puppeteerButler.orderDoorDash({
    userId: req.user._id,
    credentials: user.butlerCredentials.doordash,
    restaurant,
    items,
    deliveryAddress,
    preferences
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// UBER EATS FOOD DELIVERY
// ============================================================================

// @desc    Order food from Uber Eats using Puppeteer automation
// @route   POST /api/butler/ubereats/order
// @access  Private
exports.orderUberEats = asyncHandler(async (req, res) => {
  const { restaurant, items = [], deliveryAddress, preferences = {} } = req.body;

  if (!restaurant || items.length === 0 || !deliveryAddress) {
    res.status(400);
    throw new Error('Restaurant, items, and delivery address are required');
  }

  // Get user credentials (can share Uber credentials)
  const user = await User.findById(req.user._id).select('butlerCredentials');

  let credentials = null;
  if (user.butlerCredentials && user.butlerCredentials.ubereats) {
    credentials = user.butlerCredentials.ubereats;
  } else if (user.butlerCredentials && user.butlerCredentials.uber) {
    // Fallback to Uber credentials (Uber Eats shares login with Uber)
    credentials = user.butlerCredentials.uber;
  } else {
    res.status(400);
    throw new Error('Uber Eats or Uber credentials not found. Please store your credentials first.');
  }

  // Order food using Puppeteer
  const result = await puppeteerButler.orderUberEats({
    userId: req.user._id,
    credentials,
    restaurant,
    items,
    deliveryAddress,
    preferences
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================================
// BUTLER ACTION HISTORY
// ============================================================================

// @desc    Get butler action history
// @route   GET /api/butler/actions
// @access  Private
exports.getActionHistory = asyncHandler(async (req, res) => {
  const { actionType, limit = 50 } = req.query;

  const actions = await puppeteerButler.getActionHistory(
    req.user._id,
    actionType,
    parseInt(limit)
  );

  res.json({
    success: true,
    count: actions.length,
    actions
  });
});

// @desc    Get specific butler action status
// @route   GET /api/butler/actions/:actionId
// @access  Private
exports.getActionStatus = asyncHandler(async (req, res) => {
  const { actionId } = req.params;

  const action = await puppeteerButler.getActionStatus(actionId);

  if (!action) {
    res.status(404);
    throw new Error('Action not found');
  }

  // Verify this action belongs to the current user
  if (action.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this action');
  }

  res.json({
    success: true,
    action
  });
});

// ============================================================================
// PENDING TASK CONVERSATION FLOW
// ============================================================================

// @desc    Get pending Butler task awaiting answers
// @route   GET /api/butler/pending
// @access  Private
exports.getPendingTask = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const pendingTask = await PendingButlerTask.findLatestForUser(userId);

  if (!pendingTask) {
    return res.json({
      success: true,
      hasPending: false,
      message: 'No pending tasks'
    });
  }

  const nextQuestion = pendingTask.getNextQuestion();

  res.json({
    success: true,
    hasPending: true,
    sessionId: pendingTask.sessionId,
    originalTask: pendingTask.originalTask,
    planSummary: pendingTask.planSummary,
    questionsRemaining: pendingTask.pendingQuestions.length,
    nextQuestion: nextQuestion,
    allQuestions: pendingTask.pendingQuestions,
    answersCollected: pendingTask.getAnswersObject()
  });
});

// @desc    Submit an answer to a pending Butler question
// @route   POST /api/butler/answer
// @access  Private
exports.submitAnswer = asyncHandler(async (req, res) => {
  const { sessionId, field, value, answer } = req.body;
  const userId = req.user._id.toString();

  // Allow either 'value' or 'answer' as the answer field
  const answerValue = value || answer;

  if (!answerValue) {
    res.status(400);
    throw new Error('Answer value is required');
  }

  // Find pending task - by sessionId if provided, otherwise get latest
  let pendingTask;
  if (sessionId) {
    pendingTask = await PendingButlerTask.findOne({
      userId,
      sessionId,
      status: 'awaiting_answers'
    });
  } else {
    pendingTask = await PendingButlerTask.findLatestForUser(userId);
  }

  if (!pendingTask) {
    res.status(404);
    throw new Error('No pending task found. Please start a new request.');
  }

  // Determine which field this answer is for
  let answerField = field;
  if (!answerField && pendingTask.pendingQuestions.length > 0) {
    // If no field specified, assume it's for the next question
    answerField = pendingTask.pendingQuestions[0].field;
  }

  console.log(`[Butler] Answer received for ${pendingTask.sessionId}: ${answerField} = "${answerValue}"`);

  // Add the answer
  await pendingTask.addAnswer(answerField, answerValue);

  // Check if all questions answered
  if (pendingTask.status === 'ready') {
    console.log(`[Butler] All questions answered for ${pendingTask.sessionId}, executing task...`);

    // Execute the task with all collected answers
    pendingTask.status = 'executing';
    await pendingTask.save();

    try {
      const result = await universalAgent.executeTask(
        userId,
        pendingTask.originalTask,
        {
          confirmed: true,
          learn: true,
          skipLearned: true,
          additionalInfo: pendingTask.getAnswersObject()
        }
      );

      // Mark as completed
      pendingTask.status = result.success ? 'completed' : 'failed';
      await pendingTask.save();

      return res.json({
        success: result.success,
        executed: true,
        message: result.message || (result.success ? 'Task completed!' : 'Task failed'),
        sessionId: result.sessionId,
        finalUrl: result.finalUrl,
        finalScreenshot: result.finalScreenshot,
        steps: result.steps?.length || 0
      });

    } catch (err) {
      pendingTask.status = 'failed';
      await pendingTask.save();

      return res.json({
        success: false,
        executed: true,
        message: `Task failed: ${err.message}`
      });
    }
  }

  // More questions remaining
  const nextQuestion = pendingTask.getNextQuestion();

  res.json({
    success: true,
    executed: false,
    message: 'Answer recorded',
    questionsRemaining: pendingTask.pendingQuestions.length,
    nextQuestion: nextQuestion,
    collectedSoFar: pendingTask.getAnswersObject()
  });
});

// @desc    Cancel a pending Butler task
// @route   DELETE /api/butler/pending/:sessionId
// @access  Private
exports.cancelPendingTask = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id.toString();

  const result = await PendingButlerTask.deleteOne({
    userId,
    sessionId
  });

  res.json({
    success: result.deletedCount > 0,
    message: result.deletedCount > 0 ? 'Pending task cancelled' : 'Task not found'
  });
});
