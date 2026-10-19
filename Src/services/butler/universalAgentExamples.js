/**
 * ================================================================
 * PHOENIX BUTLER - UNIVERSAL AGENT EXAMPLES
 * ================================================================
 *
 * Real-world examples demonstrating the Universal Agent's
 * capabilities. These examples show how to automate ANY task.
 *
 * Run with: node universalAgentExamples.js
 * ================================================================
 */

const universalAgent = require('./universalAgent');
const User = require('../../models/User');

// ================================================================
// Example 1: Social Media Account Creation
// ================================================================
async function exampleCreateFacebookAccount(userId) {
  console.log('\n=== Example 1: Create Facebook Account ===\n');

  const result = await universalAgent.executeTask(
    userId,
    "Create a Facebook account",
    {
      headless: false, // Show browser for this example
      confirmed: true
    }
  );

  console.log('Result:', result.success);
  console.log('Message:', result.message);
  console.log('Execution time:', result.executionTime, 'ms');
  console.log('Learned:', result.learned);

  return result;
}

// ================================================================
// Example 2: Flight Search
// ================================================================
async function exampleSearchFlights(userId) {
  console.log('\n=== Example 2: Search Flights to Miami ===\n');

  const result = await universalAgent.executeTask(
    userId,
    "Find flights to Miami for next Tuesday",
    {
      headless: true
    }
  );

  console.log('Result:', result.success);
  console.log('Message:', result.message);
  console.log('Steps completed:', result.steps.length);

  // Display screenshots from each step
  result.steps.forEach((step, i) => {
    if (step.screenshot) {
      console.log(`Step ${i + 1} screenshot available (${step.screenshot.length} bytes)`);
    }
  });

  return result;
}

// ================================================================
// Example 3: Food Ordering
// ================================================================
async function exampleOrderFood(userId) {
  console.log('\n=== Example 3: Order Food from DoorDash ===\n');

  // First time: Will ask for confirmation (high risk - spending money)
  const planResult = await universalAgent.executeTask(
    userId,
    "Order a burrito bowl from Chipotle on DoorDash"
  );

  if (planResult.needsConfirmation) {
    console.log('Confirmation needed:');
    console.log(planResult.confirmationPrompt);
    console.log('\nPlan:');
    planResult.steps.forEach(step => {
      console.log(`${step}. ${step}`);
    });

    // User confirms...
    const result = await universalAgent.executeTask(
      userId,
      "Order a burrito bowl from Chipotle on DoorDash",
      { confirmed: true }
    );

    console.log('Order placed:', result.success);
    return result;
  }

  return planResult;
}

// ================================================================
// Example 4: Money Transfer
// ================================================================
async function exampleSendMoney(userId) {
  console.log('\n=== Example 4: Send Money via Venmo ===\n');

  // Requires Venmo credentials in user's vault
  const result = await universalAgent.executeTask(
    userId,
    "Send $50 to John Smith on Venmo for dinner",
    {
      confirmed: true,
      headless: false
    }
  );

  console.log('Transfer result:', result.success);
  console.log('Message:', result.message);

  return result;
}

// ================================================================
// Example 5: Hotel Booking
// ================================================================
async function exampleBookHotel(userId) {
  console.log('\n=== Example 5: Search Hotels in NYC ===\n');

  const result = await universalAgent.executeTask(
    userId,
    "Find hotels in New York City for December 25-27 under $200/night"
  );

  console.log('Search completed:', result.success);
  console.log('Final URL:', result.finalUrl);

  // Screenshot shows results
  if (result.finalScreenshot) {
    console.log('Screenshot captured:', result.finalScreenshot.length, 'bytes');
  }

  return result;
}

// ================================================================
// Example 6: Job Application
// ================================================================
async function exampleApplyToJob(userId) {
  console.log('\n=== Example 6: Apply to Job on LinkedIn ===\n');

  const result = await universalAgent.executeTask(
    userId,
    "Apply to Software Engineer position at Google on LinkedIn",
    {
      confirmed: true
    }
  );

  console.log('Application submitted:', result.success);

  return result;
}

// ================================================================
// Example 7: Online Shopping
// ================================================================
async function exampleOnlineShopping(userId) {
  console.log('\n=== Example 7: Shop on Amazon ===\n');

  const result = await universalAgent.executeTask(
    userId,
    "Find wireless headphones on Amazon under $100 with good reviews"
  );

  console.log('Search completed:', result.success);
  console.log('Steps:', result.steps.map(s => s.description));

  return result;
}

// ================================================================
// Example 8: Subscription Management
// ================================================================
async function exampleCancelSubscription(userId) {
  console.log('\n=== Example 8: Cancel Spotify Subscription ===\n');

  const result = await universalAgent.executeTask(
    userId,
    "Cancel my Spotify Premium subscription",
    {
      confirmed: true,
      headless: false
    }
  );

  console.log('Cancellation result:', result.success);
  console.log('Message:', result.message);

  return result;
}

// ================================================================
// Example 9: Event Planning with Live Monitoring
// ================================================================
async function exampleLiveMonitoring(userId) {
  console.log('\n=== Example 9: Live Monitoring Example ===\n');

  // Set up event listeners
  universalAgent.on('task:started', ({ taskDescription }) => {
    console.log(`[EVENT] Task started: ${taskDescription}`);
  });

  universalAgent.on('task:planned', ({ plan }) => {
    console.log(`[EVENT] Plan created: ${plan.steps.length} steps`);
    console.log(`[EVENT] Estimated time: ${plan.estimatedTime}`);
  });

  universalAgent.on('step:started', ({ step }) => {
    console.log(`[EVENT] Step ${step.stepNumber}: ${step.description}`);
  });

  universalAgent.on('step:completed', ({ step, result }) => {
    console.log(`[EVENT] Step ${step.stepNumber} ${result.success ? 'succeeded' : 'failed'} (${result.duration}ms)`);
  });

  universalAgent.on('screenshot', ({ stepNumber, screenshot }) => {
    console.log(`[EVENT] Screenshot captured at step ${stepNumber} (${screenshot.length} bytes)`);
  });

  universalAgent.on('task:completed', ({ success, executionTime }) => {
    console.log(`[EVENT] Task completed: ${success} in ${executionTime}ms`);
  });

  // Execute task
  const result = await universalAgent.executeTask(
    userId,
    "Search for concert tickets in Los Angeles"
  );

  return result;
}

// ================================================================
// Example 10: Workflow Reuse
// ================================================================
async function exampleWorkflowReuse(userId) {
  console.log('\n=== Example 10: Workflow Learning & Reuse ===\n');

  // First execution: AI plans and executes
  console.log('First execution (with AI planning)...');
  const startTime1 = Date.now();
  const result1 = await universalAgent.executeTask(
    userId,
    "Order pizza from Domino's"
  );
  const time1 = Date.now() - startTime1;
  console.log(`Completed in ${time1}ms`);
  console.log('Learned:', result1.learned);

  // Wait a moment...
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Second execution: Uses learned workflow
  console.log('\nSecond execution (using learned workflow)...');
  const startTime2 = Date.now();
  const result2 = await universalAgent.executeTask(
    userId,
    "Order pizza from Domino's"
  );
  const time2 = Date.now() - startTime2;
  console.log(`Completed in ${time2}ms`);

  console.log(`\nSpeedup: ${(time1 / time2).toFixed(1)}x faster!`);

  return { result1, result2, speedup: time1 / time2 };
}

// ================================================================
// Example 11: Complex Multi-Step Task
// ================================================================
async function exampleComplexTask(userId) {
  console.log('\n=== Example 11: Complex Multi-Step Task ===\n');

  const result = await universalAgent.executeTask(
    userId,
    "Research best business ideas for Miami, create a list, and email it to myself",
    {
      confirmed: true
    }
  );

  console.log('Complex task result:', result.success);
  console.log('Steps completed:', result.steps.length);

  return result;
}

// ================================================================
// Example 12: Session Management
// ================================================================
async function exampleSessionManagement(userId) {
  console.log('\n=== Example 12: Session Management ===\n');

  // Start a long-running task
  const taskPromise = universalAgent.executeTask(
    userId,
    "Search for apartments in San Francisco under $3000/month"
  );

  // Wait a moment for session to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get all active sessions
  const sessions = Array.from(universalAgent.activeSessions.keys());
  console.log('Active sessions:', sessions);

  if (sessions.length > 0) {
    const sessionId = sessions[0];

    // Get session status
    const status = universalAgent.getSessionStatus(sessionId);
    console.log('Session status:', status);

    // Get live screenshot
    const screenshot = await universalAgent.getLiveScreenshot(sessionId);
    if (screenshot) {
      console.log('Live screenshot captured:', screenshot.length, 'bytes');
    }

    // Optionally stop session
    // await universalAgent.stopSession(sessionId);
  }

  // Wait for completion
  const result = await taskPromise;
  console.log('Task completed:', result.success);

  return result;
}

// ================================================================
// Example 13: Error Handling
// ================================================================
async function exampleErrorHandling(userId) {
  console.log('\n=== Example 13: Error Handling ===\n');

  try {
    // This will likely fail (invalid service)
    const result = await universalAgent.executeTask(
      userId,
      "Do something impossible on a website that doesn't exist"
    );

    console.log('Result:', result);

    if (!result.success) {
      console.log('Task failed as expected:', result.message);

      // Check individual step failures
      const failedSteps = result.steps?.filter(s => !s.success);
      if (failedSteps) {
        console.log('Failed steps:');
        failedSteps.forEach(step => {
          console.log(`- Step ${step.stepNumber}: ${step.error}`);
        });
      }
    }

    return result;

  } catch (error) {
    console.error('Exception caught:', error.message);
    return { success: false, error: error.message };
  }
}

// ================================================================
// Example 14: Plan Preview (No Execution)
// ================================================================
async function examplePlanPreview(userId) {
  console.log('\n=== Example 14: Plan Preview ===\n');

  // Generate plan without executing
  const plan = await universalAgent.planTask(
    "Buy Tesla stock on Robinhood",
    userId
  );

  console.log('Goal:', plan.goal);
  console.log('Service:', plan.service);
  console.log('Starting URL:', plan.url);
  console.log('Requires auth:', plan.requiresAuth);
  console.log('Risk level:', plan.riskLevel);
  console.log('Estimated time:', plan.estimatedTime);
  console.log('\nSteps:');

  plan.steps.forEach((step, i) => {
    console.log(`${i + 1}. ${step.description}`);
    console.log(`   Action: ${step.action}`);
    console.log(`   Target: ${JSON.stringify(step.target)}`);
    if (step.input) {
      console.log(`   Input: ${step.input}`);
    }
  });

  if (plan.needsConfirmation) {
    console.log('\nConfirmation required:', plan.confirmationMessage);
  }

  return plan;
}

// ================================================================
// Example 15: Credential Setup
// ================================================================
async function exampleCredentialSetup(userId) {
  console.log('\n=== Example 15: Credential Setup ===\n');

  // First, user needs to save credentials
  const user = await User.findById(userId);

  if (!user) {
    console.error('User not found');
    return;
  }

  // Save Venmo credentials (encrypted in real implementation)
  user.butlerCredentials = user.butlerCredentials || {};
  user.butlerCredentials.venmo = {
    username: 'user@email.com',
    password: 'secure_password',
    loginUrl: 'https://venmo.com/account/sign-in'
  };

  await user.save();
  console.log('Venmo credentials saved');

  // Now Universal Agent can use them
  const result = await universalAgent.executeTask(
    userId,
    "Send $20 to Sarah on Venmo",
    { confirmed: true }
  );

  console.log('Money sent:', result.success);

  return result;
}

// ================================================================
// MAIN RUNNER
// ================================================================
async function main() {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('PHOENIX BUTLER - UNIVERSAL AGENT EXAMPLES');
  console.log('='.repeat(70));

  // Test user ID (replace with real user ID)
  const userId = 'test_user_123';

  try {
    // Run examples (uncomment the ones you want to test)

    // await exampleCreateFacebookAccount(userId);
    // await exampleSearchFlights(userId);
    // await exampleOrderFood(userId);
    // await exampleSendMoney(userId);
    // await exampleBookHotel(userId);
    // await exampleApplyToJob(userId);
    // await exampleOnlineShopping(userId);
    // await exampleCancelSubscription(userId);
    // await exampleLiveMonitoring(userId);
    // await exampleWorkflowReuse(userId);
    // await exampleComplexTask(userId);
    // await exampleSessionManagement(userId);
    // await exampleErrorHandling(userId);

    // Safe examples (no external dependencies):
    await examplePlanPreview(userId);
    // await exampleCredentialSetup(userId);

  } catch (error) {
    console.error('\nExample failed:', error);
  }

  console.log('\n');
  console.log('='.repeat(70));
  console.log('EXAMPLES COMPLETE');
  console.log('='.repeat(70));
  console.log('\n');
}

// ================================================================
// Export examples for use elsewhere
// ================================================================
module.exports = {
  exampleCreateFacebookAccount,
  exampleSearchFlights,
  exampleOrderFood,
  exampleSendMoney,
  exampleBookHotel,
  exampleApplyToJob,
  exampleOnlineShopping,
  exampleCancelSubscription,
  exampleLiveMonitoring,
  exampleWorkflowReuse,
  exampleComplexTask,
  exampleSessionManagement,
  exampleErrorHandling,
  examplePlanPreview,
  exampleCredentialSetup
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
