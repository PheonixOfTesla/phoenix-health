// Src/services/phoenix/butlerAutomation.js
// Butler Automation Service - Routes to REAL Puppeteer automation

const ButlerAction = require('../../models/phoenix/ButlerAction');
const puppeteerButler = require('./puppeteerButler');
// sessionManager not needed - handled by googleSessionHandler

class ButlerAutomation {
  constructor() {
    this.activeSessions = new Map();
  }

  // ============================================================================
  // FOOD ORDERING - DoorDash, UberEats
  // ============================================================================

  async orderFood({ userId, restaurant, items = [], deliveryAddress, preferences = {} }) {
    console.log(`[Butler] Order food request: ${restaurant} for user ${userId}`);

    // Create action record to track
    const action = await ButlerAction.create({
      userId,
      actionType: 'food',
      description: `Food order from ${restaurant}`,
      status: 'pending',
      metadata: { restaurant, items, deliveryAddress }
    });

    // Generate session ID for live streaming
    const sessionId = `butler_food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if user has credentials stored
    const User = require('../../models/User');
    const user = await User.findById(userId).select('butlerCredentials preferences address');

    const hasDoordash = user?.butlerCredentials?.doordash;
    const hasUbereats = user?.butlerCredentials?.ubereats || user?.butlerCredentials?.uber;

    if (!hasDoordash && !hasUbereats) {
      // No credentials - need user to log in first
      action.status = 'requires_login';
      action.metadata.message = 'Please connect your DoorDash or Uber Eats account first';
      await action.save();

      return {
        success: false,
        needsCredentials: true,
        services: ['doordash', 'ubereats'],
        message: 'To order food, please connect your DoorDash or Uber Eats account in Settings.',
        actionId: action._id,
        sessionId
      };
    }

    // Use delivery address from request, user preferences, or user address
    const address = deliveryAddress || preferences.address || user?.address || user?.preferences?.defaultAddress;

    if (!address) {
      return {
        success: false,
        needsInfo: true,
        missing: ['deliveryAddress'],
        message: 'What address should I deliver to?',
        actionId: action._id,
        sessionId
      };
    }

    // Determine which service to use (prefer DoorDash if available)
    const service = hasDoordash ? 'doordash' : 'ubereats';
    const credentials = service === 'doordash' ? user.butlerCredentials.doordash :
                       (user.butlerCredentials.ubereats || user.butlerCredentials.uber);

    // Execute REAL Puppeteer automation
    try {
      let result;

      if (service === 'doordash') {
        result = await puppeteerButler.orderDoorDash({
          userId,
          sessionId,
          credentials,
          restaurant,
          items,
          deliveryAddress: address,
          preferences
        });
      } else {
        result = await puppeteerButler.orderUberEats({
          userId,
          sessionId,
          credentials,
          restaurant,
          items,
          deliveryAddress: address,
          preferences
        });
      }

      // Update action record
      action.status = result.success ? 'completed' : 'failed';
      action.metadata.orderNumber = result.orderNumber;
      action.metadata.estimatedDelivery = result.estimatedDelivery;
      action.metadata.total = result.total;
      action.metadata.service = service;
      await action.save();

      return {
        success: result.success,
        actionId: action._id,
        sessionId,
        orderNumber: result.orderNumber,
        estimatedDelivery: result.estimatedDelivery,
        total: result.total,
        message: result.success
          ? `Your order from ${restaurant} is confirmed! ETA: ${result.estimatedDelivery}`
          : `Sorry, I couldn't complete your order: ${result.error}`,
        liveViewAvailable: true
      };

    } catch (error) {
      console.error('[Butler] Food order error:', error);
      action.status = 'failed';
      action.metadata.error = error.message;
      await action.save();

      return {
        success: false,
        actionId: action._id,
        sessionId,
        message: `Something went wrong ordering from ${restaurant}. ${error.message}`,
        error: error.message
      };
    }
  }

  // ============================================================================
  // RIDE BOOKING - Uber, Lyft
  // ============================================================================

  async bookRide({ userId, pickup, destination, rideType = 'UberX', service = 'uber' }) {
    console.log(`[Butler] Book ride: ${pickup} → ${destination} for user ${userId}`);

    const action = await ButlerAction.create({
      userId,
      actionType: 'ride',
      description: `Ride from ${pickup} to ${destination}`,
      status: 'pending',
      metadata: { pickup, destination, rideType, service }
    });

    const sessionId = `butler_ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check credentials
    const User = require('../../models/User');
    const user = await User.findById(userId).select('butlerCredentials');

    const hasUber = user?.butlerCredentials?.uber;
    const hasLyft = user?.butlerCredentials?.lyft;

    if (!hasUber && !hasLyft) {
      action.status = 'requires_login';
      await action.save();

      return {
        success: false,
        needsCredentials: true,
        services: ['uber', 'lyft'],
        message: 'Please connect your Uber or Lyft account in Settings.',
        actionId: action._id,
        sessionId
      };
    }

    // Determine which service
    const useService = (service === 'lyft' && hasLyft) ? 'lyft' : (hasUber ? 'uber' : 'lyft');
    const credentials = useService === 'uber' ? user.butlerCredentials.uber : user.butlerCredentials.lyft;

    try {
      let result;

      if (useService === 'uber') {
        result = await puppeteerButler.bookUberRide({
          userId,
          sessionId,
          credentials,
          pickup,
          destination,
          rideType
        });
      } else {
        result = await puppeteerButler.bookLyftRide({
          userId,
          sessionId,
          credentials,
          pickup,
          destination,
          rideType: rideType.replace('Uber', 'Lyft')
        });
      }

      action.status = result.success ? 'completed' : 'failed';
      action.metadata.rideId = result.rideId;
      action.metadata.driver = result.driver;
      action.metadata.eta = result.eta;
      action.metadata.price = result.price;
      await action.save();

      return {
        success: result.success,
        actionId: action._id,
        sessionId,
        rideId: result.rideId,
        driver: result.driver,
        eta: result.eta,
        price: result.price,
        message: result.success
          ? `Your ${useService} ride is booked! ${result.driver?.name || 'Driver'} arrives in ${result.eta}`
          : `Couldn't book your ride: ${result.error}`,
        liveViewAvailable: true
      };

    } catch (error) {
      console.error('[Butler] Ride booking error:', error);
      action.status = 'failed';
      action.metadata.error = error.message;
      await action.save();

      return {
        success: false,
        actionId: action._id,
        sessionId,
        message: `Something went wrong booking your ride. ${error.message}`,
        error: error.message
      };
    }
  }

  // ============================================================================
  // RESTAURANT RESERVATION - OpenTable
  // ============================================================================

  async makeReservation({ userId, restaurantName, date, time, partySize, preferences = {} }) {
    console.log(`[Butler] Make reservation: ${restaurantName} for user ${userId}`);

    const action = await ButlerAction.create({
      userId,
      actionType: 'reservation',
      description: `Reservation at ${restaurantName}`,
      status: 'pending',
      metadata: { restaurantName, date, time, partySize, preferences }
    });

    const sessionId = `butler_reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get user info for reservation
    const User = require('../../models/User');
    const user = await User.findById(userId).select('name email phone butlerCredentials');

    // OpenTable can work without credentials (as guest)
    const credentials = user?.butlerCredentials?.opentable || null;

    try {
      const result = await puppeteerButler.makeOpenTableReservation({
        userId,
        sessionId,
        credentials,
        restaurantName,
        date,
        time,
        partySize,
        preferences: {
          ...preferences,
          firstName: preferences.firstName || user?.name?.split(' ')[0] || 'Guest',
          lastName: preferences.lastName || user?.name?.split(' ')[1] || '',
          email: preferences.email || user?.email,
          phone: preferences.phone || user?.phone
        }
      });

      action.status = result.success ? 'completed' : 'failed';
      action.metadata.confirmationNumber = result.confirmationNumber;
      action.scheduledFor = new Date(`${date} ${time}`);
      await action.save();

      return {
        success: result.success,
        actionId: action._id,
        sessionId,
        confirmationNumber: result.confirmationNumber,
        message: result.success
          ? `Reservation confirmed at ${restaurantName} for ${partySize} on ${date} at ${time}. Confirmation: ${result.confirmationNumber}`
          : `Couldn't make reservation: ${result.error}`,
        liveViewAvailable: true
      };

    } catch (error) {
      console.error('[Butler] Reservation error:', error);
      action.status = 'failed';
      action.metadata.error = error.message;
      await action.save();

      return {
        success: false,
        actionId: action._id,
        sessionId,
        message: `Something went wrong making your reservation. ${error.message}`,
        error: error.message
      };
    }
  }

  // ============================================================================
  // EMAIL OPERATIONS - Gmail via Google Session Handler
  // ============================================================================

  async sendEmail({ userId, to, subject, body, cc, bcc }) {
    console.log(`[Butler] Send email to ${to} for user ${userId}`);

    const googleHandler = require('../butler/googleSessionHandler');

    const action = await ButlerAction.create({
      userId,
      actionType: 'email',
      description: `Email to ${to}: ${subject}`,
      status: 'pending',
      metadata: { to, subject, cc, bcc }
    });

    const sessionId = `butler_email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await googleHandler.sendEmail(userId, { to, subject, body, cc, bcc });

      action.status = result.success ? 'completed' : 'failed';
      await action.save();

      return {
        success: result.success,
        actionId: action._id,
        sessionId,
        message: result.success
          ? `Email sent to ${to}`
          : `Couldn't send email: ${result.error || 'Unknown error'}`,
        screenshot: result.screenshot
      };

    } catch (error) {
      action.status = 'failed';
      action.metadata.error = error.message;
      await action.save();

      // Check if it's a session error
      if (error.message.includes('session') || error.message.includes('log in')) {
        return {
          success: false,
          needsGoogleLogin: true,
          message: 'Please log in to your Google account first.',
          actionId: action._id,
          sessionId
        };
      }

      return {
        success: false,
        actionId: action._id,
        sessionId,
        message: `Error sending email: ${error.message}`,
        error: error.message
      };
    }
  }

  async readEmails({ userId, limit = 10, query = '' }) {
    console.log(`[Butler] Read emails for user ${userId}`);

    const googleHandler = require('../butler/googleSessionHandler');

    try {
      const result = await googleHandler.readEmails(userId, { limit, query });
      return {
        success: result.success,
        emails: result.emails,
        count: result.count,
        message: `Found ${result.count} emails`
      };
    } catch (error) {
      if (error.message.includes('session') || error.message.includes('log in')) {
        return {
          success: false,
          needsGoogleLogin: true,
          message: 'Please log in to your Google account first.'
        };
      }
      return {
        success: false,
        message: `Error reading emails: ${error.message}`,
        error: error.message
      };
    }
  }

  // ============================================================================
  // CALENDAR OPERATIONS - Google Calendar
  // ============================================================================

  async createCalendarEvent({ userId, title, date, startTime, endTime, location, description, guests }) {
    console.log(`[Butler] Create calendar event: ${title} for user ${userId}`);

    const googleHandler = require('../butler/googleSessionHandler');

    const action = await ButlerAction.create({
      userId,
      actionType: 'calendar',
      description: `Event: ${title}`,
      status: 'pending',
      metadata: { title, date, startTime, endTime, location }
    });

    try {
      const result = await googleHandler.createEvent(userId, {
        title, date, startTime, endTime, location, description, guests
      });

      action.status = result.success ? 'completed' : 'failed';
      await action.save();

      return {
        success: result.success,
        actionId: action._id,
        message: result.success
          ? `Created event "${title}" on ${date}`
          : `Couldn't create event: ${result.error || 'Unknown error'}`,
        screenshot: result.screenshot
      };

    } catch (error) {
      action.status = 'failed';
      action.metadata.error = error.message;
      await action.save();

      if (error.message.includes('session') || error.message.includes('log in')) {
        return {
          success: false,
          needsGoogleLogin: true,
          message: 'Please log in to your Google account first.'
        };
      }

      return {
        success: false,
        actionId: action._id,
        message: `Error creating event: ${error.message}`,
        error: error.message
      };
    }
  }

  // ============================================================================
  // HISTORY & UTILITIES
  // ============================================================================

  async getActionHistory(userId, actionType = null, limit = 50) {
    const query = { userId };
    if (actionType) query.actionType = actionType;

    return await ButlerAction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getReservations(userId, status = 'all', upcoming = true) {
    const query = { userId, actionType: 'reservation' };
    if (status !== 'all') query.status = status;
    if (upcoming) query.scheduledFor = { $gte: new Date() };

    return await ButlerAction.find(query).sort({ scheduledFor: 1 }).lean();
  }

  async getFoodHistory(userId, days = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await ButlerAction.find({
      userId,
      actionType: 'food',
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 }).lean();
  }

  async getRideHistory(userId) {
    return await ButlerAction.find({
      userId,
      actionType: 'ride'
    }).sort({ createdAt: -1 }).limit(50).lean();
  }

  async cleanup() {
    // Cleanup any active browser sessions
    for (const [sessionId, session] of this.activeSessions) {
      try {
        await session.close();
      } catch (e) {
        console.error(`[Butler] Error closing session ${sessionId}:`, e);
      }
    }
    this.activeSessions.clear();
  }
}

module.exports = new ButlerAutomation();
