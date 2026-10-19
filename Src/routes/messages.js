const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');

// GET all messages for user
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 50, archived = false } = req.query;
    const messages = await Message.find({
      userId: req.user._id,
      archived: archived === 'true'
    })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      userId: req.user._id,
      read: false,
      archived: false
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single message
router.get('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Mark as read when viewed
    if (!message.read) {
      message.read = true;
      await message.save();
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create/compose message
router.post('/', protect, async (req, res) => {
  try {
    const { from, to, subject, body, source, googleId, date, labels } = req.body;

    const message = await Message.create({
      userId: req.user._id,
      from: from || req.user.email || 'me',
      to,
      subject: subject || '(No Subject)',
      body,
      source: source || 'phoenix',
      googleId,
      date: date || new Date(),
      labels: labels || [],
      read: source === 'phoenix' // Own messages are read
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT mark as read/unread
router.put('/:id/read', protect, async (req, res) => {
  try {
    const { read = true } = req.body;
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read, updatedAt: new Date() },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT archive message
router.put('/:id/archive', protect, async (req, res) => {
  try {
    const { archived = true } = req.body;
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { archived, updatedAt: new Date() },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE message
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST bulk import (for Google import)
router.post('/bulk-import', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Messages array required' });
    }

    const imported = [];
    for (const msg of messages) {
      // Skip if already imported (by googleId)
      if (msg.googleId) {
        const existing = await Message.findOne({
          userId: req.user._id,
          googleId: msg.googleId
        });
        if (existing) continue;
      }

      const message = await Message.create({
        userId: req.user._id,
        from: msg.from,
        to: msg.to,
        subject: msg.subject,
        body: msg.body,
        snippet: msg.snippet,
        source: 'google-import',
        googleId: msg.googleId || msg.id,
        date: msg.date ? new Date(msg.date) : new Date(),
        labels: msg.labels || [],
        read: msg.read || false
      });
      imported.push(message);
    }

    res.json({ success: true, imported: imported.length, messages: imported });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
