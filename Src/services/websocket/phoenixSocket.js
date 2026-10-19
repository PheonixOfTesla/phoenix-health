/**
 * ==================================================================
 * PHOENIX WEBSOCKET SERVER
 * ==================================================================
 * Real-Time Consciousness Streaming
 *
 * Purpose: Push consciousness updates to frontend in real-time
 * - Pattern detection → Widget creation
 * - Goal completion → Celebration message
 * - Critical alerts → Immediate notification
 * - Intelligence Loop processing → Live status
 *
 * Replaces HTTP polling with true real-time bidirectional communication
 * ==================================================================
 */

const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');

class PhoenixWebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.heartbeatInterval = null;

    
  }

  /**
   * INITIALIZE WEBSOCKET SERVER
   * Attach to existing HTTP server
   */
  initialize(server) {
    console.log('[Phoenix WebSocket] Initializing WebSocket server on path /phoenix-stream');

    this.wss = new WebSocket.Server({
      server,
      path: '/phoenix-stream',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', (error) => {
      console.error('[Phoenix WebSocket] Server error:', error.message);
    });

    this.startHeartbeat();

    console.log('[Phoenix WebSocket] WebSocket server ready and listening');
  }

  /**
   * VERIFY CLIENT CONNECTION
   * Authenticate via JWT token in query params
   * NOTE: Must be synchronous - ws library doesn't support async verifyClient
   */
  verifyClient(info, callback) {
    try {
      console.log('[Phoenix WebSocket] Connection attempt from:', info.req.headers.origin || 'unknown origin');

      const params = url.parse(info.req.url, true).query;
      const token = params.token;

      if (!token) {
        console.log('[Phoenix WebSocket] No token provided - rejecting');
        callback(false, 401, 'Unauthorized - No token');
        return;
      }

      // Check if JWT_SECRET is configured
      if (!process.env.JWT_SECRET) {
        console.error('[Phoenix WebSocket] CRITICAL: JWT_SECRET not configured!');
        callback(false, 500, 'Server configuration error');
        return;
      }

      // 🔧 FIX: Reject guest tokens - require valid JWT
      if (!token.startsWith('eyJ')) {
        console.log('[Phoenix WebSocket] Invalid token format - not a JWT');
        callback(false, 401, 'Unauthorized - Valid JWT required');
        return;
      }

      // Verify JWT token (synchronous)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        console.log('[Phoenix WebSocket] Token decoded but no user ID found');
        callback(false, 401, 'Unauthorized - Invalid token payload');
        return;
      }

      // Attach user info to request for later use
      info.req.userId = decoded.id;
      info.req.isGuest = false;
      console.log(`[Phoenix WebSocket] Authenticated user: ${decoded.id.slice(-6)}`);
      callback(true);

    } catch (error) {
      console.error('[Phoenix WebSocket] Auth error:', error.message);
      if (error.name === 'TokenExpiredError') {
        callback(false, 401, 'Unauthorized - Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        callback(false, 401, 'Unauthorized - Invalid token');
      } else {
        callback(false, 500, 'Server error during authentication');
      }
    }
  }

  /**
   * HANDLE NEW CONNECTION
   */
  handleConnection(ws, req) {
    const userId = req.userId;

    

    // Add client to tracking map
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Attach userId to socket for later use
    ws.userId = userId;
    ws.isAlive = true;

    // Setup ping/pong for connection health
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle incoming messages
    ws.on('message', (message) => {
      this.handleMessage(ws, message);
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[Phoenix WebSocket] Error for user ${userId.slice(-6)}:`, error.message);
    });

    // Send welcome message
    this.send(ws, {
      type: 'CONNECTION_ESTABLISHED',
      timestamp: Date.now(),
      data: {
        message: 'Phoenix consciousness stream connected',
        userId: userId
      }
    });

    // Register user with Intelligence Loop if not already registered
    const intelligenceLoop = require('../phoenix/intelligenceLoop');
    intelligenceLoop.registerUser(userId);
  }

  /**
   * HANDLE INCOMING MESSAGE FROM CLIENT
   */
  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const userId = ws.userId;

      

      switch (data.type) {
        case 'PING':
          this.send(ws, { type: 'PONG', timestamp: Date.now() });
          break;

        case 'REQUEST_STATUS':
          // Send current consciousness status
          const intelligenceLoop = require('../phoenix/intelligenceLoop');
          const status = intelligenceLoop.getStatus();
          this.send(ws, {
            type: 'STATUS_UPDATE',
            timestamp: Date.now(),
            data: status
          });
          break;

        case 'REQUEST_IMMEDIATE_PROCESSING':
          // Trigger immediate consciousness processing
          const loop = require('../phoenix/intelligenceLoop');
          loop.triggerUserProcessing(userId).then(() => {
            this.send(ws, {
              type: 'PROCESSING_COMPLETE',
              timestamp: Date.now()
            });
          });
          break;

        default:
          
      }

    } catch (error) {
      console.error('[Phoenix WebSocket] Message handling error:', error.message);
    }
  }

  /**
   * HANDLE DISCONNECTION
   */
  handleDisconnection(ws) {
    const userId = ws.userId;
    

    // Remove from tracking
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);

      // If no more connections for this user, remove from map
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  /**
   * SEND MESSAGE TO SPECIFIC CLIENT
   */
  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * BROADCAST TO USER (all their connections)
   */
  broadcastToUser(userId, data) {
    const userClients = this.clients.get(userId.toString());

    if (!userClients || userClients.size === 0) {
      return false;
    }

    let sentCount = 0;
    for (const ws of userClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        sentCount++;
      }
    }

    
    return sentCount > 0;
  }

  /**
   * PUSH CONSCIOUSNESS UPDATE
   * Called by Intelligence Loop when insights are generated
   */
  pushConsciousnessUpdate(userId, update) {
    return this.broadcastToUser(userId, {
      type: 'CONSCIOUSNESS_UPDATE',
      timestamp: Date.now(),
      data: update
    });
  }

  /**
   * PUSH PATTERN DETECTED
   * Trigger widget creation on frontend
   */
  pushPatternDetected(userId, pattern) {
    return this.broadcastToUser(userId, {
      type: 'PATTERN_DETECTED',
      timestamp: Date.now(),
      data: {
        pattern: pattern.type,
        severity: pattern.severity,
        message: pattern.message,
        confidence: pattern.confidence,
        actionable: pattern.actionable,
        widgetConfig: {
          id: `pattern_${pattern.type}_${Date.now()}`,
          type: 'insight',
          priority: pattern.severity === 'high' ? 0 : pattern.severity === 'warning' ? 1 : 2,
          urgency: pattern.severity,
          size: 'medium',
          data: pattern
        }
      }
    });
  }

  /**
   * PUSH CELEBRATION
   * Immediate "Woahhh" moment
   */
  pushCelebration(userId, achievement) {
    return this.broadcastToUser(userId, {
      type: 'CELEBRATION',
      timestamp: Date.now(),
      data: {
        message: achievement.message || `Woahhh you did that?? ${achievement.title} - that's genuinely marvel!`,
        achievement: achievement.title,
        widgetConfig: {
          id: `celebration_${Date.now()}`,
          type: 'celebration',
          priority: 0, // Highest priority
          urgency: 'celebrate',
          size: 'large',
          data: achievement
        }
      }
    });
  }

  /**
   * PUSH CRITICAL ALERT
   * Urgent health/wellness warnings
   */
  pushCriticalAlert(userId, alert) {
    return this.broadcastToUser(userId, {
      type: 'CRITICAL_ALERT',
      timestamp: Date.now(),
      data: {
        severity: 'critical',
        message: alert.message,
        recommendation: alert.recommendation,
        widgetConfig: {
          id: `alert_${Date.now()}`,
          type: 'alert',
          priority: 0,
          urgency: 'critical',
          size: 'large',
          data: alert
        }
      }
    });
  }

  /**
   * PUSH PROCESSING STATUS
   * Show real-time consciousness processing
   */
  pushProcessingStatus(userId, status) {
    return this.broadcastToUser(userId, {
      type: 'PROCESSING_STATUS',
      timestamp: Date.now(),
      data: {
        status: status, // 'processing', 'complete', 'error'
        message: status === 'processing' ? 'Phoenix is analyzing...' :
                 status === 'complete' ? 'Analysis complete' :
                 'Processing error'
      }
    });
  }

  /**
   * PUSH WIDGET CREATE
   * Dynamic widget creation command
   */
  pushWidgetCreate(userId, widgetConfig) {
    return this.broadcastToUser(userId, {
      type: 'WIDGET_CREATE',
      timestamp: Date.now(),
      data: widgetConfig
    });
  }

  /**
   * PUSH WIDGET UPDATE
   * Update existing widget data
   */
  pushWidgetUpdate(userId, widgetId, updates) {
    return this.broadcastToUser(userId, {
      type: 'WIDGET_UPDATE',
      timestamp: Date.now(),
      data: {
        widgetId,
        updates
      }
    });
  }

  /**
   * PUSH WIDGET REMOVE
   * Remove widget from UI
   */
  pushWidgetRemove(userId, widgetId) {
    return this.broadcastToUser(userId, {
      type: 'WIDGET_REMOVE',
      timestamp: Date.now(),
      data: { widgetId }
    });
  }

  /**
   * PUSH AUDIO CHUNK
   * Stream TTS audio chunks for real-time voice playback
   */
  pushAudioChunk(userId, audioData, sequence, format = 'base64') {
    return this.broadcastToUser(userId, {
      type: 'audio_chunk',
      timestamp: Date.now(),
      sequence: sequence,
      chunk: audioData,
      format: format
    });
  }

  /**
   * PUSH AI RESPONSE STREAM
   * Stream AI response tokens in real-time
   */
  pushAIResponseToken(userId, token, isComplete = false) {
    return this.broadcastToUser(userId, {
      type: 'ai_response_stream',
      timestamp: Date.now(),
      token: token,
      complete: isComplete
    });
  }

  /**
   * HEARTBEAT / KEEP-ALIVE
   * Ping clients every 30 seconds to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  /**
   * GET CONNECTED USERS COUNT
   */
  getConnectedUsersCount() {
    return this.clients.size;
  }

  /**
   * GET ALL CONNECTED USER IDS
   */
  getConnectedUserIds() {
    return Array.from(this.clients.keys());
  }

  /**
   * CHECK IF USER IS CONNECTED
   */
  isUserConnected(userId) {
    return this.clients.has(userId.toString());
  }

  /**
   * SHUTDOWN
   */
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.wss) {
      this.wss.clients.forEach((ws) => {
        ws.close();
      });
      this.wss.close();
    }

    
  }
}

// Export singleton instance
const phoenixSocket = new PhoenixWebSocketServer();

module.exports = phoenixSocket;
