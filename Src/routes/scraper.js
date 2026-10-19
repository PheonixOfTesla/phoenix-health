/**
 * GENERIC SCRAPER ROUTES - Automate ANY Website
 *
 * Phoenix can now browse and interact with the entire internet.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const scraper = require('../services/genesis/genericScraper');

/**
 * POST /api/scraper/session
 * Create a new scraping session
 */
router.post('/session', protect, async (req, res) => {
  try {
    const result = await scraper.createSession();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/scraper/session/:id
 * Close a scraping session
 */
router.delete('/session/:id', protect, async (req, res) => {
  try {
    const result = await scraper.closeSession(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/scraper/sessions
 * List active sessions
 */
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = scraper.getSessions();
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/navigate
 * Navigate to any URL
 */
router.post('/navigate', protect, async (req, res) => {
  try {
    const { sessionId, url, options } = req.body;
    const result = await scraper.navigate(sessionId, url, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/click
 * Click on any element
 */
router.post('/click', protect, async (req, res) => {
  try {
    const { sessionId, selector, options } = req.body;
    const result = await scraper.click(sessionId, selector, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/type
 * Type text into any input
 */
router.post('/type', protect, async (req, res) => {
  try {
    const { sessionId, selector, text, options } = req.body;
    const result = await scraper.type(sessionId, selector, text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/fill-form
 * Fill multiple form fields
 */
router.post('/fill-form', protect, async (req, res) => {
  try {
    const { sessionId, fields } = req.body;
    const result = await scraper.fillForm(sessionId, fields);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/extract
 * Extract data from page
 */
router.post('/extract', protect, async (req, res) => {
  try {
    const { sessionId, extractions } = req.body;
    const result = await scraper.extract(sessionId, extractions);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/scraper/html/:sessionId
 * Get full page HTML
 */
router.get('/html/:sessionId', protect, async (req, res) => {
  try {
    const result = await scraper.getHTML(req.params.sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/scraper/text/:sessionId
 * Get page text content
 */
router.get('/text/:sessionId', protect, async (req, res) => {
  try {
    const result = await scraper.getText(req.params.sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/screenshot
 * Take screenshot of current page
 */
router.post('/screenshot', protect, async (req, res) => {
  try {
    const { sessionId, options } = req.body;
    const result = await scraper.screenshot(sessionId, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/evaluate
 * Execute custom JavaScript
 */
router.post('/evaluate', protect, async (req, res) => {
  try {
    const { sessionId, script } = req.body;
    const result = await scraper.evaluate(sessionId, script);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/wait
 * Wait for element or condition
 */
router.post('/wait', protect, async (req, res) => {
  try {
    const { sessionId, options } = req.body;
    const result = await scraper.wait(sessionId, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/login
 * Handle login/authentication
 */
router.post('/login', protect, async (req, res) => {
  try {
    const { sessionId, config } = req.body;
    const result = await scraper.login(sessionId, config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/sequence
 * Execute a sequence of actions
 */
router.post('/sequence', protect, async (req, res) => {
  try {
    const { sessionId, actions } = req.body;
    const result = await scraper.executeSequence(sessionId, actions);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/quick
 * Quick scrape - single URL, extract data
 */
router.post('/quick', protect, async (req, res) => {
  try {
    const { url, extractions } = req.body;
    const result = await scraper.quickScrape(url, extractions);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scraper/shutdown
 * Shutdown all sessions and browser
 */
router.post('/shutdown', protect, async (req, res) => {
  try {
    const result = await scraper.shutdown();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
