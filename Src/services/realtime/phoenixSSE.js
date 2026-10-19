/**
 * ==================================================================
 * PHOENIX SSE (Server-Sent Events) REAL-TIME STREAM
 * ==================================================================
 * Railway-compatible real-time streaming without WebSocket
 *
 * Purpose: Push consciousness updates to frontend in real-time
 * - Pattern detection -> Widget creation
 * - Goal completion -> Celebration message
 * - Critical alerts -> Immediate notification
 * - Intelligence Loop processing -> Live status
 *
 * SSE works over regular HTTP - no custom domain required on Railway!
 * ==================================================================
 */

class PhoenixSSEServer {
  constructor() {
    this.clients = new Map(); // userId -> Set of response objects
    this.heartbeatInterval = null;
  }

  /**
   * REGISTER EXPRESS ROUTE
   * Call this in server.js to set up the SSE endpoint
   */
  registerRoute(app, authMiddleware) {
    console.log('[Phoenix SSE] Registering SSE endpoint at /api/phoenix-stream');

    app.get('/api/phoenix-stream', authMiddleware, (req, res) => {
      this.handleConnection(req, res);
    });

    // 🔧 FIX: Validate JWT token passed via query param (no guest tokens)
    app.get('/api/phoenix-stream-guest', async (req, res) => {
      const token = req.query.guestId;

      // Require valid JWT (starts with eyJ)
      if (!token || !token.startsWith('eyJ')) {
        return res.status(401).json({
          success: false,
          error: 'Valid JWT token required'
        });
      }

      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, isGuest: false };
        this.handleConnection(req, res);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
    });

    this.startHeartbeat();
    console.log('[Phoenix SSE] SSE endpoint ready');
  }

  /**
   * HANDLE NEW SSE CONNECTION
   */
  handleConnection(req, res) {
    const userId = req.user?.id || 'anonymous';

    // Disable compression for this response (SSE must not be compressed)
    res.set('Content-Encoding', 'identity');

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx/Railway buffering

    // Flush headers immediately
    res.flushHeaders();

    // Send initial retry instruction (helps clients know reconnect timing)
    res.write('retry: 3000\n\n');

    console.log(`[Phoenix SSE] Client connected: ${userId.slice(-6)}`);

    // Add client to tracking map
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(res);

    // Attach userId to response for later use
    res.userId = userId;

    // Send welcome message immediately
    const welcomeEvent = `event: CONNECTION_ESTABLISHED\ndata: ${JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      timestamp: Date.now(),
      data: {
        message: 'Phoenix consciousness stream connected (SSE)',
        userId: userId
      }
    })}\n\n`;
    res.write(welcomeEvent);

    // Handle client disconnect
    req.on('close', () => {
      this.handleDisconnection(res);
    });

    // Register user with Intelligence Loop if available
    try {
      const intelligenceLoop = require('../phoenix/intelligenceLoop');
      intelligenceLoop.registerUser(userId);
    } catch (e) {
      // Intelligence loop not available
    }
  }

  /**
   * HANDLE DISCONNECTION
   */
  handleDisconnection(res) {
    const userId = res.userId;
    console.log(`[Phoenix SSE] Client disconnected: ${userId?.slice(-6) || 'unknown'}`);

    // Remove from tracking
    if (userId && this.clients.has(userId)) {
      this.clients.get(userId).delete(res);

      // If no more connections for this user, remove from map
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  /**
   * SEND EVENT TO SPECIFIC CLIENT
   */
  send(res, data) {
    try {
      const eventString = `event: ${data.type}\ndata: ${JSON.stringify(data)}\n\n`;
      res.write(eventString);
      // Force flush for immediate delivery
      if (res.flush && typeof res.flush === 'function') {
        res.flush();
      }
    } catch (e) {
      // Client disconnected
    }
  }

  /**
   * BROADCAST TO USER (all their connections)
   */
  broadcastToUser(userId, data) {
    const userClients = this.clients.get(userId?.toString());

    if (!userClients || userClients.size === 0) {
      return false;
    }

    let sentCount = 0;
    for (const res of userClients) {
      try {
        const eventString = `event: ${data.type}\ndata: ${JSON.stringify(data)}\n\n`;
        res.write(eventString);
        // Force flush if available
        if (res.flush && typeof res.flush === 'function') {
          res.flush();
        }
        sentCount++;
      } catch (e) {
        // Client disconnected, will be cleaned up by close handler
      }
    }

    return sentCount > 0;
  }

  /**
   * PUSH CONSCIOUSNESS UPDATE
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
          priority: 0,
          urgency: 'celebrate',
          size: 'large',
          data: achievement
        }
      }
    });
  }

  /**
   * PUSH CRITICAL ALERT
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
   * PUSH WIDGET CREATE
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
   */
  pushWidgetUpdate(userId, widgetId, updates) {
    return this.broadcastToUser(userId, {
      type: 'WIDGET_UPDATE',
      timestamp: Date.now(),
      data: { widgetId, updates }
    });
  }

  /**
   * PUSH WIDGET REMOVE
   */
  pushWidgetRemove(userId, widgetId) {
    return this.broadcastToUser(userId, {
      type: 'WIDGET_REMOVE',
      timestamp: Date.now(),
      data: { widgetId }
    });
  }

  /**
   * PUSH AI RESPONSE TOKEN (for streaming responses)
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
   * HEARTBEAT - Keep connections alive
   * Send a comment every 30 seconds (SSE comment = line starting with :)
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      for (const [userId, clients] of this.clients.entries()) {
        for (const res of clients) {
          try {
            res.write(': heartbeat\n\n');
          } catch (e) {
            // Client disconnected
            this.clients.get(userId)?.delete(res);
          }
        }
      }
    }, 30000);
  }

  /**
   * GET CONNECTED USERS COUNT
   */
  getConnectedUsersCount() {
    return this.clients.size;
  }

  /**
   * CHECK IF USER IS CONNECTED
   */
  isUserConnected(userId) {
    return this.clients.has(userId?.toString());
  }

  /**
   * SHUTDOWN
   */
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const [userId, clients] of this.clients.entries()) {
      for (const res of clients) {
        try {
          res.end();
        } catch (e) {}
      }
    }
    this.clients.clear();
  }
}

// Export singleton instance
const phoenixSSE = new PhoenixSSEServer();

module.exports = phoenixSSE;
