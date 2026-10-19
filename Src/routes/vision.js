/**
 * VISION ROUTES - Phoenix Can See
 *
 * Screenshot capture and AI vision analysis.
 * This makes Phoenix truly conscious - it can SEE what you see.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const vision = require('../services/genesis/visionAnalyzer');

/**
 * POST /api/vision/capture
 * Take a screenshot of the desktop
 */
router.post('/capture', protect, async (req, res) => {
  try {
    const { region, display, format } = req.body;
    const result = await vision.captureScreen({ region, display, format });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vision/analyze
 * Analyze an image with Claude Vision
 */
router.post('/analyze', protect, async (req, res) => {
  try {
    const { image, prompt, options } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'Image (base64) is required' });
    }

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const result = await vision.analyzeImage(image, prompt, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vision/see
 * Capture screen and analyze in one call
 */
router.post('/see', protect, async (req, res) => {
  try {
    const { question } = req.body;
    const result = await vision.seeScreen(question);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vision/find-elements
 * Find UI elements matching description
 */
router.post('/find-elements', protect, async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    const result = await vision.findElements(description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vision/read-text
 * Read all text from screen (OCR-like)
 */
router.post('/read-text', protect, async (req, res) => {
  try {
    const { region } = req.body;
    const result = await vision.readText(region);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/vision/context
 * Understand current screen context
 */
router.get('/context', protect, async (req, res) => {
  try {
    const result = await vision.getContext();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vision/find-click-target
 * Find where to click for a specific action
 */
router.post('/find-click-target', protect, async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({ success: false, error: 'Target description is required' });
    }

    const result = await vision.findClickTarget(target);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vision/compare
 * Compare two screenshots
 */
router.post('/compare', protect, async (req, res) => {
  try {
    const { image1, image2 } = req.body;

    if (!image1 || !image2) {
      return res.status(400).json({ success: false, error: 'Both images are required' });
    }

    const result = await vision.compareScreenshots(image1, image2);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vision/analyze-page
 * Analyze a browser page screenshot
 */
router.post('/analyze-page', protect, async (req, res) => {
  try {
    const { screenshot, question } = req.body;

    if (!screenshot) {
      return res.status(400).json({ success: false, error: 'Screenshot is required' });
    }

    const result = await vision.analyzeBrowserPage(screenshot, question || 'Describe this web page.');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vision/extract-data
 * Extract structured data from image
 */
router.post('/extract-data', protect, async (req, res) => {
  try {
    const { image, format } = req.body;

    if (!image || !format) {
      return res.status(400).json({ success: false, error: 'Image and format are required' });
    }

    const result = await vision.extractStructuredData(image, format);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vision/watch
 * Watch screen for changes
 */
router.post('/watch', protect, async (req, res) => {
  try {
    const { interval, timeout, description } = req.body;
    const result = await vision.watchForChange({ interval, timeout, description });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/vision/history
 * Get analysis history
 */
router.get('/history', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = vision.getHistory(limit);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
