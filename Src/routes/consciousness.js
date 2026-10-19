/**
 * =================================================================
 * CONSCIOUSNESS ROUTES
 * =================================================================
 * Endpoints for Phoenix consciousness data streams
 * Notes, learnings, and manual inputs that feed the AI
 * =================================================================
 */

const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/auth');
const Note = require('../models/Note');

/**
 * GET /api/consciousness/notes
 * Get user's notes (most recent first)
 */
router.get('/notes', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const notes = await Note.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const total = await Note.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      notes,
      total,
      hasMore: offset + notes.length < total
    });

  } catch (error) {
    console.error('[Consciousness] Get notes failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/consciousness/notes
 * Create a new note (feeds Phoenix consciousness)
 */
router.post('/notes', auth, async (req, res) => {
  try {
    const { content, source = 'desk', tags = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const note = await Note.create({
      userId: req.user._id,
      content: content.trim(),
      source,
      tags
    });

    // Feed to consciousness engine (async - don't wait)
    try {
      const consciousnessEngine = require('../services/consciousness/consciousnessEngine');
      if (consciousnessEngine && consciousnessEngine.processManualInput) {
        consciousnessEngine.processManualInput(req.user._id, 'note', content).catch(err => {
          console.log('[Consciousness] Background processing:', err.message);
        });
      }
    } catch (e) {
      // Consciousness engine not available - that's okay
    }

    res.json({
      success: true,
      note
    });

  } catch (error) {
    console.error('[Consciousness] Create note failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/consciousness/notes/:id
 * Delete a note
 */
router.delete('/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note deleted'
    });

  } catch (error) {
    console.error('[Consciousness] Delete note failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/consciousness/stream
 * SSE stream for real-time consciousness updates
 */
router.get('/stream', auth, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

/**
 * GET /api/consciousness/dashboard-insights
 * Get AI insights for dashboard
 * Returns insights as array for frontend consumption
 */
router.get('/dashboard-insights', auth, async (req, res) => {
  try {
    const hour = new Date().getHours();
    const insights = [];

    // Time-based contextual insights
    if (hour >= 6 && hour < 9) {
      insights.push({
        type: 'proactive',
        priority: 'medium',
        message: 'Good morning! I\'m analyzing your overnight recovery data.',
        icon: 'fa-sun'
      });
    } else if (hour >= 12 && hour < 14) {
      insights.push({
        type: 'suggestion',
        priority: 'low',
        message: 'Midday energy check - consider a brief walk or stretch.',
        icon: 'fa-walking'
      });
    } else if (hour >= 21) {
      insights.push({
        type: 'proactive',
        priority: 'medium',
        message: 'Wind-down time approaching. I\'m tracking your sleep readiness.',
        icon: 'fa-moon'
      });
    }

    // Default insight if none generated
    if (insights.length === 0) {
      insights.push({
        type: 'observation',
        priority: 'low',
        message: 'Phoenix is learning your patterns. Keep interacting!',
        icon: 'fa-brain'
      });
    }

    res.json({
      success: true,
      insights: insights,
      mood: {
        state: 'neutral',
        wellbeing: 0.7,
        energy: 0.6,
        clarity: 0.8
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/consciousness/status
 * Get consciousness sync status
 */
router.get('/status', auth, async (req, res) => {
  try {
    const noteCount = await Note.countDocuments({ userId: req.user._id });
    const unprocessedCount = await Note.countDocuments({
      userId: req.user._id,
      processed: false
    });

    res.json({
      success: true,
      status: {
        notes: noteCount,
        unprocessed: unprocessedCount,
        lastSync: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
