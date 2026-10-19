/**
 * =================================================================
 * GOOGLE WORKSPACE INTEGRATION
 * =================================================================
 * Unified service for all Google APIs (all free tier)
 * - Gmail (send/receive)
 * - Google Calendar (events, scheduling)
 * - Google Drive (file storage, 15GB free)
 * - Google Tasks (to-do lists)
 * - Google Contacts (people)
 * - Google Maps (locations, directions)
 * - Google Fit (fitness data)
 * =================================================================
 */

const { google } = require('googleapis');
const path = require('path');

// Environment-based URLs
const BACKEND_URL = process.env.BACKEND_URL || 'https://pal-backend-production.up.railway.app';

class GoogleWorkspaceIntegration {
  constructor() {
    this.oauth2Client = null;
    this.gmail = null;
    this.calendar = null;
    this.drive = null;
    this.tasks = null;
    this.people = null;
    this.fitness = null;

    this.scopes = [
      // Gmail
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',

      // Calendar
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',

      // Drive (15GB free)
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',

      // Tasks
      'https://www.googleapis.com/auth/tasks',

      // Contacts
      'https://www.googleapis.com/auth/contacts.readonly'

      // Note: Google Fit scopes removed - require special verification
    ];

    
  }

  /**
   * =================================================================
   * OAUTH FLOW
   * =================================================================
   */

  /**
   * Generate OAuth URL for user to authorize Phoenix
   */
  getAuthorizationUrl(userId) {
    // Use the redirect URI from Railway env (points to /api/earth/calendar/callback/google)
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
                       process.env.GOOGLE_REDIRECT_URI ||
                       `${BACKEND_URL}/api/earth/calendar/callback/google`;

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: this.scopes,
      state: userId, // Pass userId to identify user after callback
      prompt: 'consent' // Force consent screen to get refresh token
    });

    
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      // tokens contains:
      // - access_token (expires in 1 hour)
      // - refresh_token (used to get new access tokens)
      // - expiry_date (timestamp)


      return tokens;
    } catch (error) {
      console.error('[Google Workspace] Token exchange failed:', error.message);
      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens (Popup flow)
   * Uses 'postmessage' as redirect_uri for Google Identity Services popup flow
   */
  async exchangeCodeForTokensPopup(code) {
    try {
      // Create OAuth2 client with 'postmessage' as redirect_uri
      // This is the special value required for popup-based OAuth flow
      const popupOAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
        'postmessage' // Special redirect_uri for popup flow
      );

      console.log('[Google Workspace] Exchanging code via popup flow...');

      const { tokens } = await popupOAuth2Client.getToken(code);

      console.log('[Google Workspace] Popup flow token exchange successful');

      // Store the client for later use
      this.oauth2Client = popupOAuth2Client;

      return tokens;
    } catch (error) {
      console.error('[Google Workspace] Popup token exchange failed:', error.message);
      throw error;
    }
  }

  /**
   * Set credentials for an authenticated user
   */
  setCredentials(tokens) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials(tokens);

    // Initialize all Google API clients
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.tasks = google.tasks({ version: 'v1', auth: this.oauth2Client });
    this.people = google.people({ version: 'v1', auth: this.oauth2Client });
    this.fitness = google.fitness({ version: 'v1', auth: this.oauth2Client });

    
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      return credentials;
    } catch (error) {
      console.error('[Google Workspace] Token refresh failed:', error.message);
      throw error;
    }
  }

  /**
   * =================================================================
   * GMAIL API
   * =================================================================
   */

  /**
   * Get recent emails
   */
  async getRecentEmails(maxResults = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        labelIds: ['INBOX']
      });

      const messages = response.data.messages || [];

      // Fetch full message details
      const emails = await Promise.all(
        messages.map(async (msg) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date']
          });

          const headers = detail.data.payload.headers;
          return {
            id: msg.id,
            threadId: msg.threadId,
            from: headers.find(h => h.name === 'From')?.value,
            to: headers.find(h => h.name === 'To')?.value,
            subject: headers.find(h => h.name === 'Subject')?.value,
            date: headers.find(h => h.name === 'Date')?.value
          };
        })
      );

      
      return emails;
    } catch (error) {
      console.error('[Gmail] Fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, body) {
    try {
      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ].join('\r\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      
      return response.data;
    } catch (error) {
      console.error('[Gmail] Send failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a draft email (gmail.compose scope)
   */
  async createDraft(to, subject, body) {
    try {
      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ].join('\r\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage
          }
        }
      });

      console.log('[Gmail] Draft created:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('[Gmail] Draft creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get list of drafts (gmail.compose scope)
   */
  async getDrafts(maxResults = 10) {
    try {
      const response = await this.gmail.users.drafts.list({
        userId: 'me',
        maxResults
      });

      const drafts = response.data.drafts || [];
      console.log(`[Gmail] Retrieved ${drafts.length} drafts`);
      return drafts;
    } catch (error) {
      console.error('[Gmail] Get drafts failed:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific draft by ID (gmail.compose scope)
   */
  async getDraft(draftId) {
    try {
      const response = await this.gmail.users.drafts.get({
        userId: 'me',
        id: draftId,
        format: 'full'
      });

      return response.data;
    } catch (error) {
      console.error('[Gmail] Get draft failed:', error.message);
      throw error;
    }
  }

  /**
   * Update an existing draft (gmail.compose scope)
   */
  async updateDraft(draftId, to, subject, body) {
    try {
      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ].join('\r\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.drafts.update({
        userId: 'me',
        id: draftId,
        requestBody: {
          message: {
            raw: encodedMessage
          }
        }
      });

      console.log('[Gmail] Draft updated:', draftId);
      return response.data;
    } catch (error) {
      console.error('[Gmail] Draft update failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete a draft (gmail.compose scope)
   */
  async deleteDraft(draftId) {
    try {
      await this.gmail.users.drafts.delete({
        userId: 'me',
        id: draftId
      });

      console.log('[Gmail] Draft deleted:', draftId);
      return { success: true, draftId };
    } catch (error) {
      console.error('[Gmail] Draft deletion failed:', error.message);
      throw error;
    }
  }

  /**
   * Send a draft (gmail.compose scope)
   */
  async sendDraft(draftId) {
    try {
      const response = await this.gmail.users.drafts.send({
        userId: 'me',
        requestBody: {
          id: draftId
        }
      });

      console.log('[Gmail] Draft sent:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('[Gmail] Send draft failed:', error.message);
      throw error;
    }
  }

  /**
   * =================================================================
   * GOOGLE CALENDAR API
   * =================================================================
   */

  /**
   * Get upcoming calendar events
   */
  async getUpcomingEvents(maxResults = 10) {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];

      
      return events.map(event => ({
        id: event.id,
        summary: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location,
        description: event.description
      }));
    } catch (error) {
      console.error('[Calendar] Fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Create calendar event
   */
  async createEvent(eventData) {
    try {
      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: 'America/Los_Angeles'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: 'America/Los_Angeles'
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      
      return response.data;
    } catch (error) {
      console.error('[Calendar] Event creation failed:', error.message);
      throw error;
    }
  }

  /**
   * =================================================================
   * GOOGLE DRIVE API
   * =================================================================
   */

  /**
   * List files from Drive
   */
  async listDriveFiles(maxResults = 10) {
    try {
      const response = await this.drive.files.list({
        pageSize: maxResults,
        fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)'
      });

      const files = response.data.files || [];

      
      return files;
    } catch (error) {
      console.error('[Drive] List failed:', error.message);
      throw error;
    }
  }

  /**
   * Upload file to Drive
   */
  async uploadFile(fileName, mimeType, fileContent) {
    try {
      const fileMetadata = {
        name: fileName
      };

      const media = {
        mimeType,
        body: fileContent
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink'
      });

      
      return response.data;
    } catch (error) {
      console.error('[Drive] Upload failed:', error.message);
      throw error;
    }
  }

  /**
   * =================================================================
   * GOOGLE TASKS API
   * =================================================================
   */

  /**
   * Get all task lists
   */
  async getTaskLists() {
    try {
      const response = await this.tasks.tasklists.list();
      const taskLists = response.data.items || [];

      
      return taskLists;
    } catch (error) {
      console.error('[Tasks] List fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Get tasks from a list
   */
  async getTasks(taskListId) {
    try {
      const response = await this.tasks.tasks.list({
        tasklist: taskListId || '@default'
      });

      const tasks = response.data.items || [];

      
      return tasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        due: task.due,
        notes: task.notes
      }));
    } catch (error) {
      console.error('[Tasks] Fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Create task
   */
  async createTask(taskListId, title, notes, dueDate) {
    try {
      const task = {
        title,
        notes,
        due: dueDate
      };

      const response = await this.tasks.tasks.insert({
        tasklist: taskListId || '@default',
        requestBody: task
      });

      
      return response.data;
    } catch (error) {
      console.error('[Tasks] Creation failed:', error.message);
      throw error;
    }
  }

  /**
   * =================================================================
   * GOOGLE CONTACTS API
   * =================================================================
   */

  /**
   * Get contacts
   */
  async getContacts(maxResults = 50) {
    try {
      const response = await this.people.people.connections.list({
        resourceName: 'people/me',
        pageSize: maxResults,
        personFields: 'names,emailAddresses,phoneNumbers,photos'
      });

      const connections = response.data.connections || [];

      
      return connections.map(person => ({
        resourceName: person.resourceName,
        name: person.names?.[0]?.displayName,
        email: person.emailAddresses?.[0]?.value,
        phone: person.phoneNumbers?.[0]?.value,
        photo: person.photos?.[0]?.url
      }));
    } catch (error) {
      console.error('[Contacts] Fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * =================================================================
   * GOOGLE FIT API
   * =================================================================
   */

  /**
   * Get fitness activity data
   */
  async getFitnessActivity(startTimeMillis, endTimeMillis) {
    try {
      const dataSourceId = 'derived:com.google.activity.segment:com.google.android.gms:merge_activity_segments';

      const response = await this.fitness.users.dataSources.datasets.get({
        userId: 'me',
        dataSourceId,
        datasetId: `${startTimeMillis}-${endTimeMillis}`
      });

      const points = response.data.point || [];

      
      return points;
    } catch (error) {
      console.error('[Fit] Activity fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Get heart rate data
   */
  async getHeartRateData(startTimeMillis, endTimeMillis) {
    try {
      const dataSourceId = 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm';

      const response = await this.fitness.users.dataSources.datasets.get({
        userId: 'me',
        dataSourceId,
        datasetId: `${startTimeMillis}-${endTimeMillis}`
      });

      const points = response.data.point || [];

      
      return points;
    } catch (error) {
      console.error('[Fit] Heart rate fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Get sleep data
   */
  async getSleepData(startTimeMillis, endTimeMillis) {
    try {
      const dataSourceId = 'derived:com.google.sleep.segment:com.google.android.gms:merged';

      const response = await this.fitness.users.dataSources.datasets.get({
        userId: 'me',
        dataSourceId,
        datasetId: `${startTimeMillis}-${endTimeMillis}`
      });

      const points = response.data.point || [];

      
      return points;
    } catch (error) {
      console.error('[Fit] Sleep fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * =================================================================
   * UTILITY METHODS
   * =================================================================
   */

  /**
   * Check if tokens are valid
   */
  isAuthenticated() {
    return this.oauth2Client && this.oauth2Client.credentials.access_token;
  }

  /**
   * Get current credentials
   */
  getCredentials() {
    return this.oauth2Client?.credentials;
  }
}

// Export singleton instance
module.exports = new GoogleWorkspaceIntegration();
