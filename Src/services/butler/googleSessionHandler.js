// Src/services/butler/googleSessionHandler.js
// Google Services Handler - Gmail, Drive, Calendar automation via Puppeteer sessions

const sessionManager = require('./sessionManager');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// ============================================================================
// GOOGLE SESSION HANDLER
// ============================================================================

class GoogleSessionHandler {
  constructor() {
    this.GOOGLE_URLS = {
      gmail: 'https://mail.google.com',
      drive: 'https://drive.google.com',
      calendar: 'https://calendar.google.com',
      login: 'https://accounts.google.com'
    };

    this.SELECTORS = {
      // Gmail selectors
      gmail: {
        compose: '[gh="cm"]',
        inbox: 'a[href*="#inbox"]',
        search: 'input[name="q"]',
        emailRow: 'tr.zA',
        emailSubject: '.bog',
        emailBody: '.a3s',
        toField: '[name="to"]',
        subjectField: '[name="subjectbox"]',
        bodyField: '[role="textbox"]',
        sendButton: '[data-tooltip*="Send"]',
        deleteButton: '[data-tooltip="Delete"]',
        unsubscribeLink: 'a[href*="unsubscribe"]',
        moreActions: '[data-tooltip="More"]'
      },
      // Drive selectors
      drive: {
        newButton: '[data-tooltip="New"]',
        fileList: '[data-id]',
        fileName: '[data-tooltip-class="simple-tooltip"]',
        downloadButton: '[data-id="download"]',
        shareButton: '[data-tooltip="Share"]',
        searchInput: 'input[placeholder*="Search"]',
        uploadInput: 'input[type="file"]'
      },
      // Calendar selectors
      calendar: {
        createButton: '[data-value="create"]',
        eventTitle: '[data-placeholder="Add title"]',
        eventDate: '[data-date]',
        eventTime: '[data-time]',
        saveButton: '[data-tooltip="Save"]',
        deleteButton: '[aria-label="Delete"]',
        eventCard: '[data-eventid]'
      }
    };
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Initialize a Google session for a user
   * @param {string} userId - User ID
   * @param {string} service - 'gmail', 'drive', or 'calendar'
   * @returns {Object} Browser page with active session
   */
  async initSession(userId, service = 'gmail') {
    console.log(`[GoogleHandler] Initializing ${service} session for user ${userId}`);

    const session = await sessionManager.getSession(userId, 'google');

    if (!session || !session.browser) {
      throw new Error('No active Google session. User must log in first.');
    }

    const page = await session.browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to the appropriate Google service
    const url = this.GOOGLE_URLS[service];
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check if we're still logged in
    const isLoggedIn = await this.checkLoginStatus(page, service);
    if (!isLoggedIn) {
      await page.close();
      throw new Error('Google session expired. User must log in again.');
    }

    return { page, session };
  }

  /**
   * Check if user is still logged into Google
   */
  async checkLoginStatus(page, service) {
    try {
      // Look for login redirect or account menu
      const url = page.url();
      if (url.includes('accounts.google.com/signin')) {
        return false;
      }

      // Service-specific checks
      if (service === 'gmail') {
        await page.waitForSelector(this.SELECTORS.gmail.compose, { timeout: 10000 });
      } else if (service === 'drive') {
        await page.waitForSelector(this.SELECTORS.drive.newButton, { timeout: 10000 });
      } else if (service === 'calendar') {
        await page.waitForSelector(this.SELECTORS.calendar.createButton, { timeout: 10000 });
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Request manual login from user
   * Returns URL for user to complete login in visible browser
   */
  async requestManualLogin(userId) {
    console.log(`[GoogleHandler] Requesting manual login for user ${userId}`);

    const result = await sessionManager.setupSession(userId, 'google', {
      visible: true,
      captureSession: true
    });

    return {
      success: true,
      message: 'Please log in to your Google account in the browser window',
      sessionId: result.sessionId,
      liveViewUrl: result.liveViewUrl
    };
  }

  // ============================================================================
  // GMAIL OPERATIONS
  // ============================================================================

  /**
   * Read emails from inbox
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   */
  async readEmails(userId, options = {}) {
    const { limit = 10, query = '' } = options;
    console.log(`[Gmail] Reading emails for user ${userId}, limit: ${limit}`);

    const { page } = await this.initSession(userId, 'gmail');

    try {
      // If search query provided, search first
      if (query) {
        const searchInput = await page.$(this.SELECTORS.gmail.search);
        await searchInput.type(query);
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }

      // Wait for email list to load
      await page.waitForSelector(this.SELECTORS.gmail.emailRow, { timeout: 10000 });

      // Extract email data
      const emails = await page.evaluate((selectors, maxEmails) => {
        const rows = document.querySelectorAll(selectors.emailRow);
        const emailData = [];

        for (let i = 0; i < Math.min(rows.length, maxEmails); i++) {
          const row = rows[i];
          const subject = row.querySelector(selectors.emailSubject)?.textContent || '';
          const sender = row.querySelector('.yW .bA4 span')?.getAttribute('email') || '';
          const snippet = row.querySelector('.y2')?.textContent || '';
          const isUnread = row.classList.contains('zE');
          const isStarred = row.querySelector('.T-KT-Jp')?.classList.contains('T-KT-Jp-Zr') || false;
          const date = row.querySelector('.xW span')?.getAttribute('title') || '';

          emailData.push({
            subject,
            sender,
            snippet,
            isUnread,
            isStarred,
            date,
            index: i
          });
        }

        return emailData;
      }, this.SELECTORS.gmail, limit);

      await page.close();

      return {
        success: true,
        emails,
        count: emails.length
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Send an email
   * @param {string} userId - User ID
   * @param {Object} emailData - Email details
   */
  async sendEmail(userId, emailData) {
    const { to, subject, body, cc, bcc } = emailData;
    console.log(`[Gmail] Sending email to ${to} for user ${userId}`);

    const { page } = await this.initSession(userId, 'gmail');

    try {
      // Click compose button
      await page.click(this.SELECTORS.gmail.compose);
      await page.waitForSelector(this.SELECTORS.gmail.toField, { timeout: 5000 });

      // Fill in email fields
      await page.type(this.SELECTORS.gmail.toField, to);

      if (cc) {
        await page.click('[data-tooltip="Add Cc"]');
        await page.type('[name="cc"]', cc);
      }

      if (bcc) {
        await page.click('[data-tooltip="Add Bcc"]');
        await page.type('[name="bcc"]', bcc);
      }

      await page.type(this.SELECTORS.gmail.subjectField, subject);
      await page.click(this.SELECTORS.gmail.bodyField);
      await page.type(this.SELECTORS.gmail.bodyField, body);

      // Take screenshot before sending
      const screenshot = await page.screenshot({ encoding: 'base64' });

      // Click send
      await page.click(this.SELECTORS.gmail.sendButton);

      // Wait for send confirmation
      await page.waitForSelector('[data-tooltip="Message sent"]', { timeout: 10000 });

      await page.close();

      return {
        success: true,
        message: `Email sent to ${to}`,
        screenshot
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Reply to an email
   * @param {string} userId - User ID
   * @param {number} emailIndex - Index of email to reply to
   * @param {string} replyBody - Reply content
   */
  async replyToEmail(userId, emailIndex, replyBody) {
    console.log(`[Gmail] Replying to email ${emailIndex} for user ${userId}`);

    const { page } = await this.initSession(userId, 'gmail');

    try {
      // Click on the email to open it
      const emailRows = await page.$$(this.SELECTORS.gmail.emailRow);
      if (emailIndex >= emailRows.length) {
        throw new Error(`Email at index ${emailIndex} not found`);
      }

      await emailRows[emailIndex].click();
      await page.waitForSelector(this.SELECTORS.gmail.emailBody, { timeout: 10000 });

      // Click reply button
      await page.click('[data-tooltip="Reply"]');
      await page.waitForSelector(this.SELECTORS.gmail.bodyField, { timeout: 5000 });

      // Type reply
      await page.type(this.SELECTORS.gmail.bodyField, replyBody);

      // Send reply
      await page.click(this.SELECTORS.gmail.sendButton);
      await page.waitForSelector('[data-tooltip="Message sent"]', { timeout: 10000 });

      await page.close();

      return {
        success: true,
        message: 'Reply sent successfully'
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Search emails
   * @param {string} userId - User ID
   * @param {string} query - Search query
   */
  async searchEmails(userId, query) {
    return this.readEmails(userId, { query, limit: 20 });
  }

  /**
   * Delete an email
   * @param {string} userId - User ID
   * @param {number} emailIndex - Index of email to delete
   */
  async deleteEmail(userId, emailIndex) {
    console.log(`[Gmail] Deleting email ${emailIndex} for user ${userId}`);

    const { page } = await this.initSession(userId, 'gmail');

    try {
      // Select the email checkbox
      const emailRows = await page.$$(this.SELECTORS.gmail.emailRow);
      if (emailIndex >= emailRows.length) {
        throw new Error(`Email at index ${emailIndex} not found`);
      }

      const checkbox = await emailRows[emailIndex].$('[role="checkbox"]');
      await checkbox.click();

      // Click delete button
      await page.click(this.SELECTORS.gmail.deleteButton);

      // Wait for undo notification (indicates successful delete)
      await page.waitForSelector('[data-tooltip="Undo"]', { timeout: 5000 });

      await page.close();

      return {
        success: true,
        message: 'Email deleted successfully'
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Unsubscribe from an email sender
   * @param {string} userId - User ID
   * @param {number} emailIndex - Index of email to unsubscribe from
   */
  async unsubscribe(userId, emailIndex) {
    console.log(`[Gmail] Unsubscribing from email ${emailIndex} for user ${userId}`);

    const { page } = await this.initSession(userId, 'gmail');

    try {
      // Open the email
      const emailRows = await page.$$(this.SELECTORS.gmail.emailRow);
      if (emailIndex >= emailRows.length) {
        throw new Error(`Email at index ${emailIndex} not found`);
      }

      await emailRows[emailIndex].click();
      await page.waitForSelector(this.SELECTORS.gmail.emailBody, { timeout: 10000 });

      // Look for unsubscribe link in email body
      const unsubscribeLink = await page.$(this.SELECTORS.gmail.unsubscribeLink);

      if (unsubscribeLink) {
        // Open in new tab to avoid leaving Gmail
        const href = await unsubscribeLink.evaluate(el => el.href);
        const newPage = await page.browser().newPage();
        await newPage.goto(href, { waitUntil: 'networkidle2', timeout: 30000 });

        // Take screenshot of unsubscribe page
        const screenshot = await newPage.screenshot({ encoding: 'base64' });

        // Try to find and click unsubscribe button
        const unsubButtons = ['unsubscribe', 'opt-out', 'remove', 'stop'];
        for (const text of unsubButtons) {
          const button = await newPage.$(`button:has-text("${text}"), a:has-text("${text}")`);
          if (button) {
            await button.click();
            await newPage.waitForTimeout(2000);
            break;
          }
        }

        await newPage.close();
        await page.close();

        return {
          success: true,
          message: 'Unsubscribe page opened and processed',
          screenshot
        };
      }

      await page.close();

      return {
        success: false,
        message: 'No unsubscribe link found in email'
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  // ============================================================================
  // GOOGLE DRIVE OPERATIONS
  // ============================================================================

  /**
   * List files in Google Drive
   * @param {string} userId - User ID
   * @param {Object} options - List options
   */
  async listFiles(userId, options = {}) {
    const { folder = 'root', limit = 20 } = options;
    console.log(`[Drive] Listing files for user ${userId}`);

    const { page } = await this.initSession(userId, 'drive');

    try {
      // Wait for file list to load
      await page.waitForSelector('[data-id]', { timeout: 10000 });

      // Extract file data
      const files = await page.evaluate((maxFiles) => {
        const items = document.querySelectorAll('[data-id]');
        const fileData = [];

        for (let i = 0; i < Math.min(items.length, maxFiles); i++) {
          const item = items[i];
          const name = item.querySelector('[data-tooltip-class]')?.getAttribute('data-tooltip') || '';
          const id = item.getAttribute('data-id') || '';
          const isFolder = item.querySelector('[data-icon="folder"]') !== null;
          const modified = item.querySelector('.aYy')?.textContent || '';

          if (name && id) {
            fileData.push({
              id,
              name,
              isFolder,
              modified,
              index: i
            });
          }
        }

        return fileData;
      }, limit);

      await page.close();

      return {
        success: true,
        files,
        count: files.length
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Download a file from Google Drive
   * @param {string} userId - User ID
   * @param {string} fileId - File ID to download
   */
  async downloadFile(userId, fileId) {
    console.log(`[Drive] Downloading file ${fileId} for user ${userId}`);

    const { page } = await this.initSession(userId, 'drive');

    try {
      // Find and right-click the file
      const fileElement = await page.$(`[data-id="${fileId}"]`);
      if (!fileElement) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      await fileElement.click({ button: 'right' });
      await page.waitForSelector('[data-id="download"]', { timeout: 5000 });

      // Click download option
      await page.click('[data-id="download"]');

      // Wait for download to start (browser handles the actual download)
      await page.waitForTimeout(3000);

      await page.close();

      return {
        success: true,
        message: 'Download initiated'
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Upload a file to Google Drive
   * @param {string} userId - User ID
   * @param {string} filePath - Local file path
   * @param {string} folder - Target folder (optional)
   */
  async uploadFile(userId, filePath, folder = null) {
    console.log(`[Drive] Uploading file for user ${userId}`);

    const { page } = await this.initSession(userId, 'drive');

    try {
      // Click "New" button
      await page.click(this.SELECTORS.drive.newButton);
      await page.waitForSelector('[data-id="upload"]', { timeout: 5000 });

      // Click "File upload"
      await page.click('[data-id="upload"]');

      // Handle file input
      const fileInput = await page.$('input[type="file"]');
      await fileInput.uploadFile(filePath);

      // Wait for upload to complete
      await page.waitForSelector('[data-tooltip="Upload complete"]', { timeout: 60000 });

      await page.close();

      return {
        success: true,
        message: 'File uploaded successfully'
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Share a file or folder
   * @param {string} userId - User ID
   * @param {string} fileId - File ID to share
   * @param {string} email - Email to share with
   * @param {string} role - 'viewer', 'commenter', or 'editor'
   */
  async shareFile(userId, fileId, email, role = 'viewer') {
    console.log(`[Drive] Sharing file ${fileId} with ${email} for user ${userId}`);

    const { page } = await this.initSession(userId, 'drive');

    try {
      // Find and select the file
      const fileElement = await page.$(`[data-id="${fileId}"]`);
      if (!fileElement) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      await fileElement.click();

      // Click share button (keyboard shortcut or button)
      await page.keyboard.down('Control');
      await page.keyboard.press('.');
      await page.keyboard.up('Control');

      // Or try the share button
      await page.waitForSelector('[data-tooltip="Share"]', { timeout: 3000 }).catch(() => {});
      const shareButton = await page.$('[data-tooltip="Share"]');
      if (shareButton) {
        await shareButton.click();
      }

      // Wait for share dialog
      await page.waitForSelector('[aria-label="Add people and groups"]', { timeout: 10000 });

      // Enter email
      await page.type('[aria-label="Add people and groups"]', email);
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');

      // Set role if not default viewer
      if (role !== 'viewer') {
        await page.click('[data-value="editor"]');
        await page.waitForSelector(`[data-value="${role}"]`);
        await page.click(`[data-value="${role}"]`);
      }

      // Click send/share
      await page.click('[data-id="sharebutton"]');

      await page.close();

      return {
        success: true,
        message: `File shared with ${email} as ${role}`
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  // ============================================================================
  // GOOGLE CALENDAR OPERATIONS
  // ============================================================================

  /**
   * Get calendar events
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   */
  async getEvents(userId, options = {}) {
    const { startDate, endDate, limit = 10 } = options;
    console.log(`[Calendar] Getting events for user ${userId}`);

    const { page } = await this.initSession(userId, 'calendar');

    try {
      // Wait for calendar to load
      await page.waitForSelector('[data-eventid]', { timeout: 10000 }).catch(() => {});

      // Extract visible events
      const events = await page.evaluate((maxEvents) => {
        const eventElements = document.querySelectorAll('[data-eventid]');
        const eventData = [];

        for (let i = 0; i < Math.min(eventElements.length, maxEvents); i++) {
          const el = eventElements[i];
          const title = el.querySelector('[data-eventchip]')?.textContent ||
                       el.textContent?.trim() || '';
          const eventId = el.getAttribute('data-eventid') || '';
          const time = el.closest('[data-datekey]')?.getAttribute('data-datekey') || '';

          if (eventId) {
            eventData.push({
              id: eventId,
              title,
              time,
              index: i
            });
          }
        }

        return eventData;
      }, limit);

      await page.close();

      return {
        success: true,
        events,
        count: events.length
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Create a calendar event
   * @param {string} userId - User ID
   * @param {Object} eventData - Event details
   */
  async createEvent(userId, eventData) {
    const { title, date, startTime, endTime, location, description, guests } = eventData;
    console.log(`[Calendar] Creating event "${title}" for user ${userId}`);

    const { page } = await this.initSession(userId, 'calendar');

    try {
      // Click create button
      await page.click(this.SELECTORS.calendar.createButton);
      await page.waitForSelector(this.SELECTORS.calendar.eventTitle, { timeout: 5000 });

      // Fill in event details
      await page.type(this.SELECTORS.calendar.eventTitle, title);

      // Set date if provided
      if (date) {
        await page.click('[data-key="startDate"]');
        await page.type('[data-key="startDate"] input', date);
      }

      // Set times if provided
      if (startTime) {
        await page.click('[data-key="startTime"]');
        await page.type('[data-key="startTime"] input', startTime);
      }

      if (endTime) {
        await page.click('[data-key="endTime"]');
        await page.type('[data-key="endTime"] input', endTime);
      }

      // Add location if provided
      if (location) {
        await page.click('[data-key="location"]');
        await page.type('[aria-label="Add location"]', location);
      }

      // Add description if provided
      if (description) {
        await page.click('[aria-label="Add description"]');
        await page.type('[aria-label="Add description"]', description);
      }

      // Add guests if provided
      if (guests && guests.length > 0) {
        await page.click('[aria-label="Add guests"]');
        for (const guest of guests) {
          await page.type('[aria-label="Add guests"]', guest);
          await page.keyboard.press('Enter');
        }
      }

      // Take screenshot before saving
      const screenshot = await page.screenshot({ encoding: 'base64' });

      // Save event
      await page.click(this.SELECTORS.calendar.saveButton);

      // Wait for event to be created
      await page.waitForTimeout(2000);

      await page.close();

      return {
        success: true,
        message: `Event "${title}" created successfully`,
        screenshot
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Delete a calendar event
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID to delete
   */
  async deleteEvent(userId, eventId) {
    console.log(`[Calendar] Deleting event ${eventId} for user ${userId}`);

    const { page } = await this.initSession(userId, 'calendar');

    try {
      // Find and click the event
      const eventElement = await page.$(`[data-eventid="${eventId}"]`);
      if (!eventElement) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      await eventElement.click();

      // Wait for event popup
      await page.waitForSelector('[aria-label="Delete"]', { timeout: 5000 });

      // Click delete
      await page.click('[aria-label="Delete"]');

      // Confirm deletion if dialog appears
      const confirmBtn = await page.$('[data-mdc-dialog-action="ok"]');
      if (confirmBtn) {
        await confirmBtn.click();
      }

      await page.close();

      return {
        success: true,
        message: 'Event deleted successfully'
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Update a calendar event
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID to update
   * @param {Object} updates - Fields to update
   */
  async updateEvent(userId, eventId, updates) {
    console.log(`[Calendar] Updating event ${eventId} for user ${userId}`);

    const { page } = await this.initSession(userId, 'calendar');

    try {
      // Find and click the event
      const eventElement = await page.$(`[data-eventid="${eventId}"]`);
      if (!eventElement) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      await eventElement.click();

      // Click edit/pencil icon
      await page.waitForSelector('[aria-label="Edit event"]', { timeout: 5000 });
      await page.click('[aria-label="Edit event"]');

      // Wait for edit form
      await page.waitForSelector(this.SELECTORS.calendar.eventTitle, { timeout: 5000 });

      // Update title if provided
      if (updates.title) {
        const titleInput = await page.$(this.SELECTORS.calendar.eventTitle);
        await titleInput.click({ clickCount: 3 }); // Select all
        await page.type(this.SELECTORS.calendar.eventTitle, updates.title);
      }

      // Update other fields as needed...
      if (updates.location) {
        await page.click('[data-key="location"]');
        const locationInput = await page.$('[aria-label="Add location"]');
        await locationInput.click({ clickCount: 3 });
        await page.type('[aria-label="Add location"]', updates.location);
      }

      // Save changes
      await page.click(this.SELECTORS.calendar.saveButton);
      await page.waitForTimeout(2000);

      await page.close();

      return {
        success: true,
        message: 'Event updated successfully'
      };

    } catch (error) {
      await page.close();
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new GoogleSessionHandler();
