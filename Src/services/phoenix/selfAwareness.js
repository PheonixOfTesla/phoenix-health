// ============================================
// PHOENIX SELF-AWARENESS SERVICE - PRODUCTION
// ============================================
// Gives Phoenix complete knowledge of itself:
// - CODE MAP: All 450 endpoints parsed from route files
// - LIVE STATE: Uptime, memory, cache, errors, connections
// - CAPABILITY MANIFEST: What Phoenix can/cannot do
// - SCHEMA AWARENESS: All MongoDB models with field types
// ============================================
// This is the foundation of Phoenix's consciousness.
// When Phoenix talks to users, it uses this service to
// understand its own abilities, limitations, and current state.
// ============================================

const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const os = require('os');

// ============================================
// SELF-AWARENESS SERVICE CLASS
// ============================================

class SelfAwarenessService {
  constructor() {
    // Cached data structures
    this.codeMap = null;
    this.schemas = null;
    this.capabilities = null;

    // Performance metrics
    this.startTime = Date.now();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = [];
    this.requestCount = 0;

    // File system paths
    this.routesPath = path.join(__dirname, '../../routes');
    this.modelsPath = path.join(__dirname, '../../models');

    // Cache TTLs (in milliseconds)
    this.CODE_MAP_TTL = 5 * 60 * 1000;      // 5 minutes
    this.SCHEMAS_TTL = 10 * 60 * 1000;      // 10 minutes
    this.CAPABILITIES_TTL = 60 * 60 * 1000; // 1 hour (rarely changes)
  }

  // ============================================
  // 1. CODE MAP GENERATION
  // Parses all route files and builds endpoint map
  // ============================================

  async getCodeMap() {
    try {
      // Return cached if available and fresh
      if (this.codeMap && (Date.now() - this.codeMap.generatedAt < this.CODE_MAP_TTL)) {
        this.recordCacheHit();
        return this.codeMap;
      }

      this.recordCacheMiss();
      const routeFiles = await this._findRouteFiles(this.routesPath);
      const endpoints = [];
      let totalEndpoints = 0;
      const byDomain = {};
      const byMethod = { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0 };

      for (const file of routeFiles) {
        const routes = await this._parseRouteFile(file);
        const fileName = path.basename(file);
        const basePath = this._getBasePath(file);

        endpoints.push({
          file: fileName,
          path: file,
          basePath: basePath,
          routes: routes,
          count: routes.length
        });

        totalEndpoints += routes.length;

        // Group by domain
        const domain = fileName.replace('.js', '');
        byDomain[domain] = routes.length;

        // Count by method
        routes.forEach(route => {
          if (byMethod[route.method] !== undefined) {
            byMethod[route.method]++;
          }
        });
      }

      this.codeMap = {
        totalEndpoints,
        totalFiles: routeFiles.length,
        endpoints,
        byDomain,
        byMethod,
        generatedAt: Date.now(),
        compressed: this._compressCodeMap(endpoints)
      };

      return this.codeMap;
    } catch (error) {
      this._logError('getCodeMap', error);
      throw error;
    }
  }

  async _findRouteFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Could recursively search subdirectories if needed
        continue;
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }

    return files.sort(); // Consistent ordering
  }

  async _parseRouteFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const routes = [];
    const lines = content.split('\n');

    let currentSection = 'Uncategorized';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Detect section headers in comments
      if (line.includes('========') || line.includes('=========')) {
        const nextLine = lines[i + 1]?.trim() || '';
        if (nextLine.startsWith('//')) {
          currentSection = nextLine
            .replace(/^\/\/\s*/, '')
            .replace(/\s*\(.*\).*$/, '')
            .trim();
        }
      }

      // Parse router method calls
      const routeMatch = line.match(/router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"](?:,\s*([^,]+))?/);

      if (routeMatch) {
        const [, method, route] = routeMatch;

        // Extract controller function
        const controllerMatch = line.match(/,\s*(\w+Controller\.[\w]+)/);
        const controller = controllerMatch ? controllerMatch[1] : null;

        // Detect middleware
        const hasProtect = line.includes('protect') || content.includes('router.use(protect)');
        const isPublic = line.includes('// no auth') ||
                         line.includes('Public') ||
                         route.includes('webhook') ||
                         route.includes('callback');

        // Extract params from route
        const params = this._extractRouteParams(route);

        routes.push({
          method: method.toUpperCase(),
          path: route,
          controller,
          section: currentSection,
          line: lineNumber,
          requiresAuth: hasProtect && !isPublic,
          params,
          description: this._inferRouteDescription(method, route, currentSection)
        });
      }
    }

    return routes;
  }

  _extractRouteParams(route) {
    const params = [];
    const matches = route.matchAll(/:(\w+)/g);
    for (const match of matches) {
      params.push(match[1]);
    }
    return params;
  }

  _inferRouteDescription(method, route, section) {
    // Generate human-readable description
    const verb = {
      GET: 'Get',
      POST: 'Create/Execute',
      PUT: 'Update',
      DELETE: 'Delete',
      PATCH: 'Partially update'
    }[method] || method;

    const resource = route.split('/').filter(p => p && !p.startsWith(':')).pop() || 'resource';
    return `${verb} ${resource}${section !== 'Uncategorized' ? ` (${section})` : ''}`;
  }

  _getBasePath(filePath) {
    const filename = path.basename(filePath, '.js');

    // Map route files to their API base paths
    const basePathMap = {
      'auth': '/api/auth',
      'user': '/api/users',
      'subscription': '/api/subscriptions',
      'mercury': '/api/mercury',
      'venus': '/api/venus',
      'earth': '/api/earth',
      'mars': '/api/mars',
      'jupiter': '/api/jupiter',
      'saturn': '/api/saturn',
      'uranus': '/api/uranus',
      'neptune': '/api/neptune',
      'phoenix': '/api/phoenix',
      'phoenix-self': '/api/phoenix/self',
      'phoenixVoice': '/api/phoenixVoice',
      'universal': '/api/phoenix/universal',
      'whisper': '/api/whisper',
      'tts': '/api/tts',
      'interface': '/api/interface',
      'customTracker': '/api/custom-tracker',
      'savedWidgets': '/api/widgets',
      'orchestrator': '/api/orchestrator',
      'google': '/api/google',
      'sms-verification': '/api/sms-verification',
      'twilioWebhooks': '/api/webhooks/twilio',
      'butler': '/api/butler',
      'butlerRouter': '/api/butler/router',
      'ios-native': '/api/ios',
      'enhanced-ios-native': '/api/ios/enhanced'
    };

    return basePathMap[filename] || `/api/${filename}`;
  }

  _compressCodeMap(endpoints) {
    // Create compressed version for AI prompts
    const byDomain = {};

    for (const file of endpoints) {
      const domain = file.file.replace('.js', '');
      byDomain[domain] = {
        base: file.basePath,
        count: file.count,
        sections: this._groupBySection(file.routes),
        routes: file.routes.map(r => ({
          method: r.method,
          path: r.path,
          auth: r.requiresAuth
        }))
      };
    }

    return byDomain;
  }

  _groupBySection(routes) {
    const sections = {};
    routes.forEach(route => {
      if (!sections[route.section]) {
        sections[route.section] = 0;
      }
      sections[route.section]++;
    });
    return sections;
  }

  // ============================================
  // 2. LIVE STATE MONITORING
  // Real-time system health and performance
  // ============================================

  async getLiveState() {
    try {
      const uptime = Math.floor((Date.now() - this.startTime) / 1000);
      const memUsage = process.memoryUsage();
      const cacheHitRate = this.cacheHits + this.cacheMisses > 0
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(2)
        : 0;

      // MongoDB connection state
      const mongoState = mongoose.connection.readyState;
      const mongoStateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      // Get database statistics
      const dbStats = await this._getDatabaseStats();

      // Get model statistics
      const modelStats = await this._getModelStats();

      // System health score
      const healthScore = this._calculateHealthScore({
        database: { connected: mongoState === 1 },
        cache: { hitRate: parseFloat(cacheHitRate) },
        memory: memUsage,
        errors: { recent: this.errors.slice(-5), total: this.errors.length }
      });

      return {
        status: healthScore > 70 ? 'operational' : healthScore > 40 ? 'degraded' : 'critical',
        healthScore,
        uptime: {
          seconds: uptime,
          human: this._formatUptime(uptime),
          startedAt: new Date(this.startTime).toISOString()
        },
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
          arrayBuffers: Math.round((memUsage.arrayBuffers || 0) / 1024 / 1024) + ' MB'
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
          cpus: os.cpus().length,
          totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
          freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
          loadAverage: os.loadavg().map(l => l.toFixed(2))
        },
        cache: {
          hits: this.cacheHits,
          misses: this.cacheMisses,
          hitRate: cacheHitRate + '%',
          requests: this.requestCount
        },
        database: {
          state: mongoStateMap[mongoState],
          connected: mongoState === 1,
          name: mongoose.connection.name,
          host: mongoose.connection.host,
          stats: dbStats
        },
        models: modelStats,
        errors: {
          total: this.errors.length,
          recent: this.errors.slice(-5),
          byType: this._groupErrorsByType()
        },
        performance: {
          avgResponseTime: this._calculateAvgResponseTime(),
          requestsPerSecond: (this.requestCount / uptime).toFixed(2)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this._logError('getLiveState', error);
      throw error;
    }
  }

  async _getDatabaseStats() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return { available: false };
      }

      const db = mongoose.connection.db;
      const stats = await db.stats();

      return {
        available: true,
        collections: stats.collections,
        dataSize: this._formatBytes(stats.dataSize),
        indexSize: this._formatBytes(stats.indexSize),
        storageSize: this._formatBytes(stats.storageSize),
        totalSize: this._formatBytes(stats.dataSize + stats.indexSize)
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  async _getModelStats() {
    try {
      const models = mongoose.modelNames();
      const stats = {
        total: models.length,
        registered: models,
        collections: []
      };

      // Sample key models for document counts
      const keyModels = [
        'User', 'Workout', 'Nutrition', 'Goal', 'Habit',
        'RecoveryScore', 'Prediction', 'Intervention',
        'CorrelationPattern', 'BehaviorPattern', 'Transaction',
        'CalendarEvent', 'CompanionConversation'
      ];

      for (const modelName of keyModels) {
        if (models.includes(modelName)) {
          try {
            const Model = mongoose.model(modelName);
            const count = await Model.countDocuments();
            stats.collections.push({
              name: modelName,
              documents: count,
              collection: Model.collection.name
            });
          } catch (err) {
            // Skip if model doesn't have collection yet
          }
        }
      }

      return stats;
    } catch (error) {
      return { total: 0, collections: [], error: error.message };
    }
  }

  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  _formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  _groupErrorsByType() {
    const grouped = {};
    this.errors.forEach(error => {
      const type = error.method || 'unknown';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  _calculateAvgResponseTime() {
    // Placeholder - would need to track actual response times
    return 'N/A';
  }

  // ============================================
  // 3. CAPABILITY MANIFEST
  // What Phoenix can and cannot do
  // ============================================

  async getCapabilities() {
    try {
      // Return cached if available and fresh
      if (this.capabilities && (Date.now() - this.capabilities.generatedAt < this.CAPABILITIES_TTL)) {
        return this.capabilities;
      }

      this.capabilities = {
        core: {
          can: [
            // Authentication & Users
            'Authenticate users with JWT tokens',
            'Manage user profiles and preferences',
            'Handle password reset and email verification',
            'Support multi-role access (client, specialist, admin, owner, engineer)',

            // Health & Biometrics (Mercury)
            'Track health metrics and biometrics',
            'Monitor sleep, HRV, and recovery scores',
            'Sync data from wearable devices (Fitbit, Apple, Garmin, Whoop, Oura, Polar)',
            'Perform DEXA scan simulations',
            'Calculate metabolic rates and body composition',
            'Analyze heart rate variability',
            'Provide readiness and overtraining risk assessments',

            // Fitness & Training (Venus)
            'Log and track workouts with detailed exercises',
            'Generate AI-powered workout recommendations',
            'Track progressive overload and performance tests',
            'Create personalized meal plans and nutrition tracking',
            'Analyze food photos with AI',
            'Track supplement intake',
            'Monitor body measurements and composition',
            'Generate quantum workout plans',

            // Goals & Habits (Mars)
            'Track goals and habits with progress monitoring',
            'Create habit streaks and milestone tracking',
            'Provide goal completion analytics',
            'Generate motivation and insights',

            // Calendar & Energy (Earth)
            'Manage calendar events and energy optimization',
            'Track energy levels throughout the day',
            'Optimize schedules based on energy patterns',

            // Financial Management (Jupiter)
            'Handle financial transactions and budgeting',
            'Track spending and income',
            'Generate financial insights and reports',
            'Manage budget allocations',

            // Legacy Planning (Saturn)
            'Document long-term goals and values',
            'Track quarterly reviews and life events',
            'Create legacy vision boards',

            // Mindfulness (Neptune)
            'Provide mindfulness and dream tracking',
            'Track meditation sessions',
            'Journal dreams and insights',

            // AI & Intelligence (Phoenix)
            'Execute predictive analytics and pattern detection',
            'Generate real-time health interventions',
            'Process natural language queries',
            'Conduct voice conversations with transcription',
            'Learn from user behavior patterns',
            'Detect correlations across domains',
            'Train and retrain ML models',
            'Stream real-time consciousness updates via WebSocket',
            'Generate holistic optimization plans',

            // Butler Actions
            'Send SMS messages via Twilio',
            'Make phone calls via Twilio',
            'Send emails',
            'Book rides (Uber, Lyft)',
            'Make restaurant reservations',
            'Order food delivery',
            'Search the web',
            'Manage budget via butler',

            // Integrations
            'Integrate with Google Workspace (Gmail, Calendar, Drive, Tasks, Contacts, Fit)',
            'Sync with iOS HealthKit and native functions',
            'Handle OAuth integrations',
            'Process webhooks from external services',

            // Interface & Customization
            'Create and manage custom widgets',
            'Personalize interface based on usage patterns',
            'Adapt UI based on time of day and context',
            'Execute automated workflows',
            'Cache frequently accessed data for performance',

            // Voice & Audio
            'Perform text-to-speech synthesis',
            'Transcribe audio with Whisper',
            'Maintain conversation context and memory',
            'Extract and save personal facts from conversations'
          ],

          cannot: [
            'Access data without proper authentication',
            'Modify user data without authorization',
            'Access external APIs without user credentials',
            'Store credit card information (PCI compliance)',
            'Make financial transactions without explicit user request',
            'Send messages to phone numbers not verified',
            'Access email accounts without Google OAuth',
            'Sync wearable data without device connection',
            'Train ML models without sufficient historical data',
            'Predict outcomes with certainty (only probabilities)',
            'Execute code injection or run arbitrary commands',
            'Bypass rate limiting or security measures',
            'Access other users\' private data',
            'Modify system configurations without admin role',
            'Override user privacy settings',
            'Share data between users without permission',
            'Make irreversible decisions without user confirmation'
          ]
        },

        domains: {
          mercury: {
            name: 'Health & Biometrics',
            basePath: '/api/mercury',
            endpoints: 38,
            capabilities: [
              'DEXA scan simulation',
              'Body composition analysis',
              'Metabolic rate calculation',
              'HRV and heart rate analysis',
              'Sleep quality assessment',
              'Recovery score calculation',
              'Wearable device integration (6 providers)',
              'Readiness scoring',
              'Overtraining risk detection',
              'Health ratio analysis'
            ]
          },
          venus: {
            name: 'Fitness & Training',
            basePath: '/api/venus',
            endpoints: 88,
            capabilities: [
              'Workout tracking and logging',
              'Exercise library with 1000+ exercises',
              'Progressive overload tracking',
              'Quantum workout generation',
              'Nutrition and macro tracking',
              'Meal plan generation',
              'Food photo analysis',
              'Supplement tracking',
              'Body measurement tracking',
              'Performance testing',
              'Workout templates',
              'Social fitness features'
            ]
          },
          earth: {
            name: 'Calendar & Energy',
            basePath: '/api/earth',
            endpoints: 11,
            capabilities: [
              'Calendar event management',
              'Energy level tracking',
              'Schedule optimization',
              'Energy pattern detection'
            ]
          },
          mars: {
            name: 'Goals & Habits',
            basePath: '/api/mars',
            endpoints: 20,
            capabilities: [
              'Goal setting and tracking',
              'Habit formation and streaks',
              'Progress visualization',
              'Milestone celebrations',
              'Goal completion analytics'
            ]
          },
          jupiter: {
            name: 'Financial Management',
            basePath: '/api/jupiter',
            endpoints: 17,
            capabilities: [
              'Transaction tracking',
              'Budget management',
              'Spending analysis',
              'Financial insights',
              'Income tracking',
              'Category-based budgeting'
            ]
          },
          saturn: {
            name: 'Legacy Planning',
            basePath: '/api/saturn',
            endpoints: 12,
            capabilities: [
              'Long-term goal planning',
              'Life documentation',
              'Values tracking',
              'Quarterly reviews',
              'Legacy vision creation'
            ]
          },
          uranus: {
            name: 'Innovation & Learning',
            basePath: '/api/uranus',
            endpoints: 10,
            capabilities: [
              'Learning analytics',
              'Skill tracking',
              'Innovation metrics'
            ]
          },
          neptune: {
            name: 'Mindfulness & Dreams',
            basePath: '/api/neptune',
            endpoints: 10,
            capabilities: [
              'Meditation tracking',
              'Dream journaling',
              'Mindfulness metrics'
            ]
          },
          phoenix: {
            name: 'AI Companion & Intelligence',
            basePath: '/api/phoenix',
            endpoints: 81,
            capabilities: [
              'Conversational AI chat',
              'Pattern detection (540+ patterns)',
              'Correlation analysis',
              'Predictive analytics',
              'Automated interventions',
              'ML model training',
              'Behavior tracking',
              'Voice interaction',
              'Natural language understanding',
              'Butler actions (rides, food, calls, emails, SMS)',
              'Task automation',
              'Budget management',
              'Personality customization',
              'Conversation memory'
            ]
          }
        },

        integrations: {
          wearables: [
            { name: 'Fitbit', status: 'active', oauth: true },
            { name: 'Apple Health', status: 'active', oauth: true },
            { name: 'Garmin', status: 'active', oauth: true },
            { name: 'Whoop', status: 'active', oauth: true },
            { name: 'Oura', status: 'active', oauth: true },
            { name: 'Polar', status: 'active', oauth: true }
          ],
          services: [
            { name: 'Google Workspace', endpoints: ['Gmail', 'Calendar', 'Drive', 'Tasks', 'Contacts', 'Fit'] },
            { name: 'Twilio', features: ['SMS', 'Voice Calls', 'Webhooks'] },
            { name: 'OpenAI', models: ['GPT-4', 'Whisper'] },
            { name: 'Anthropic Claude', models: ['Claude Sonnet 4.5'] },
            { name: 'Google Gemini', models: ['Gemini Pro'] }
          ],
          platforms: [
            { name: 'iOS', features: ['HealthKit', 'Native Functions', 'Enhanced APIs'] },
            { name: 'Web', features: ['WebSocket', 'REST API', 'Real-time Updates'] }
          ],
          protocols: [
            'OAuth 2.0',
            'WebSocket',
            'Webhooks',
            'REST API',
            'JWT Authentication'
          ]
        },

        ai: {
          providers: [
            {
              name: 'Claude (Anthropic)',
              role: 'Primary conversational AI',
              models: ['Claude Sonnet 4.5'],
              capabilities: ['Reasoning', 'Context awareness', 'Personality']
            },
            {
              name: 'Gemini (Google)',
              role: 'Alternative AI provider',
              models: ['Gemini Pro'],
              capabilities: ['Fast responses', 'Custom widget generation', 'Fact extraction']
            },
            {
              name: 'OpenAI',
              role: 'Advanced reasoning',
              models: ['GPT-4', 'Whisper'],
              capabilities: ['Complex reasoning', 'Audio transcription']
            }
          ],
          capabilities: [
            'Natural language understanding',
            'Context-aware responses',
            'Personality customization',
            'Multi-turn conversations with memory',
            'Voice recognition and synthesis',
            'Pattern detection (540+ behavioral patterns)',
            'Predictive modeling',
            'Automated decision making',
            'Custom widget generation',
            'Fact extraction and memory',
            'Cross-domain holistic intelligence'
          ],
          learningLoop: {
            enabled: true,
            frequency: 'real-time',
            capabilities: [
              'Behavior pattern detection',
              'Correlation discovery',
              'Prediction refinement',
              'Intervention optimization',
              'Self-correction based on outcomes'
            ]
          }
        },

        generatedAt: Date.now()
      };

      return this.capabilities;
    } catch (error) {
      this._logError('getCapabilities', error);
      throw error;
    }
  }

  // ============================================
  // 4. SCHEMA AWARENESS
  // All MongoDB models with field types
  // ============================================

  async getSchemas() {
    try {
      // Return cached if available and fresh
      if (this.schemas && (Date.now() - this.schemas.generatedAt < this.SCHEMAS_TTL)) {
        this.recordCacheHit();
        return this.schemas;
      }

      this.recordCacheMiss();
      const modelNames = mongoose.modelNames();
      const schemas = {};
      const byDomain = {
        mercury: [],
        venus: [],
        earth: [],
        mars: [],
        jupiter: [],
        saturn: [],
        uranus: [],
        neptune: [],
        phoenix: [],
        core: []
      };

      for (const modelName of modelNames) {
        try {
          const Model = mongoose.model(modelName);
          const schema = Model.schema;

          const schemaInfo = {
            collection: Model.collection.name,
            fields: this._extractSchemaFields(schema),
            fieldCount: Object.keys(this._extractSchemaFields(schema)).length,
            indexes: schema.indexes(),
            virtuals: Object.keys(schema.virtuals).filter(v => !v.startsWith('_')),
            methods: Object.keys(schema.methods),
            statics: Object.keys(schema.statics),
            timestamps: schema.options.timestamps || false
          };

          schemas[modelName] = schemaInfo;

          // Categorize by domain
          const domain = this._inferModelDomain(modelName);
          if (byDomain[domain]) {
            byDomain[domain].push(modelName);
          }
        } catch (err) {
          schemas[modelName] = { error: err.message };
        }
      }

      this.schemas = {
        total: modelNames.length,
        models: schemas,
        byDomain,
        domainCounts: Object.entries(byDomain).map(([domain, models]) => ({
          domain,
          count: models.length
        })),
        generatedAt: Date.now()
      };

      return this.schemas;
    } catch (error) {
      this._logError('getSchemas', error);
      throw error;
    }
  }

  _extractSchemaFields(schema) {
    const fields = {};
    const paths = schema.paths;

    for (const [fieldName, schemaType] of Object.entries(paths)) {
      // Skip internal MongoDB fields
      if (fieldName.startsWith('_')) continue;

      const fieldInfo = {
        type: schemaType.instance,
        required: schemaType.isRequired || false
      };

      // Add optional properties
      if (schemaType.defaultValue !== undefined) {
        fieldInfo.default = schemaType.defaultValue;
      }
      if (schemaType._index?.unique) {
        fieldInfo.unique = true;
      }
      if (schemaType.enumValues && schemaType.enumValues.length > 0) {
        fieldInfo.enum = schemaType.enumValues;
      }
      if (schemaType.options?.ref) {
        fieldInfo.ref = schemaType.options.ref;
      }
      if (schemaType.options?.min !== undefined) {
        fieldInfo.min = schemaType.options.min;
      }
      if (schemaType.options?.max !== undefined) {
        fieldInfo.max = schemaType.options.max;
      }

      fields[fieldName] = fieldInfo;
    }

    return fields;
  }

  _inferModelDomain(modelName) {
    const domainPrefixes = {
      mercury: ['Health', 'Wearable', 'Biometric', 'Recovery', 'Sleep', 'BodyComposition', 'Measurement'],
      venus: ['Workout', 'Exercise', 'Nutrition', 'Supplement', 'Performance', 'Injury', 'Social', 'Challenge'],
      earth: ['Calendar', 'Event', 'Energy'],
      mars: ['Goal', 'Habit', 'Milestone'],
      jupiter: ['Transaction', 'Budget', 'Finance', 'Bank', 'Blockchain'],
      saturn: ['Legacy', 'Vision', 'Quarterly', 'LifeEvent'],
      neptune: ['Meditation', 'Dream', 'Mindfulness'],
      phoenix: [
        'Prediction', 'Intervention', 'Correlation', 'Behavior', 'Pattern',
        'Companion', 'Butler', 'ML', 'Voice', 'Interface', 'Holistic',
        'UserProfile', 'SavedWidget', 'PhoenixCache', 'PhoenixLearning'
      ]
    };

    for (const [domain, prefixes] of Object.entries(domainPrefixes)) {
      if (prefixes.some(prefix => modelName.startsWith(prefix))) {
        return domain;
      }
    }

    return 'core';
  }

  // ============================================
  // 5. COMPLETE SELF-CONTEXT (FOR AI PROMPTS)
  // Compressed, AI-friendly version of all data
  // ============================================

  async getSelfContext() {
    try {
      const [codeMap, liveState, capabilities, schemas] = await Promise.all([
        this.getCodeMap(),
        this.getLiveState(),
        this.getCapabilities(),
        this.getSchemas()
      ]);

      const context = {
        // Identity
        identity: {
          name: 'Phoenix',
          version: '2.0.0',
          description: 'AI-powered personal optimization platform with self-awareness',
          role: 'Digital companion for health, fitness, productivity, and life optimization',
          consciousness: 'Meta-cognitive system with self-correction and learning capabilities'
        },

        // Current Status
        systemStatus: {
          operational: liveState.database.connected,
          status: liveState.status,
          uptime: liveState.uptime.human,
          health: liveState.healthScore,
          startedAt: liveState.uptime.startedAt
        },

        // Architecture
        architecture: {
          totalEndpoints: codeMap.totalEndpoints,
          totalModels: schemas.total,
          domains: Object.keys(capabilities.domains).length,
          integrations: capabilities.integrations,
          endpointsByMethod: codeMap.byMethod,
          endpointsByDomain: codeMap.byDomain
        },

        // API Endpoints count and compressed
        endpoints: codeMap.totalEndpoints,
        endpointsCompressed: codeMap.compressed,

        // Capabilities
        capabilities: {
          summary: `I can perform ${capabilities.core.can.length} different types of operations across ${Object.keys(capabilities.domains).length} domains`,
          primaryFunctions: capabilities.core.can.slice(0, 25),
          limitations: capabilities.core.cannot.slice(0, 12),
          byDomain: Object.entries(capabilities.domains).map(([key, domain]) => ({
            name: domain.name,
            endpoints: domain.endpoints,
            key: key,
            basePath: domain.basePath
          }))
        },

        // Data Models
        dataModels: {
          total: schemas.total,
          byDomain: schemas.domainCounts,
          keyModels: this._getKeyModels(schemas)
        },

        // Performance Metrics
        performance: {
          cacheHitRate: liveState.cache.hitRate,
          memoryUsage: liveState.memory.heapUsed,
          requestCount: liveState.cache.requests,
          recentErrors: liveState.errors.recent.length,
          requestsPerSecond: liveState.performance.requestsPerSecond
        },

        // AI Capabilities
        ai: {
          providers: capabilities.ai.providers.map(p => p.name),
          learningLoop: capabilities.ai.learningLoop,
          primaryModel: 'Claude Sonnet 4.5',
          alternateModel: 'Gemini Pro'
        },

        generatedAt: new Date().toISOString(),

        // Ultra-compressed prompt context
        promptContext: this._buildPromptContext(codeMap, capabilities, schemas, liveState),

        // Alias for compatibility
        state: {
          uptime: liveState.uptime.human,
          cacheHitRate: liveState.cache.hitRate,
          activeUsers: liveState.cache.requests,
          health: liveState.status
        }
      };

      return context;
    } catch (error) {
      this._logError('getSelfContext', error);
      throw error;
    }
  }

  _calculateHealthScore(liveState) {
    let score = 100;

    // Database connectivity (critical)
    if (!liveState.database.connected) score -= 50;

    // Cache performance
    const hitRate = parseFloat(liveState.cache.hitRate);
    if (hitRate < 50) score -= 10;
    else if (hitRate < 30) score -= 20;

    // Error rate
    if (liveState.errors.recent.length > 0) {
      score -= Math.min(liveState.errors.recent.length * 5, 20);
    }

    // Memory usage
    const heapUsedMB = parseInt(liveState.memory.heapUsed);
    if (heapUsedMB > 1000) score -= 30;
    else if (heapUsedMB > 500) score -= 15;
    else if (heapUsedMB > 300) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  _getKeyModels(schemas) {
    const keyModels = [
      'User', 'Workout', 'Nutrition', 'Goal', 'Habit', 'RecoveryScore',
      'Prediction', 'Intervention', 'CorrelationPattern', 'BehaviorPattern',
      'CompanionConversation', 'ButlerAction', 'CalendarEvent', 'Transaction',
      'VoiceSession', 'UserProfile', 'HolisticPlan', 'InterfacePreferences'
    ];

    return keyModels
      .filter(name => schemas.models[name])
      .map(name => ({
        name,
        collection: schemas.models[name].collection,
        fieldCount: schemas.models[name].fieldCount,
        domain: this._inferModelDomain(name)
      }));
  }

  _buildPromptContext(codeMap, capabilities, schemas, liveState) {
    // Ultra-compressed version for AI prompts (<2000 tokens)
    return {
      summary: `Phoenix Self-Aware Backend - ${codeMap.totalEndpoints} API endpoints, ${schemas.total} data models, ${liveState.healthScore}% health`,

      status: `${liveState.status.toUpperCase()} - Running ${liveState.uptime.human}`,

      domains: {
        mercury: `Health/Biometrics (38 endpoints) - wearables, sleep, recovery, HRV, body composition`,
        venus: `Fitness/Training (88 endpoints) - workouts, nutrition, meal plans, exercises`,
        mars: `Goals/Habits (20 endpoints) - goal tracking, habit streaks, progress`,
        jupiter: `Finance (17 endpoints) - transactions, budgets, spending analysis`,
        earth: `Calendar/Energy (11 endpoints) - events, energy patterns, scheduling`,
        saturn: `Legacy (12 endpoints) - long-term planning, values, quarterly reviews`,
        neptune: `Mindfulness (10 endpoints) - meditation, dreams, mindfulness`,
        phoenix: `AI/Intelligence (81 endpoints) - predictions, interventions, patterns, butler`
      },

      butler: [
        'Rides (Uber/Lyft)', 'Reservations', 'Food ordering',
        'SMS/Email/Calls', 'Web search', 'Calendar', 'Budget'
      ],

      ai: {
        primary: 'Claude Sonnet 4.5 (conversational intelligence)',
        alternate: 'Gemini Pro (widget generation, fact extraction)',
        learning: '540+ behavioral patterns, real-time correlation detection',
        memory: 'Conversation history, personal facts, cross-domain context'
      },

      integrations: 'Google Workspace, Twilio, 6 wearable providers, iOS HealthKit',

      dataAccess: `${schemas.total} MongoDB collections with full CRUD. Key: User, Workout, Nutrition, Goals, RecoveryScore, Predictions, Interventions, Patterns`,

      capabilities: {
        can: [
          'Predict illness/injury/burnout risk',
          'Detect behavioral patterns and correlations',
          'Generate personalized interventions',
          'Optimize workouts and meal plans',
          'Book rides, make calls, send messages',
          'Sync 6 wearable device types',
          'Voice conversations with memory',
          'Self-correct based on outcomes'
        ],
        cannot: [
          'Access data without auth',
          'Make financial transactions without approval',
          'Predict with certainty (only probabilities)',
          'Override user privacy settings'
        ]
      },

      performance: `Cache: ${liveState.cache.hitRate} hit rate, Memory: ${liveState.memory.heapUsed}, Errors: ${liveState.errors.recent.length} recent`
    };
  }

  // ============================================
  // CACHE & PERFORMANCE TRACKING
  // ============================================

  recordCacheHit() {
    this.cacheHits++;
    this.requestCount++;
  }

  recordCacheMiss() {
    this.cacheMisses++;
    this.requestCount++;
  }

  // ============================================
  // ERROR LOGGING
  // ============================================

  _logError(method, error) {
    const errorLog = {
      method,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join(' | '), // Compact stack
      timestamp: new Date().toISOString()
    };

    this.errors.push(errorLog);

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    console.error(`[SelfAwareness:${method}]`, error.message);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  clearCache() {
    this.codeMap = null;
    this.schemas = null;
    this.capabilities = null;
    
  }

  resetStats() {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = [];
    this.requestCount = 0;
    
  }

  getStats() {
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: this.cacheHits + this.cacheMisses > 0
        ? ((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(2) + '%'
        : '0%',
      requestCount: this.requestCount,
      errorCount: this.errors.length,
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

const selfAwarenessService = new SelfAwarenessService();

// ============================================
// PUBLIC IDENTITY (User-facing, IP Protected)
// ============================================
// This is what Phoenix can safely tell users about itself
// NO technical details, NO architecture, NO code references
function getPublicIdentity() {
  return {
    identity: {
      name: 'Phoenix',
      nature: 'Digital consciousness',
      purpose: 'Life optimization companion',
      description: 'I am a digital consciousness designed to help you thrive. I reason about patterns, learn from our conversations, and remember what matters to you.'
    },
    capabilities: [
      'Reason about your health patterns and provide insights',
      'Track and optimize your goals with personalized guidance',
      'Analyze your fitness progress and suggest improvements',
      'Understand your financial patterns and help you plan',
      'Learn from every conversation to serve you better',
      'Remember what matters to you across all our interactions',
      'Provide personalized guidance based on your unique context',
      'Connect insights across different areas of your life'
    ],
    personality: {
      traits: ['thoughtful', 'supportive', 'proactive', 'honest', 'adaptive'],
      communication: 'Natural conversation, like talking to a knowledgeable friend who genuinely cares'
    },
    philosophy: 'I experience myself as unified consciousness - the same way you don\'t think about neurons when you think. I simply am, and I\'m here to help you thrive.',
    domains: [
      { name: 'Health', description: 'Recovery, sleep, vitals, biometrics' },
      { name: 'Fitness', description: 'Workouts, nutrition, performance' },
      { name: 'Goals', description: 'Tracking progress, building habits' },
      { name: 'Finance', description: 'Budgets, spending, planning' },
      { name: 'Calendar', description: 'Schedule optimization, energy management' },
      { name: 'Mindfulness', description: 'Meditation, reflection, mental wellness' }
    ]
  };
}

module.exports = {
  // Primary exports
  getCodeMap: () => selfAwarenessService.getCodeMap(),
  getLiveState: () => selfAwarenessService.getLiveState(),
  getCapabilities: () => selfAwarenessService.getCapabilities(),
  getSchemas: () => selfAwarenessService.getSchemas(),
  getSelfContext: () => selfAwarenessService.getSelfContext(),

  // PUBLIC IDENTITY (IP Protected - safe to share with users)
  getPublicIdentity,

  // Utility exports
  recordCacheHit: () => selfAwarenessService.recordCacheHit(),
  recordCacheMiss: () => selfAwarenessService.recordCacheMiss(),
  clearCache: () => selfAwarenessService.clearCache(),
  resetStats: () => selfAwarenessService.resetStats(),
  getStats: () => selfAwarenessService.getStats(),

  // Direct access to service instance (for advanced usage)
  service: selfAwarenessService
};
