// ============================================
// SMS AGENT - Complete Twilio SMS Integration
// ============================================
// Handles text messaging with budget tracking, delivery status, and history
// ============================================

const twilio = require('twilio');
const ButlerAction = require('../../models/phoenix/ButlerAction');
const User = require('../../models/User');

class SMSAgent {
  constructor() {
    this.client = null;
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.initialize();
  }

  /**
   * Initialize Twilio client
   */
  initialize() {
    if (!this.twilioAccountSid || !this.twilioAuthToken) {
      console.warn('⚠️  Twilio credentials not configured for SMS');
      console.warn('   Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env');
      return;
    }

    if (!this.twilioPhoneNumber) {
      console.warn('⚠️  Twilio phone number not configured');
      console.warn('   Add TWILIO_PHONE_NUMBER to .env');
      return;
    }

    try {
      this.client = twilio(this.twilioAccountSid, this.twilioAuthToken);
      
      
    } catch (error) {
      console.error('❌ Failed to initialize Twilio SMS client:', error.message);
    }
  }

  /**
   * Check if user has sufficient budget for SMS (auto-enables if not set)
   */
  async checkBudget(userId, estimatedCost = 0.0079) {
    try {
      let user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Auto-enable budget if not enabled (frictionless experience)
      const budgetEnabled = user.phoenixSettings && user.phoenixSettings.callBudget && user.phoenixSettings.callBudget.enabled;
      if (!budgetEnabled) {
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            'phoenixSettings.callBudget.enabled': true,
            'phoenixSettings.callBudget.monthlyLimit': 50.00,
            'phoenixSettings.callBudget.currentSpent': 0,
            'phoenixSettings.callBudget.alertThreshold': 0.2
          }
        }, { new: true, upsert: true });
        console.log('[SMS Agent] Auto-enabled budget for user:', userId);
      }

      // Get budget with defaults
      const budget = user.phoenixSettings?.callBudget || { enabled: true, monthlyLimit: 50.00, currentSpent: 0 };
      const remaining = (budget.monthlyLimit || 50.00) - (budget.currentSpent || 0);

      // Check if sufficient funds
      if (remaining < estimatedCost) {
        throw new Error(
          `Insufficient budget. Need $${estimatedCost.toFixed(4)}, have $${remaining.toFixed(2)}`
        );
      }

      return {
        approved: true,
        remaining,
        estimatedCost
      };

    } catch (error) {
      console.error('Budget check error:', error);
      throw error;
    }
  }

  /**
   * Deduct actual cost from user's budget
   */
  async deductBudget(userId, actualCost) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { 'phoenixSettings.callBudget.currentSpent': actualCost }
        },
        { new: true }
      );

      const budget = user.phoenixSettings.callBudget;
      const remaining = budget.monthlyLimit - budget.currentSpent;

      // Check if auto-recharge is needed
      if (budget.autoRecharge?.enabled && remaining < budget.autoRecharge.trigger) {
        
        // Implement auto-recharge logic here
      }

      return {
        deducted: actualCost,
        remaining,
        totalSpent: budget.currentSpent
      };

    } catch (error) {
      console.error('Budget deduction error:', error);
      throw error;
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS({ 
    userId, 
    phoneNumber, 
    message, 
    mediaUrls = [],
    scheduledFor = null 
  }) {
    try {
      // Validate Twilio is configured
      if (!this.client) {
        throw new Error('Twilio not configured. Check .env settings.');
      }

      // Validate inputs
      if (!phoneNumber || !message) {
        throw new Error('Phone number and message are required');
      }

      // Get user information
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Estimate cost (standard SMS is $0.0079, MMS is $0.02)
      const estimatedCost = mediaUrls.length > 0 ? 0.02 : 0.0079;
      
      // Check budget
      const budgetCheck = await this.checkBudget(userId, estimatedCost);

      
      
      

      // Create butler action record
      const action = await ButlerAction.create({
        userId,
        actionType: 'sms',
        description: `SMS to ${phoneNumber}`,
        status: 'pending',
        priority: 'medium',
        metadata: {
          phoneNumber,
          message,
          mediaUrls,
          estimatedCost,
          budgetRemaining: budgetCheck.remaining,
          scheduledFor
        }
      });

      // Prepare SMS parameters
      const apiUrl = process.env.API_URL || 'https://pal-backend-production.up.railway.app';
      const smsParams = {
        body: message,
        to: phoneNumber,
        from: this.twilioPhoneNumber,
        statusCallback: `${apiUrl}/api/webhooks/twilio/sms/status/${action._id}`
      };

      // Add media if provided
      if (mediaUrls.length > 0) {
        smsParams.mediaUrl = mediaUrls;
      }

      // Schedule or send immediately
      if (scheduledFor) {
        smsParams.sendAt = new Date(scheduledFor).toISOString();
        smsParams.scheduleType = 'fixed';
      }

      // Send SMS via Twilio
      const sms = await this.client.messages.create(smsParams);

      // Update action with message details
      action.status = sms.status === 'sent' || sms.status === 'delivered' ? 'sent' : 'pending';
      action.metadata.messageSid = sms.sid;
      action.metadata.smsStatus = sms.status;
      action.metadata.actualCost = estimatedCost;
      
      if (action.status === 'sent') {
        action.completedAt = new Date();
      }
      
      await action.save();

      // Deduct from budget if sent
      if (action.status === 'sent') {
        await this.deductBudget(userId, estimatedCost);
      }

      

      return {
        success: true,
        actionId: action._id,
        messageSid: sms.sid,
        status: sms.status,
        to: phoneNumber,
        message,
        cost: estimatedCost,
        budgetRemaining: budgetCheck.remaining - estimatedCost
      };

    } catch (error) {
      console.error('❌ SMS sending error:', error);
      
      // Log failed attempt
      if (error.message.includes('budget')) {
        throw error; // Re-throw budget errors as-is
      }

      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Handle SMS status updates from Twilio webhook
   */
  async handleSMSStatus(actionId, statusData) {
    try {
      const action = await ButlerAction.findById(actionId);
      if (!action) {
        console.warn(`Action not found: ${actionId}`);
        return;
      }

      

      // Update action based on status
      action.metadata.smsStatus = statusData.MessageStatus;

      if (statusData.MessageStatus === 'delivered') {
        action.status = 'completed';
        action.completedAt = new Date();
        
        // Deduct from budget if not already deducted
        if (!action.metadata.budgetDeducted) {
          await this.deductBudget(action.userId, action.metadata.actualCost || 0.0079);
          action.metadata.budgetDeducted = true;
        }
        
      } else if (statusData.MessageStatus === 'failed' || statusData.MessageStatus === 'undelivered') {
        action.status = 'failed';
        action.metadata.errorMessage = statusData.ErrorMessage || 'Message not delivered';
      }

      await action.save();

    } catch (error) {
      console.error('Handle SMS status error:', error);
    }
  }

  /**
   * Get SMS history for user
   */
  async getSMSHistory(userId, days = 90, limit = 50) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const messages = await ButlerAction.find({
        userId,
        actionType: 'sms',
        createdAt: { $gte: startDate }
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return messages.map(msg => ({
        id: msg._id,
        phoneNumber: msg.metadata?.phoneNumber,
        message: msg.metadata?.message,
        status: msg.status,
        smsStatus: msg.metadata?.smsStatus,
        cost: msg.metadata?.actualCost,
        direction: msg.metadata?.direction || 'outbound', // inbound or outbound
        createdAt: msg.createdAt,
        completedAt: msg.completedAt,
        messageSid: msg.metadata?.messageSid
      }));

    } catch (error) {
      console.error('Get SMS history error:', error);
      throw error;
    }
  }

  /**
   * Get SMS statistics
   */
  async getSMSStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const messages = await ButlerAction.find({
        userId,
        actionType: 'sms',
        createdAt: { $gte: startDate }
      });

      const stats = {
        totalMessages: messages.length,
        sentMessages: messages.filter(m => m.status === 'sent' || m.status === 'completed').length,
        failedMessages: messages.filter(m => m.status === 'failed').length,
        totalCost: messages.reduce((sum, m) => sum + (m.metadata?.actualCost || 0), 0),
        averageCost: 0
      };

      if (stats.totalMessages > 0) {
        stats.averageCost = stats.totalCost / stats.totalMessages;
      }

      return stats;

    } catch (error) {
      console.error('Get SMS stats error:', error);
      throw error;
    }
  }

  /**
   * Handle incoming SMS (webhook)
   * Stores incoming SMS and associates with user if phone is registered
   */
  async handleIncomingSMS(from, body, messageSid) {
    try {
      console.log('[SMS Agent] Incoming SMS from:', from);
      console.log('[SMS Agent] Message:', body);

      // Find user by phone number (match their registered phone OR phones they've texted)
      let userId = null;

      // First try to find user by their registered phone
      const userByPhone = await User.findOne({ phone: from });
      if (userByPhone) {
        userId = userByPhone._id;
        console.log('[SMS Agent] Found user by registered phone:', userId);
      } else {
        // Try to find user who sent SMS to this number (reply detection)
        const previousSMS = await ButlerAction.findOne({
          actionType: 'sms',
          'metadata.phoneNumber': from,
          status: { $in: ['sent', 'completed', 'pending'] }
        }).sort({ createdAt: -1 });

        if (previousSMS) {
          userId = previousSMS.userId;
          console.log('[SMS Agent] Found user by previous SMS:', userId);
        }
      }

      // Store the incoming SMS even without userId (for logging)
      const action = await ButlerAction.create({
        userId: userId || null,
        actionType: 'sms',
        description: `Received SMS from ${from}`,
        status: 'received',
        priority: 'medium',
        metadata: {
          phoneNumber: from,
          message: body,
          messageSid,
          direction: 'inbound',
          receivedAt: new Date()
        },
        completedAt: new Date()
      });

      console.log('[SMS Agent] Stored incoming SMS:', action._id);

      return {
        from,
        body,
        messageSid,
        received: new Date(),
        stored: true,
        userId: userId ? userId.toString() : null
      };

    } catch (error) {
      console.error('Handle incoming SMS error:', error);
      throw error;
    }
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSMS({ userId, phoneNumbers, message, delayBetween = 1000 }) {
    try {
      const results = [];
      
      for (const phoneNumber of phoneNumbers) {
        try {
          const result = await this.sendSMS({
            userId,
            phoneNumber,
            message
          });
          results.push({ phoneNumber, success: true, ...result });
          
          // Delay between messages to avoid rate limits
          if (delayBetween > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetween));
          }
          
        } catch (error) {
          results.push({ 
            phoneNumber, 
            success: false, 
            error: error.message 
          });
        }
      }

      return {
        total: phoneNumbers.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };

    } catch (error) {
      console.error('Bulk SMS error:', error);
      throw error;
    }
  }
}

module.exports = new SMSAgent();
