// ============================================================================
// PHOENIX BACKEND - MASTER SERVER.JS
// Last deploy: 2025-12-26 20:00 UTC - Force rebuild after 502
// ============================================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');

// ============================================================================
// EXPRESS APP INITIALIZATION
// ============================================================================

const app = express();
const PORT = process.env.PORT || 5002;

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Trust proxy - REQUIRED for Railway (behind reverse proxy)
app.set('trust proxy', 1);

// Helmet - Security headers
app.use(helmet());

// AI/ML Scraping Protection Headers
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noai, noimageai, noindex');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// CORS Configuration - Dynamic Origin Reflection
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // DYNAMIC REFLECTION: Always allow the incoming origin
    // This fixes the "Access-Control-Allow-Origin" mismatch
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};
app.use(cors(corsOptions));

// Rate Limiting - Prevent brute force attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // 100,000 requests per 15 min (scaled for launch with thousands of concurrent users)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/webhooks/twilio')
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes for security
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Only count failed attempts
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Sanitize data to prevent MongoDB injection
app.use(mongoSanitize());

// ============================================================================
// BODY PARSING MIDDLEWARE
// ============================================================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware for response optimization
// Skip compression for SSE streams (must not be compressed for real-time delivery)
app.use(compression({
  filter: (req, res) => {
    // Don't compress SSE streams
    if (req.path.includes('phoenix-stream')) {
      return false;
    }
    // Use default compression filter for everything else
    return compression.filter(req, res);
  }
}));

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// MONGODB CONNECTION (NON-BLOCKING - Initializes in background)
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phoenix';

// Start MongoDB connection but DON'T wait for it
// This allows server to respond to requests immediately while DB connects
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  heartbeatFrequencyMS: 30000,
  retryWrites: true,
  retryReads: true,
});

// Handle connection success (async, non-blocking)
mongoose.connection.once('connected', async () => {
  console.log('✅ MongoDB Connected Successfully');
  console.log(`📍 Database: ${mongoose.connection.name}`);
  global.mongodbConnected = true;

  // Async background initialization - don't block server
  setImmediate(async () => {
    try {
      // Sync indexes
      const User = require('./Src/models/User');
      await User.syncIndexes();
      console.log('✅ User model indexes synchronized');
    } catch (error) {
      console.error('⚠️  Index sync warning:', error.message);
    }

    // Initialize ML asynchronously
    try {
      const mlTrainingService = require('./Src/services/phoenix/mlTrainingService');
      await mlTrainingService.initialize();
      console.log('✅ ML Training Service initialized');

      const schedule = require('node-cron');
      schedule.schedule('0 3 * * *', async () => {
        console.log('[Scheduled Job] Starting daily ML model retraining...');
        try {
          await mlTrainingService.trainAllModels();
          console.log('[Scheduled Job] Daily ML retraining completed successfully');
        } catch (error) {
          console.error('[Scheduled Job] Daily ML retraining failed:', error);
        }
      });
    } catch (error) {
      console.error('⚠️  ML Training Service initialization failed:', error.message);
    }

    // Initialize Consciousness asynchronously
    try {
      const consciousness = require('./Src/services/consciousness');
      const result = await consciousness.initialize();
      console.log('✅ Consciousness Stream initialized');
      global.consciousnessInitialized = true;
    } catch (error) {
      console.error('⚠️  Consciousness Stream initialization failed:', error.message);
      global.consciousnessInitialized = false;
    }

    // Initialize Genesis asynchronously
    try {
      const creationEngine = require('./Src/services/genesis/creationEngine');
      await creationEngine.initialize();
      console.log('✅ Genesis Creation Engine initialized');
      global.genesisCreationEngine = creationEngine;
      global.genesisInitialized = true;
    } catch (error) {
      console.error('⚠️  Genesis initialization failed:', error.message);
      global.genesisInitialized = false;
    }
  });
});

// Handle connection errors
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  global.mongodbConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// ============================================================================
// IMPORT ALL ROUTES
// ============================================================================

// Core Authentication & User Management
const authRoutes = require('./Src/routes/auth');                    // 9 endpoints
const userRoutes = require('./Src/routes/user');                    // 11 endpoints
const subscriptionRoutes = require('./Src/routes/subscription');    // 5 endpoints
const smsVerificationRoutes = require('./Src/routes/smsVerification'); // 4 endpoints - SMS verification
const fileRoutes = require('./Src/routes/files');                   // 5 endpoints - File Upload & Storage

// 8 Planetary System Routes (ALL PLANETS - Mercury through Neptune)
const mercuryRoutes = require('./Src/routes/mercury');      // 38 endpoints - Health, Biometrics, Wearables & Recovery
const venusRoutes = require('./Src/routes/venus');          // 88 endpoints - Fitness & Training
const earthRoutes = require('./Src/routes/earth');          // 11 endpoints - Calendar & Energy
const marsRoutes = require('./Src/routes/mars');            // 20 endpoints - Goals & Habits
const jupiterRoutes = require('./Src/routes/jupiter');      // 17 endpoints - Financial Management
const saturnRoutes = require('./Src/routes/saturn');        // 12 endpoints - Legacy Planning
const uranusRoutes = require('./Src/routes/uranus');        // 10 endpoints - Innovation & Learning Analytics
const neptuneRoutes = require('./Src/routes/neptune');      // 10 endpoints - Mindfulness & Dreams
const phoenixRoutes = require('./Src/routes/phoenix');      // 75 endpoints - AI Companion

// Phoenix Extended Systems
const phoenixVoiceRoutes = require('./Src/routes/phoenixVoice');    // 2 endpoints - Voice Interface
const voiceStreamRoutes = require('./Src/routes/voiceStream');      // 1 endpoint - Streaming Voice (<3s latency) 🚀 NEW
const universalRoutes = require('./Src/routes/universal');          // 3 endpoints - Universal Natural Language
const whisperRoutes = require('./Src/routes/whisper');              // 2 endpoints - Audio Transcription
const ttsRoutes = require('./Src/routes/tts');                      // 4 endpoints - Text-to-Speech
const interfaceRoutes = require('./Src/routes/interface');          // 6 endpoints - UI Orchestration & Consciousness
const customTrackerRoutes = require('./Src/routes/customTracker');    // 6 endpoints - Dynamic Custom Tracking
const savedWidgetsRoutes = require('./Src/routes/savedWidgets');      // 15 endpoints - Widget Persistence & Management
const orchestratorRoutes = require('./Src/routes/orchestrator');      // 9 endpoints - Holistic Cross-Domain Optimization 🚀 NEW

// Google Workspace Integration
const googleRoutes = require('./Src/routes/google');                   // 20+ endpoints - Gmail, Calendar, Drive, Tasks, Contacts, Fit 🌟 NEW
const wearablesRoutes = require('./Src/routes/wearables');             // 6 endpoints - Fitbit, Polar Direct OAuth 🏃 NEW

// Communication & Verification
const twilioWebhooks = require('./Src/routes/twilioWebhooks');          // 9 endpoints - Voice & SMS Callbacks (Public)

// Butler Services
const butlerRoutes = require('./Src/routes/butler');                    // 10 endpoints - Ride Services (Lyft, Uber) via API + Twilio Calls
const butlerRouterRoutes = require('./Src/routes/butlerRouter');        // 4 endpoints - Unified Butler Action Router ⭐ NEW

// iOS Native Integration
const iosNativeRoutes = require('./Src/routes/ios-native');             // 7 endpoints - iOS Native Functions (HealthKit, Calendar, etc.) ⭐ NEW
const enhancedIOSRoutes = require('./Src/routes/enhanced-ios-native');  // 30+ endpoints - Enhanced iOS with Live Activities, Voice, etc. 🚀 NEW

// Consciousness Architecture (Brain + Soul + Spirit + Integration)
const consciousnessRoutes = require('./Src/routes/consciousness');       // 50+ endpoints - Full Consciousness System (Brain, Soul, Spirit, Integration) 🧠 NEW

// Genesis Self-Modification System
const genesisRoutes = require('./Src/routes/genesis');                   // 10 endpoints - Genesis Self-Modification (God Account Only) 🔥 NEW

// Console Access - Full Terminal Control
const consoleRoutes = require('./Src/routes/console');                   // 25+ endpoints - Full Console Access (Local=Unrestricted, Cloud=Sandboxed) 🖥️ NEW

// Generic Web Scraper - Automate ANY Website
const scraperRoutes = require('./Src/routes/scraper');                   // 17 endpoints - Browse & Interact with ANY Website 🌐 NEW

// Vision Analyzer - Phoenix Can See
const visionRoutes = require('./Src/routes/vision');                     // 12 endpoints - Screenshot + Claude Vision Analysis 👁️ NEW

// Universal Mail & Calendar (IMAP/CalDAV - No OAuth needed)
const universalMailRoutes = require('./Src/routes/universalMail');       // 8 endpoints - Universal Email via IMAP 📧 NEW
const universalCalendarRoutes = require('./Src/routes/universalCalendar'); // 8 endpoints - Universal Calendar via CalDAV 📅 NEW

// Zoom Integration
const zoomRoutes = require('./Src/routes/zoom');                         // 10 endpoints - Zoom Meetings via OAuth 🎥 NEW

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

// Ultra-lightweight keep-alive endpoint (prevents Railway cold starts)
// Ping this every 5 minutes with UptimeRobot or Cron-job.org (free services)
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Initializing...',
    environment: process.env.NODE_ENV || 'development',
    consciousness: global.consciousnessInitialized ? 'INITIALIZED' : 'Initializing...'
  });
});

// API health endpoint (alias)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Initializing...',
    consciousness: global.consciousnessInitialized ? 'INITIALIZED' : 'Initializing...'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Pheonix Backend API',
    status: 'Running',
    consciousness: global.consciousnessInitialized ? 'INITIALIZED' : 'DISABLED'
  });
});

// WebSocket debug endpoint - helps verify path is reachable before upgrade
app.get('/phoenix-stream', (req, res) => {
  // Check for WebSocket upgrade headers
  const upgradeHeader = req.headers['upgrade'];
  if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
    // This shouldn't be reached - WebSocket.Server handles upgrade
    res.status(426).json({
      error: 'WebSocket upgrade required',
      message: 'This endpoint requires WebSocket connection, not HTTP GET'
    });
  } else {
    res.status(200).json({
      status: 'OK',
      endpoint: '/phoenix-stream',
      type: 'WebSocket',
      message: 'Use wss:// protocol to connect to this endpoint',
      wsConnected: global.phoenixSocket ? global.phoenixSocket.getConnectedUsersCount() : 0
    });
  }
});

// ============================================================================
// MOUNT ALL ROUTES
// ============================================================================

// Core Systems - Authentication & Management
app.use('/api/auth', authRoutes);                       // 12 endpoints
app.use('/api/sms-verification', smsVerificationRoutes); // 4 endpoints - SMS verification
app.use('/api/users', userRoutes);                      // 11 endpoints
app.use('/api/subscriptions', subscriptionRoutes);      // 5 endpoints
app.use('/api/files', fileRoutes);                      // 5 endpoints - File Upload & Storage

// 8 Planetary Systems - Primary User Features (ALL PLANETS Mercury-Neptune)
app.use('/api/mercury', mercuryRoutes);                 // 39 endpoints
app.use('/api/venus', venusRoutes);                     // 88 endpoints
app.use('/api/earth', earthRoutes);                     // 11 endpoints
app.use('/api/mars', marsRoutes);                       // 20 endpoints
app.use('/api/jupiter', jupiterRoutes);                 // 17 endpoints
app.use('/api/saturn', saturnRoutes);                   // 12 endpoints
app.use('/api/uranus', uranusRoutes);                   // 10 endpoints - Innovation & Learning
app.use('/api/neptune', neptuneRoutes);                 // 10 endpoints - Mindfulness & Dreams
app.use('/api/phoenix', phoenixRoutes);                 // 75 endpoints

// Extended Phoenix Systems
app.use('/api/phoenixVoice', phoenixVoiceRoutes);       // 2 endpoints - CRITICAL: Was missing!
app.use('/api/voice-stream', voiceStreamRoutes);        // 1 endpoint - Streaming Voice (<3s latency) 🚀 NEW
app.use('/api/phoenix/universal', universalRoutes);     // 3 endpoints - Universal Natural Language ⭐ NEW
app.use('/api/whisper', whisperRoutes);                 // 2 endpoints
app.use('/api/tts', ttsRoutes);                         // 4 endpoints
app.use('/api/interface', interfaceRoutes);             // 6 endpoints - UI Orchestration
app.use('/api/custom-tracker', customTrackerRoutes);    // 6 endpoints - Dynamic Custom Tracking ⭐ NEW
app.use('/api/widgets', savedWidgetsRoutes);            // 15 endpoints - Widget Persistence & Management ⭐ NEW
app.use('/api/orchestrator', orchestratorRoutes);       // 9 endpoints - Holistic Cross-Domain Optimization 🚀 NEW

// Google Workspace Integration
app.use('/api/google', googleRoutes);                    // 20+ endpoints - Gmail, Calendar, Drive, Tasks, Contacts, Fit 🌟 NEW

// Communication & Verification
app.use('/api/webhooks/twilio', twilioWebhooks);         // 9 endpoints (Public - no auth)

// Butler Services
app.use('/api/butler', butlerRoutes);                    // 10 endpoints - Ride Services (Lyft, Uber) via API + Twilio Calls
app.use('/api/butler/router', butlerRouterRoutes);       // 4 endpoints - Unified Action Router ⭐ NEW

// iOS Native Integration
app.use('/api/ios/native', iosNativeRoutes);            // 7 endpoints - iOS Native Functions ⭐ NEW
app.use('/api/ios/enhanced', enhancedIOSRoutes);        // 30+ endpoints - Enhanced iOS Features 🚀 NEW

// Wearables - Direct Fitbit/Polar OAuth (No Google Fit needed)
app.use('/api/wearables', wearablesRoutes);             // 6 endpoints - Fitbit, Polar Direct OAuth 🏃 NEW

// Consciousness Architecture
app.use('/api/consciousness', consciousnessRoutes);      // 50+ endpoints - Full Consciousness System 🧠 NEW

// Genesis Self-Modification System (God Account Only)
app.use('/api/genesis', genesisRoutes);                  // 10 endpoints - Self-Modification, Code Generation, Deployment 🔥 NEW

// Console Access - Full Terminal Control (Local=Unrestricted, Cloud=Sandboxed)
app.use('/api/console', consoleRoutes);                  // 25+ endpoints - Shell, Files, Git, Network, Process, macOS 🖥️ NEW

// Generic Web Scraper - Automate ANY Website
app.use('/api/scraper', scraperRoutes);                  // 17 endpoints - Sessions, Navigate, Click, Type, Extract 🌐 NEW

// Vision Analyzer - Phoenix Can See
app.use('/api/vision', visionRoutes);                    // 12 endpoints - Capture, Analyze, See, Find, Compare 👁️ NEW

// Universal Mail & Calendar (IMAP/CalDAV - No OAuth needed)
app.use('/api/mail', universalMailRoutes);               // 8 endpoints - Universal Email via IMAP 📧 NEW
app.use('/api/calendar', universalCalendarRoutes);       // 8 endpoints - Universal Calendar via CalDAV 📅 NEW

// Zoom Integration
app.use('/api/zoom', zoomRoutes);                        // 10 endpoints - Zoom Meetings via OAuth 🎥 NEW

// Cross-Device Sync API
const syncRoutes = require('./Src/routes/sync');
app.use('/api/sync', syncRoutes);                        // 5 endpoints - Cross-Device Encrypted Sync Storage 🔐 NEW

// ============================================================================
// BUSINESS MANAGEMENT ROUTES
// ============================================================================
const businessRoutes = require('./Src/routes/business');
app.use('/api/business', businessRoutes);                // 9 endpoints - Business Operations (CRM, Orders, Invoices) 🚀 NEW

// ============================================================================
// DOCUMENT MANAGEMENT ROUTES
// ============================================================================
const documentsRoutes = require('./Src/routes/documents');
app.use('/api/documents', documentsRoutes);              // 7 endpoints - Document CRUD, Search, Enhance 📄 NEW

// ============================================================================
// MESSAGES ROUTES - Phoenix-native messaging (DESK MAIL)
// ============================================================================
const messagesRoutes = require('./Src/routes/messages');
app.use('/api/messages', messagesRoutes);                // 8 endpoints - Messages CRUD, Import 📧 NEW

// ============================================================================
// ADMIN ROUTES - Platform Owner Dashboard
// ============================================================================
const adminRoutes = require('./Src/routes/admin');
app.use('/api/admin', adminRoutes);                      // 12 endpoints - Analytics, Users, Earnings, Coach Applications 👑 ADMIN ONLY

// ============================================================================
// COACH ROUTES - User-facing coach features
// ============================================================================
const coachRoutes = require('./Src/routes/coach');
app.use('/api/coach', coachRoutes);                      // 3 endpoints - Apply, Status, Update Application

console.log('Routes mounted');

// ============================================================================
// START SERVER IMMEDIATELY (Ensure port binding for Railway)
// ============================================================================
const server = http.createServer(app);

// CRITICAL: Set keepalive timeout to match Railway's edge proxy (15+ seconds)
// Railway's edge keeps connections alive for 15 seconds - our server must match
server.keepAliveTimeout = 65000; // 65 seconds (Node.js default is 5s)
server.headersTimeout = 66000; // Slightly higher than keepAliveTimeout

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Phoenix Backend running on port ${PORT} (0.0.0.0)`);
  console.log(`[Server] Keep-alive timeout: ${server.keepAliveTimeout}ms`);
});

// ============================================================================
// SSE REAL-TIME STREAM (Railway-compatible)
// ============================================================================
try {
  const phoenixSSE = require('./Src/services/realtime/phoenixSSE');
  const { protectOrGuest } = require('./Src/middleware/auth');
  phoenixSSE.registerRoute(app, protectOrGuest);
  global.phoenixSSE = phoenixSSE;
  console.log('📡 Phoenix SSE initialized');
} catch (error) {
  console.error('⚠️  Phoenix SSE failed to initialize:', error.message);
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// 404 Handler - Route not found
app.use((req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: 'Duplicate Error',
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication Error',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication Error',
      message: 'Token expired'
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: err.name || 'ServerError',
    message: message, // Show real error in production for debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// START WEBSOCKET & BACKGROUND SERVICES
// ============================================================================

// Initialize background services asynchronously (non-blocking)
setImmediate(() => {
  // Initialize WebSocket consciousness stream
  try {
    const RealtimeConsciousnessStream = require('./Src/services/consciousness/realtimeConsciousnessStream');
    global.consciousnessStream = new RealtimeConsciousnessStream(server);
    console.log('🧠 Consciousness streaming initialized');
  } catch (error) {
    console.error('⚠️  Consciousness stream failed to initialize:', error.message);
  }

  // Initialize Phoenix WebSocket
  try {
    const phoenixSocket = require('./Src/services/websocket/phoenixSocket');
    phoenixSocket.initialize(server);
    global.phoenixSocket = phoenixSocket;
    console.log('🔥 Phoenix WebSocket initialized');
  } catch (error) {
    console.error('⚠️  Phoenix WebSocket failed to initialize:', error.message);
  }

  // Initialize Intelligence Loop
  try {
    const intelligenceLoop = require('./Src/services/phoenix/intelligenceLoop');
    global.intelligenceLoop = intelligenceLoop;
    console.log('🧠 Phoenix Intelligence Loop started');
  } catch (error) {
    console.error('⚠️  Intelligence Loop failed to initialize:', error.message);
  }

  // Initialize Live Activities manager
  try {
    const liveActivitiesManager = require('./Src/services/ios/liveActivitiesManager');
    liveActivitiesManager.startCleanupInterval();
    console.log('🌟 Live Activities manager initialized');
  } catch (error) {
    console.error('⚠️  Live Activities failed to initialize:', error.message);
  }
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n${signal} signal received: closing HTTP server`);

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB:', err.message);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
// UPDATED: Log but don't crash (graceful degradation)
process.on('unhandledRejection', (err, promise) => {
  console.error('UNHANDLED REJECTION! ⚠️ Logging error but continuing...');
  console.error('Error name:', err?.name);
  console.error('Error message:', err?.message);
  console.error('Error stack:', err?.stack);
  console.error('Promise:', promise);

  // DO NOT crash server - let it continue serving requests
  // This allows Genesis stream to stay connected even with validation errors
});

module.exports = app;
// Force redeploy Tue Dec 23 18:08:24 EST 2025
