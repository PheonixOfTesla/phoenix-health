// Src/controllers/butlerRouterController.js
// Unified Butler Action Router
// Routes voice commands to appropriate services (Twilio, Gmail, Puppeteer, APIs)

const actionClassifier = require('../services/phoenix/actionClassifier');
const emailAgent = require('../services/phoenix/emailAgent');
const smsAgent = require('../services/phoenix/smsAgent');
const phoneAgent = require('../services/phoenix/phoneAgent');
const puppeteerButler = require('../services/phoenix/puppeteerButler');
const plaidService = require('../services/jupiter/plaidService');
const calendarSync = require('../services/earth/calendarSync');
const ButlerAction = require('../models/phoenix/ButlerAction');
const Finance = require('../models/jupiter/Finance');
const User = require('../models/User');

/**
 * @desc    Classify voice command intent
 * @route   POST /api/butler/classify
 * @access  Private
 */
exports.classifyCommand = async (req, res) => {
  try {
    const { command, context = {} } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required'
      });
    }

    // Add user context
    const userContext = {
      ...context,
      userId: req.user._id,
      userName: req.user.name
    };

    // Classify command
    const classification = actionClassifier.classify(command, userContext);

    // Generate confirmation message if action
    if (classification.category === 'butler_action') {
      classification.confirmationMessage = actionClassifier.generateConfirmation(classification);
    }

    res.json({
      success: true,
      classification
    });

  } catch (error) {
    console.error('[Butler Router] Classification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to classify command'
    });
  }
};

/**
 * @desc    Execute Butler action
 * @route   POST /api/butler/execute
 * @access  Private
 */
exports.executeAction = async (req, res) => {
  try {
    const { actionType, method, parameters, confirmed = false } = req.body;
    const userId = req.user._id;

    if (!actionType) {
      return res.status(400).json({
        success: false,
        error: 'Action type is required'
      });
    }

    // Create Butler Action record
    const actionRecord = await ButlerAction.create({
      userId,
      actionType,
      parameters,
      status: 'pending',
      method
    });

    

    let result;

    try {
      // Route to appropriate service
      switch (actionType) {
        case 'ride_booking':
          result = await this.executeRideBooking(userId, method, parameters);
          break;

        case 'calendar_event':
          result = await this.executeCalendarEvent(userId, parameters);
          break;

        case 'email':
          result = await this.executeEmail(userId, parameters);
          break;

        case 'sms':
          result = await this.executeSMS(userId, parameters);
          break;

        case 'phone_call':
          result = await this.executePhoneCall(userId, parameters);
          break;

        case 'food_order':
          result = await this.executeFoodOrder(userId, parameters);
          break;

        case 'reservation':
          result = await this.executeReservation(userId, parameters);
          break;

        case 'financial_query':
          result = await this.executeFinancialQuery(userId, parameters);
          break;

        default:
          throw new Error(`Unsupported action type: ${actionType}`);
      }

      // Update action record
      actionRecord.status = 'completed';
      actionRecord.result = result;
      actionRecord.completedAt = new Date();
      await actionRecord.save();

      res.json({
        success: true,
        action: actionRecord,
        result,
        confirmationMessage: this.generateSuccessMessage(actionType, result)
      });

    } catch (error) {
      // Update action record with error
      actionRecord.status = 'failed';
      actionRecord.error = error.message;
      actionRecord.completedAt = new Date();
      await actionRecord.save();

      throw error;
    }

  } catch (error) {
    console.error('[Butler Router] Execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute action',
      userMessage: 'I had trouble completing that action. Please try again or rephrase your request.'
    });
  }
};

/**
 * RIDE BOOKING
 * Puppeteer automation (Uber, Lyft)
 */
exports.executeRideBooking = async (userId, method, parameters) => {
  try {
    const user = await User.findById(userId);
    const servicePreference = parameters.service || 'uber';

    let result;

    if (servicePreference === 'lyft') {
      result = await puppeteerButler.bookLyftRide({
        userId,
        credentials: user?.butlerCredentials?.lyft || {},
        pickup: parameters.pickup || 'Current location',
        destination: parameters.destination,
        rideType: parameters.rideType || 'Lyft'
      });
    } else {
      // Default to Uber
      result = await puppeteerButler.bookUberRide({
        userId,
        credentials: user?.butlerCredentials?.uber || {},
        pickup: parameters.pickup || 'Current location',
        destination: parameters.destination,
        rideType: parameters.rideType || 'UberX'
      });
    }

    return {
      service: servicePreference,
      method: 'puppeteer',
      pickup: parameters.pickup || 'Current location',
      destination: parameters.destination,
      rideType: parameters.rideType || (servicePreference === 'lyft' ? 'Lyft' : 'UberX'),
      confirmationNumber: result.confirmationNumber,
      estimatedArrival: '5-10 minutes',
      success: result.success,
      actionId: result.actionId,
      userMessage: result.success ? `Your ${servicePreference} is on the way!` : `Booking failed: ${result.error}`
    };
  } catch (error) {
    console.error('[Butler] Ride booking error:', error);
    throw new Error(`Ride booking failed: ${error.message}`);
  }
};

/**
 * CALENDAR EVENT
 * Google Calendar API integration
 */
exports.executeCalendarEvent = async (userId, parameters) => {
  try {
    const workspaceIntegration = require('../services/google/workspaceIntegration');

    // Get user's Google tokens
    const user = await User.findById(userId);

    if (!user?.googleTokens?.access_token) {
      return {
        service: 'google_calendar',
        success: false,
        connected: false,
        userMessage: 'Google Calendar not connected. Please connect via Earth (Calendar) settings.'
      };
    }

    // Set credentials and create event
    workspaceIntegration.setCredentials(user.googleTokens);

    // Parse time and date into ISO datetime
    const eventDate = parameters.date || new Date().toISOString().split('T')[0];
    const eventTime = parameters.time || '09:00';
    const durationMinutes = parameters.duration || 60;

    // Build start/end times
    const startDateTime = new Date(`${eventDate}T${eventTime.includes(':') ? eventTime : eventTime + ':00'}`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    const eventData = {
      title: parameters.title || 'Meeting',
      description: parameters.description || '',
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString()
    };

    const createdEvent = await workspaceIntegration.createEvent(eventData);

    return {
      service: 'google_calendar',
      title: parameters.title || 'Meeting',
      time: parameters.time,
      date: parameters.date || 'today',
      attendees: parameters.attendees ? [parameters.attendees] : [],
      eventId: createdEvent.id,
      success: true,
      connected: true,
      userMessage: 'Meeting scheduled and calendar invite sent!'
    };
  } catch (error) {
    console.error('[Butler] Calendar event error:', error);
    throw new Error(`Calendar event failed: ${error.message}`);
  }
};

/**
 * EMAIL
 * Gmail API (existing service)
 */
exports.executeEmail = async (userId, parameters) => {
  

  try {
    const result = await emailAgent.sendEmail({
      userId,
      to: parameters.recipient,
      subject: parameters.subject || 'Message from Phoenix',
      body: parameters.body || parameters.message || ''
    });

    return {
      service: 'gmail',
      to: parameters.recipient,
      subject: parameters.subject,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      message: 'Email sent successfully!'
    };

  } catch (error) {
    console.error('[Butler Router] Email error:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

/**
 * SMS
 * Twilio SMS service
 */
exports.executeSMS = async (userId, parameters) => {
  try {
    const result = await smsAgent.sendSMS({
      userId,
      phoneNumber: parameters.recipient || parameters.to,
      message: parameters.message || parameters.body,
      mediaUrls: parameters.mediaUrls || []
    });

    return {
      service: 'twilio_sms',
      to: parameters.recipient || parameters.to,
      message: parameters.message,
      status: result.success ? 'sent' : 'failed',
      cost: result.cost || 0.0075,
      messageSid: result.messageSid,
      budgetRemaining: result.budgetRemaining,
      userMessage: 'Text message sent!'
    };
  } catch (error) {
    console.error('[Butler] SMS error:', error);
    throw new Error(`SMS failed: ${error.message}`);
  }
};

/**
 * PHONE CALL
 * Twilio calling service with AI conversation
 */
exports.executePhoneCall = async (userId, parameters) => {
  try {
    const result = await phoneAgent.initiateCall({
      userId,
      phoneNumber: parameters.recipient || parameters.to,
      purpose: parameters.purpose || parameters.script || 'General call',
      context: parameters.context || {},
      script: parameters.script,
      recordCall: parameters.record !== false,
      maxDuration: parameters.maxDuration || 300
    });

    return {
      service: 'twilio_call',
      to: parameters.recipient || parameters.to,
      status: result.status || 'initiated',
      callSid: result.callSid,
      sessionId: result.sessionId,
      cost: result.estimatedCost || 0.04,
      budgetRemaining: result.budgetRemaining,
      userMessage: 'Calling now...'
    };
  } catch (error) {
    console.error('[Butler] Phone call error:', error);
    throw new Error(`Call failed: ${error.message}`);
  }
};

/**
 * FOOD ORDER
 * Puppeteer automation (DoorDash, Uber Eats)
 */
exports.executeFoodOrder = async (userId, parameters) => {
  try {
    // Get user credentials for the service
    const user = await User.findById(userId);
    const servicePreference = parameters.service || 'doordash';

    let result;

    if (servicePreference === 'ubereats') {
      result = await puppeteerButler.orderUberEats({
        userId,
        credentials: user?.butlerCredentials?.ubereats || {},
        restaurant: parameters.restaurant,
        items: parameters.items || [],
        deliveryAddress: parameters.address || user?.address,
        preferences: {
          deliveryInstructions: parameters.instructions
        }
      });
    } else {
      // Default to DoorDash
      result = await puppeteerButler.orderDoorDash({
        userId,
        credentials: user?.butlerCredentials?.doordash || {},
        restaurant: parameters.restaurant,
        items: parameters.items || [],
        deliveryAddress: parameters.address || user?.address,
        preferences: {
          deliveryInstructions: parameters.instructions
        }
      });
    }

    return {
      service: servicePreference,
      restaurant: parameters.restaurant,
      items: parameters.items,
      orderNumber: result.orderNumber,
      estimatedDelivery: '30-45 minutes',
      success: result.success,
      actionId: result.actionId,
      userMessage: result.success ? 'Food order placed!' : `Order failed: ${result.error}`
    };
  } catch (error) {
    console.error('[Butler] Food order error:', error);
    throw new Error(`Food order failed: ${error.message}`);
  }
};

/**
 * RESTAURANT RESERVATION
 * Puppeteer automation (OpenTable)
 */
exports.executeReservation = async (userId, parameters) => {
  try {
    const user = await User.findById(userId);

    const result = await puppeteerButler.makeOpenTableReservation({
      userId,
      credentials: user?.butlerCredentials?.opentable || {},
      restaurantName: parameters.restaurant,
      date: parameters.date || new Date().toISOString().split('T')[0],
      time: parameters.time,
      partySize: parameters.partySize || 2,
      preferences: {
        firstName: user?.firstName || user?.name?.split(' ')[0],
        lastName: user?.lastName || user?.name?.split(' ')[1] || '',
        phone: user?.phone,
        email: user?.email,
        specialRequest: parameters.notes || parameters.specialRequest
      }
    });

    return {
      service: 'opentable',
      restaurant: parameters.restaurant,
      time: parameters.time,
      date: parameters.date || 'today',
      partySize: parameters.partySize || '2',
      confirmationNumber: result.confirmationNumber,
      success: result.success,
      actionId: result.actionId,
      userMessage: result.success ? 'Reservation confirmed!' : `Reservation failed: ${result.error}`
    };
  } catch (error) {
    console.error('[Butler] Reservation error:', error);
    throw new Error(`Reservation failed: ${error.message}`);
  }
};

/**
 * FINANCIAL QUERY
 * Plaid API integration
 */
exports.executeFinancialQuery = async (userId, parameters) => {
  try {
    // Get user's connected Plaid accounts
    const accounts = await Finance.find({ userId, isActive: true });

    if (!accounts || accounts.length === 0) {
      return {
        service: 'plaid',
        accountType: parameters.accountType || 'all',
        balance: 0,
        currency: 'USD',
        lastUpdated: new Date(),
        connected: false,
        userMessage: 'No bank accounts connected. Connect via Jupiter (Finance) settings.'
      };
    }

    // Filter by account type if specified
    let filteredAccounts = accounts;
    if (parameters.accountType && parameters.accountType !== 'all') {
      filteredAccounts = accounts.filter(acc =>
        acc.accountType === parameters.accountType ||
        acc.accountSubtype === parameters.accountType
      );
    }

    // Get fresh balances from Plaid if we have an access token
    let totalBalance = 0;
    let availableBalance = 0;
    const accountSummaries = [];

    for (const account of filteredAccounts) {
      try {
        if (account.plaidAccessToken) {
          const balances = await plaidService.getBalances(account.plaidAccessToken);
          const plaidAccount = balances.find(b => b.account_id === account.plaidAccountId);

          if (plaidAccount) {
            account.currentBalance = plaidAccount.balances.current || 0;
            account.availableBalance = plaidAccount.balances.available || 0;
            account.lastSynced = new Date();
            await account.save();
          }
        }

        totalBalance += account.currentBalance || 0;
        availableBalance += account.availableBalance || 0;

        accountSummaries.push({
          name: account.accountName,
          institution: account.institutionName,
          type: account.accountSubtype || account.accountType,
          current: account.currentBalance,
          available: account.availableBalance
        });
      } catch (syncError) {
        console.warn(`[Butler] Could not sync account ${account._id}:`, syncError.message);
        totalBalance += account.currentBalance || 0;
        availableBalance += account.availableBalance || 0;
      }
    }

    return {
      service: 'plaid',
      accountType: parameters.accountType || 'all',
      balance: totalBalance,
      availableBalance,
      accounts: accountSummaries,
      currency: 'USD',
      lastUpdated: new Date(),
      connected: true,
      userMessage: `Your ${parameters.accountType || 'total'} balance is $${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    };
  } catch (error) {
    console.error('[Butler] Financial query error:', error);
    throw new Error(`Financial query failed: ${error.message}`);
  }
};

/**
 * GENERATE SUCCESS MESSAGE
 * Create user-friendly confirmation message
 */
exports.generateSuccessMessage = (actionType, result) => {
  switch (actionType) {
    case 'ride_booking':
      return `Done! Your ${result.rideType || 'ride'} is on the way. Driver arriving in ${result.estimatedArrival || '5 minutes'}.`;

    case 'calendar_event':
      return `Meeting scheduled for ${result.time} ${result.date}. Calendar invite sent!`;

    case 'email':
      return `Email sent to ${result.to} successfully!`;

    case 'sms':
      return `Text message sent to ${result.to}!`;

    case 'phone_call':
      return `Calling ${result.to} now...`;

    case 'food_order':
      return `Food order placed! Estimated delivery: ${result.estimatedDelivery || '30-45 minutes'}.`;

    case 'reservation':
      return `Reservation confirmed for ${result.partySize} people at ${result.time}!`;

    case 'financial_query':
      return result.message;

    default:
      return 'Action completed successfully!';
  }
};

/**
 * @desc    Get Butler action history
 * @route   GET /api/butler/history
 * @access  Private
 */
exports.getActionHistory = async (req, res) => {
  try {
    const { limit = 20, actionType } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (actionType) {
      query.actionType = actionType;
    }

    const actions = await ButlerAction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      actions,
      count: actions.length
    });

  } catch (error) {
    console.error('[Butler Router] History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action history'
    });
  }
};

/**
 * @desc    Get available Butler services
 * @route   GET /api/butler/services
 * @access  Private
 */
exports.getAvailableServices = async (req, res) => {
  try {
    const services = {
      ride_booking: {
        enabled: true,
        methods: ['twilio', 'oauth', 'puppeteer'],
        defaultMethod: 'twilio',
        cost: '$0.04 per booking'
      },
      calendar_event: {
        enabled: true,
        methods: ['calendar_api'],
        cost: 'Free'
      },
      email: {
        enabled: true,
        methods: ['gmail_api'],
        cost: 'Free'
      },
      sms: {
        enabled: true,
        methods: ['twilio_sms'],
        cost: '$0.0075 per message'
      },
      phone_call: {
        enabled: true,
        methods: ['twilio_call'],
        cost: '$0.04 per call'
      },
      food_order: {
        enabled: true,
        methods: ['puppeteer'],
        cost: 'Free automation (food cost separate)'
      },
      reservation: {
        enabled: true,
        methods: ['puppeteer'],
        cost: 'Free'
      },
      financial_query: {
        enabled: true,
        methods: ['plaid_api'],
        cost: 'Free'
      }
    };

    res.json({
      success: true,
      services
    });

  } catch (error) {
    console.error('[Butler Router] Services error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
};
