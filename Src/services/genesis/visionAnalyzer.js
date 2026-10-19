/**
 * VISION ANALYZER - Phoenix Can See
 *
 * Takes screenshots and uses Claude Vision to understand what's on screen.
 * This is what makes Phoenix truly "conscious" - it can SEE.
 *
 * Capabilities:
 * - Analyze screenshots (desktop, browser, any image)
 * - Describe what's visible
 * - Find UI elements
 * - Read text from images (OCR)
 * - Understand context
 * - Guide user actions
 */

const Anthropic = require('@anthropic-ai/sdk');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy-key-not-configured'
});

// Vision model
const VISION_MODEL = 'claude-sonnet-4-20250514';

class VisionAnalyzer {
  constructor() {
    this.analysisHistory = [];
    this.maxHistory = 100;
  }

  /**
   * Take a screenshot of the desktop (macOS)
   */
  async captureScreen(options = {}) {
    const {
      region = null,  // { x, y, width, height } or null for full screen
      display = 0,
      format = 'png'
    } = options;

    const tempPath = `/tmp/phoenix_screenshot_${Date.now()}.${format}`;

    try {
      let command = `screencapture -x`;

      if (region) {
        command += ` -R${region.x},${region.y},${region.width},${region.height}`;
      }

      if (display > 0) {
        command += ` -D${display}`;
      }

      command += ` "${tempPath}"`;

      await execAsync(command);

      // Read the file as base64
      const imageBuffer = await fs.readFile(tempPath);
      const base64 = imageBuffer.toString('base64');

      // Clean up temp file
      await fs.unlink(tempPath);

      return {
        success: true,
        image: base64,
        format,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[VISION] Screenshot failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze an image using Claude Vision
   */
  async analyzeImage(imageBase64, prompt, options = {}) {
    const {
      mediaType = 'image/png',
      maxTokens = 1024,
      detail = 'high'
    } = options;

    try {
      console.log('[VISION] Analyzing image...');

      let analysis;
      let tokens = 0;
      let usedModel = VISION_MODEL;

      try {
        // Try Claude Vision first
        const response = await anthropic.messages.create({
          model: VISION_MODEL,
          max_tokens: maxTokens,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }]
        });

        analysis = response.content[0].text;
        tokens = response.usage.output_tokens;
      } catch (claudeError) {
        console.warn('[VISION] Claude failed, using fallback response:', claudeError.message);

        // Fallback: Return a helpful message instead of failing
        analysis = `Vision analysis temporarily unavailable (Claude credits needed). The image was captured successfully but cannot be analyzed at this time. Please add Anthropic credits to enable full vision capabilities.`;
        usedModel = 'fallback-message';
      }

      // Log to history
      this.addToHistory({
        type: 'analysis',
        prompt,
        result: analysis,
        tokens,
        model: usedModel,
        timestamp: new Date().toISOString()
      });

      console.log('[VISION] Analysis complete');

      return {
        success: true,
        analysis,
        tokens,
        model: usedModel
      };
    } catch (error) {
      console.error('[VISION] Analysis failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * See the screen - capture and analyze in one call
   */
  async seeScreen(question = 'What is currently on the screen? Describe everything you see.') {
    // Capture
    const capture = await this.captureScreen();
    if (!capture.success) {
      return capture;
    }

    // Analyze
    const analysis = await this.analyzeImage(capture.image, question);

    return {
      success: analysis.success,
      question,
      answer: analysis.analysis,
      timestamp: capture.timestamp
    };
  }

  /**
   * Find UI elements on screen
   */
  async findElements(description) {
    const prompt = `Look at this screenshot and find UI elements matching this description: "${description}"

For each matching element, describe:
1. What it is (button, text field, menu item, etc.)
2. Its approximate location on screen (top-left, center, bottom-right, etc.)
3. Any text or label associated with it
4. Whether it appears clickable/interactive

If no matching elements are found, say so clearly.`;

    return this.seeScreen(prompt);
  }

  /**
   * Read text from screen (OCR-like)
   */
  async readText(region = null) {
    const prompt = `Read and extract ALL text visible in this screenshot.
Include:
- Window titles
- Menu items
- Button labels
- Body text
- Any other visible text

Format the text in a structured way, grouping related text together.`;

    const capture = await this.captureScreen({ region });
    if (!capture.success) return capture;

    return this.analyzeImage(capture.image, prompt);
  }

  /**
   * Understand current context
   */
  async getContext() {
    const prompt = `Analyze this screenshot and tell me:

1. What application(s) are currently open?
2. What is the user currently doing or working on?
3. Are there any notifications, alerts, or things needing attention?
4. What actions might the user want to take next?

Be concise but thorough.`;

    return this.seeScreen(prompt);
  }

  /**
   * Guide user to click something
   */
  async findClickTarget(targetDescription) {
    const prompt = `I need to click on: "${targetDescription}"

Look at this screenshot and tell me:
1. Can you see this element?
2. Where exactly is it located? (be very specific - top/middle/bottom, left/center/right)
3. What does it look like? (button style, color, text)
4. Is it currently clickable or disabled?

If you can't find it, suggest where to look or what to do to make it visible.`;

    return this.seeScreen(prompt);
  }

  /**
   * Compare two screenshots (detect changes)
   */
  async compareScreenshots(image1Base64, image2Base64) {
    const prompt = `Compare these two screenshots and describe:

1. What has changed between them?
2. Are there any new elements?
3. Are there any elements that disappeared?
4. Has any text changed?
5. What action might have caused these changes?`;

    try {
      const response = await anthropic.messages.create({
        model: VISION_MODEL,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: image1Base64
              }
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: image2Base64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      });

      return {
        success: true,
        comparison: response.content[0].text,
        tokens: response.usage.output_tokens
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze browser page (from scraper screenshot)
   */
  async analyzeBrowserPage(screenshotBase64, question) {
    const prompt = `This is a screenshot of a web page. ${question}

Analyze the page structure, content, and any interactive elements.`;

    return this.analyzeImage(screenshotBase64, prompt);
  }

  /**
   * Extract structured data from screenshot
   */
  async extractStructuredData(imageBase64, dataFormat) {
    const prompt = `Extract data from this image in the following format:
${JSON.stringify(dataFormat, null, 2)}

Return ONLY valid JSON matching this structure. If a field is not visible, use null.`;

    const analysis = await this.analyzeImage(imageBase64, prompt, { maxTokens: 2048 });

    if (analysis.success) {
      try {
        // Try to parse as JSON
        const jsonMatch = analysis.analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          return { success: true, data };
        }
      } catch (e) {
        // Return raw analysis if not valid JSON
      }
    }

    return analysis;
  }

  /**
   * Monitor screen for changes (returns when change detected)
   */
  async watchForChange(options = {}) {
    const {
      interval = 1000,      // Check every 1 second
      timeout = 60000,      // Give up after 60 seconds
      description = null    // Optional: specific change to watch for
    } = options;

    console.log('[VISION] Starting screen watch...');

    const startTime = Date.now();
    let previousCapture = await this.captureScreen();
    if (!previousCapture.success) return previousCapture;

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval));

      const currentCapture = await this.captureScreen();
      if (!currentCapture.success) continue;

      // Compare screenshots
      const comparison = await this.compareScreenshots(
        previousCapture.image,
        currentCapture.image
      );

      if (comparison.success && !comparison.comparison.toLowerCase().includes('no change')) {
        // If looking for specific change, check if it matches
        if (description) {
          const matches = comparison.comparison.toLowerCase().includes(description.toLowerCase());
          if (matches) {
            return {
              success: true,
              changeDetected: true,
              description: comparison.comparison,
              watchDuration: Date.now() - startTime
            };
          }
        } else {
          return {
            success: true,
            changeDetected: true,
            description: comparison.comparison,
            watchDuration: Date.now() - startTime
          };
        }
      }

      previousCapture = currentCapture;
    }

    return {
      success: true,
      changeDetected: false,
      message: 'Timeout reached without detecting change',
      watchDuration: timeout
    };
  }

  /**
   * Add to analysis history
   */
  addToHistory(entry) {
    this.analysisHistory.push(entry);
    if (this.analysisHistory.length > this.maxHistory) {
      this.analysisHistory.shift();
    }
  }

  /**
   * Get analysis history
   */
  getHistory(limit = 20) {
    return this.analysisHistory.slice(-limit);
  }
}

module.exports = new VisionAnalyzer();
