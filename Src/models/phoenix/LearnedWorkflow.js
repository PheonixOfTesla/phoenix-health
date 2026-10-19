/**
 * LearnedWorkflow Model
 * Stores successful automation patterns that Phoenix learns over time.
 * When Phoenix figures out how to do something new, it saves the workflow
 * here so it can execute it instantly next time.
 */

const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  action: {
    type: String,
    enum: ['navigate', 'click', 'type', 'select', 'scroll', 'wait', 'screenshot', 'extract', 'verify', 'api_call'],
    required: true
  },
  target: {
    // CSS selector, URL, or description
    selector: String,
    url: String,
    description: String
  },
  value: String, // Text to type, option to select, etc.
  waitCondition: {
    type: { type: String, enum: ['selector', 'navigation', 'timeout'] },
    value: String,
    timeout: { type: Number, default: 10000 }
  },
  screenshot: Boolean, // Whether to take screenshot after this step
  extractData: {
    enabled: Boolean,
    selectors: [String],
    variables: [String] // Variable names to store extracted data
  },
  fallback: {
    enabled: Boolean,
    alternateSelectors: [String],
    errorHandler: String // 'retry', 'skip', 'abort'
  }
});

const learnedWorkflowSchema = new mongoose.Schema({
  // Workflow identification
  name: { type: String, required: true, index: true },
  category: {
    type: String,
    enum: ['food', 'ride', 'shopping', 'finance', 'travel', 'communication', 'productivity', 'entertainment', 'custom'],
    default: 'custom'
  },

  // Natural language triggers - what user might say
  triggers: [{
    phrase: String,
    confidence: { type: Number, default: 0.8 }
  }],

  // Required information from user
  requiredParams: [{
    name: String,
    type: { type: String, enum: ['string', 'number', 'date', 'location', 'email', 'phone', 'url'] },
    description: String, // What to ask user if missing
    extractionPattern: String, // Regex to extract from user message
    optional: { type: Boolean, default: false },
    defaultValue: mongoose.Schema.Types.Mixed
  }],

  // The automation steps
  steps: [workflowStepSchema],

  // Service/website this workflow interacts with
  service: {
    name: String, // 'doordash', 'amazon', 'gmail', etc.
    baseUrl: String,
    loginRequired: { type: Boolean, default: true },
    credentials: {
      type: { type: String, enum: ['oauth', 'session', 'credentials', 'none'] },
      servicePath: String // Path to credentials in user.butlerCredentials
    }
  },

  // Learning metadata
  learned: {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    originalRequest: String,
    learnedAt: { type: Date, default: Date.now },
    researchSources: [String], // URLs that were consulted
    aiModel: String // Which AI model created this workflow
  },

  // Success metrics
  metrics: {
    timesExecuted: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    avgExecutionTime: Number,
    lastExecuted: Date,
    successRate: { type: Number, default: 0 }
  },

  // Scope: global (everyone) or user-specific
  scope: {
    type: String,
    enum: ['global', 'user'],
    default: 'global'
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Only if scope='user'

  // Status
  status: {
    type: String,
    enum: ['draft', 'testing', 'active', 'deprecated'],
    default: 'active'
  },

  // Version control for workflow updates
  version: { type: Number, default: 1 },
  previousVersions: [{
    version: Number,
    steps: [workflowStepSchema],
    deprecatedAt: Date,
    reason: String
  }]
}, {
  timestamps: true
});

// Indexes for fast lookup
learnedWorkflowSchema.index({ 'triggers.phrase': 'text' });
learnedWorkflowSchema.index({ category: 1, status: 1 });
learnedWorkflowSchema.index({ 'service.name': 1 });
learnedWorkflowSchema.index({ scope: 1, userId: 1 });

// Update success rate after execution
learnedWorkflowSchema.methods.recordExecution = async function(success, executionTime) {
  this.metrics.timesExecuted++;
  if (success) {
    this.metrics.successCount++;
  } else {
    this.metrics.failureCount++;
  }
  this.metrics.successRate = this.metrics.successCount / this.metrics.timesExecuted;
  this.metrics.lastExecuted = new Date();

  // Update average execution time
  if (executionTime) {
    if (this.metrics.avgExecutionTime) {
      this.metrics.avgExecutionTime = (this.metrics.avgExecutionTime + executionTime) / 2;
    } else {
      this.metrics.avgExecutionTime = executionTime;
    }
  }

  await this.save();
};

// Find matching workflow for a user message
learnedWorkflowSchema.statics.findMatchingWorkflow = async function(message, userId = null) {
  const normalizedMessage = message.toLowerCase();
  const messageWords = normalizedMessage.split(/\s+/).filter(w => w.length > 2);

  // Common words to ignore for matching
  const stopWords = ['the', 'from', 'for', 'and', 'order', 'get', 'book', 'make', 'please', 'can', 'you', 'want'];

  // Get candidate workflows
  let workflows = await this.find({
    status: 'active',
    $or: [
      { scope: 'global' },
      { scope: 'user', userId: userId }
    ]
  });

  // Score each workflow by entity matching (service names, specific items)
  const scoredWorkflows = workflows.map(wf => {
    let bestScore = 0;

    wf.triggers.forEach(trigger => {
      const triggerPhrase = trigger.phrase.toLowerCase();
      const triggerWords = triggerPhrase.split(/\s+/).filter(w => w.length > 2);

      // Extract key entities (words that aren't stop words)
      const triggerEntities = triggerWords.filter(w => !stopWords.includes(w));
      const messageEntities = messageWords.filter(w => !stopWords.includes(w));

      // Check for service name match (critical entity like "dominos", "starbucks", "uber")
      const serviceMatch = wf.service?.name && normalizedMessage.includes(wf.service.name.toLowerCase());

      // Calculate entity overlap
      const matchedEntities = triggerEntities.filter(w => messageEntities.includes(w));
      const entityScore = matchedEntities.length / Math.max(triggerEntities.length, 1);

      // Require at least 60% entity match AND service name match for high confidence
      let score = 0;
      if (serviceMatch && entityScore >= 0.5) {
        score = 1.0 + entityScore; // Perfect match
      } else if (entityScore >= 0.8) {
        score = entityScore; // High keyword match
      }

      bestScore = Math.max(bestScore, score);
    });

    return { workflow: wf, score: bestScore };
  });

  // Only return if we have a strong match (score > 0.8)
  const bestMatch = scoredWorkflows
    .filter(s => s.score >= 0.8)
    .sort((a, b) => b.score - a.score || b.workflow.metrics.successRate - a.workflow.metrics.successRate)[0];

  return bestMatch ? bestMatch.workflow : null;
};

module.exports = mongoose.model('LearnedWorkflow', learnedWorkflowSchema);
