const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Document = require('../models/Document');

// GET all documents for user
router.get('/', protect, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('title content type tags source createdAt updatedAt')
      .lean();
    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single document
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create document
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, type, tags } = req.body;
    const document = await Document.create({
      userId: req.user._id,
      title,
      content,
      type: type || 'other',
      tags: tags || [],
      source: 'manual'
    });
    res.status(201).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update document
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content, type, tags } = req.body;
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, content, type, tags, updatedAt: new Date() },
      { new: true }
    );
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE document
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST enhance document (add content)
router.post('/:id/enhance', protect, async (req, res) => {
  try {
    const { additionalContent } = req.body;
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    document.content = document.content + '\n\n---\n\n' + additionalContent;
    document.updatedAt = new Date();
    await document.save();

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET search documents
router.get('/search/:query', protect, async (req, res) => {
  try {
    const documents = await Document.find({
      userId: req.user._id,
      $or: [
        { title: { $regex: req.params.query, $options: 'i' } },
        { content: { $regex: req.params.query, $options: 'i' } },
        { tags: { $in: [new RegExp(req.params.query, 'i')] } }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
