// ============================================
// EMAIL AGENT - Gmail API Integration (PRODUCTION READY)
// ============================================
// Sends real emails via Gmail using Google Service Account
// ============================================

const { google } = require('googleapis');
const path = require('path');
const ButlerAction = require('../../models/phoenix/ButlerAction');

class EmailAgent {
  constructor() {
    this.gmail = null;
    this.serviceAccountEmail = 'phoenix-ai-butler@pheonix-cal.iam.gserviceaccount.com';
    this.initialize();
  }

  /**
   * Initialize Gmail API with service account
   */
  async initialize() {
    try {
      let credentials;

      // Check for Railway environment variable first
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      } else {
        // Fall back to local file for development
        
        const keyFilePath = path.join(__dirname, '../../google-service-account.json');
        credentials = require(keyFilePath);
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.compose'
        ]
      });

      const authClient = await auth.getClient();
      this.gmail = google.gmail({ version: 'v1', auth: authClient });

      
      

    } catch (error) {
      console.error('❌ Failed to initialize Gmail API:', error.message);
      console.warn('   Emails will be logged to database only (no actual sending)');
    }
  }

  /**
   * Create email message in base64 format
   */
  createMessage(to, subject, body, from = this.serviceAccountEmail, cc = [], bcc = []) {
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      cc.length > 0 ? `Cc: ${cc.join(', ')}` : '',
      bcc.length > 0 ? `Bcc: ${bcc.join(', ')}` : '',
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      body
    ];

    const message = messageParts.filter(line => line !== '').join('\r\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return encodedMessage;
  }

  /**
   * Send email via Gmail API
   */
  async sendEmail(data) {
    const {
      userId,
      to,
      subject,
      body,
      from,
      cc = [],
      bcc = [],
      attachments = []
    } = data;

    try {
      // Create butler action record
      const action = await ButlerAction.create({
        userId,
        actionType: 'email',
        description: `Email to ${to}: ${subject}`,
        status: 'pending',
        priority: 'medium',
        metadata: {
          to,
          subject,
          from: from || this.serviceAccountEmail,
          cc,
          bcc,
          attachments,
          bodyPreview: body.substring(0, 100)
        }
      });

      // If Gmail API not initialized, just log it
      if (!this.gmail) {
        console.warn('⚠️  Gmail API not initialized - email logged to database only');
        action.status = 'failed';
        action.errorMessage = 'Gmail API not configured';
        await action.save();

        return {
          success: false,
          emailId: action._id,
          status: 'failed',
          message: 'Gmail API integration required. Email logged to database only.',
          to,
          subject
        };
      }

      
      
      

      // Create and send email
      const encodedMessage = this.createMessage(to, subject, body, from, cc, bcc);

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      // Update action as sent
      action.status = 'sent';
      action.completedAt = new Date();
      action.metadata.messageId = response.data.id;
      action.metadata.threadId = response.data.threadId;
      await action.save();

      

      return {
        success: true,
        emailId: action._id,
        messageId: response.data.id,
        threadId: response.data.threadId,
        status: 'sent',
        to,
        subject,
        sentAt: action.completedAt,
        message: 'Email sent successfully via Gmail API'
      };

    } catch (error) {
      console.error('❌ Email sending error:', error);

      // Log failed attempt
      const action = await ButlerAction.findOne({ userId, actionType: 'email' })
        .sort({ createdAt: -1 })
        .limit(1);

      if (action) {
        action.status = 'failed';
        action.errorMessage = error.message;
        await action.save();
      }

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Get email history for user
   */
  async getEmailHistory(userId, days = 90, limit = 50, type = 'all') {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const query = {
        userId,
        actionType: 'email',
        createdAt: { $gte: startDate }
      };

      if (type !== 'all') {
        query.status = type; // 'sent', 'failed', 'pending'
      }

      const emails = await ButlerAction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return emails.map(email => ({
        id: email._id,
        to: email.metadata?.to,
        subject: email.metadata?.subject,
        from: email.metadata?.from,
        status: email.status,
        sentAt: email.completedAt,
        createdAt: email.createdAt,
        messageId: email.metadata?.messageId,
        errorMessage: email.errorMessage
      }));

    } catch (error) {
      console.error('Get email history error:', error);
      throw error;
    }
  }

  /**
   * Reply to an email
   */
  async replyToEmail(data) {
    const {
      userId,
      emailId,
      body,
      includeOriginal = true
    } = data;

    try {
      // Get original email details
      const originalEmail = await ButlerAction.findById(emailId);
      if (!originalEmail || originalEmail.actionType !== 'email') {
        throw new Error('Original email not found');
      }

      const to = originalEmail.metadata.to;
      const subject = `Re: ${originalEmail.metadata.subject}`;
      let replyBody = body;

      if (includeOriginal) {
        replyBody += `\n\n---\nOn ${originalEmail.createdAt.toLocaleString()}, you wrote:\n${originalEmail.metadata.bodyPreview}`;
      }

      // Send reply
      const result = await this.sendEmail({
        userId,
        to,
        subject,
        body: replyBody,
        from: originalEmail.metadata.from
      });

      // Update original email metadata with reply reference
      originalEmail.metadata.replied = true;
      originalEmail.metadata.replyId = result.emailId;
      await originalEmail.save();

      return result;

    } catch (error) {
      console.error('Reply to email error:', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const emails = await ButlerAction.find({
        userId,
        actionType: 'email',
        createdAt: { $gte: startDate }
      });

      const stats = {
        totalEmails: emails.length,
        sentEmails: emails.filter(e => e.status === 'sent').length,
        failedEmails: emails.filter(e => e.status === 'failed').length,
        pendingEmails: emails.filter(e => e.status === 'pending').length
      };

      return stats;

    } catch (error) {
      console.error('Get email stats error:', error);
      throw error;
    }
  }
}

module.exports = new EmailAgent();
