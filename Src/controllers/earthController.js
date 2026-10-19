const CalendarEvent = require('../models/earth/CalendarEvent');
const EnergyPattern = require('../models/earth/EnergyPattern');
const calendarSync = require('../services/earth/calendarSync');
const energyOptimizer = require('../services/earth/energyOptimizer');

// ✨ Import domain events for consciousness integration
const domainEvents = require('../services/phoenix/domainEventEmitter');

exports.connectCalendar = async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user.id;

    const validProviders = ['google', 'outlook'];
    if (!validProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
      });
    }

    const authData = await calendarSync.initiateOAuth(userId, provider);

    res.json({
      success: true,
      provider,
      authUrl: authData.authUrl,
      state: authData.state,
      message: 'Redirect user to authUrl to complete OAuth flow'
    });
  } catch (error) {
    console.error('Calendar connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate calendar connection',
      details: error.message
    });
  }
};

exports.handleCalendarCallback = async (req, res) => {
  try {
    const { code, state, provider } = req.body;
    const userId = req.user.id;

    if (!code || !state || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: code, state, provider'
      });
    }

    const result = await calendarSync.handleOAuthCallback(userId, provider, code, state);
    const syncResult = await calendarSync.syncCalendar(userId, provider);

    res.json({
      success: true,
      connected: true,
      provider,
      eventsImported: syncResult.eventsImported,
      lastSync: new Date(),
      message: `${provider} calendar connected successfully`
    });
  } catch (error) {
    console.error('Calendar callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete calendar connection',
      details: error.message
    });
  }
};

exports.getCalendarEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, days = 7 } = req.query || {};

    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
        });
      }
    } else {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setDate(end.getDate() + parseInt(days));
      end.setHours(23, 59, 59, 999);
    }

    const events = await CalendarEvent.find({
      userId,
      startTime: { $gte: start, $lte: end }
    }).sort({ startTime: 1 }).lean();

    const stats = {
      totalEvents: events.length,
      totalMeetingTime: events.reduce((acc, event) => {
        const duration = (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60);
        return acc + duration;
      }, 0),
      eventTypes: events.reduce((acc, event) => {
        acc[event.type || 'other'] = (acc[event.type || 'other'] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      events,
      stats,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve calendar events',
      details: error.message
    });
  }
};

exports.createCalendarEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, startTime, endTime, description, location, type } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, startTime, endTime'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    const event = await CalendarEvent.create({
      userId,
      title,
      startTime: start,
      endTime: end,
      description: description || '',
      location: location || '',
      type: type || 'personal',
      provider: 'manual',
      providerEventId: `manual_${Date.now()}`
    });

    // ✨ EMIT EVENT: Calendar event created
    domainEvents.emitEventCreated(userId, {
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type,
      duration: (end - start) / (1000 * 60) // minutes
    });

    res.status(201).json({
      success: true,
      event,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create calendar event',
      details: error.message
    });
  }
};

exports.getEnergyOptimizedSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateParam = (req.query || {}).date;
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    if (dateParam && isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
      });
    }

    targetDate.setHours(0, 0, 0, 0);

    const energyPattern = await EnergyPattern.findOne({ userId }).lean();

    if (!energyPattern) {
      return res.status(404).json({
        success: false,
        error: 'No energy pattern data found. Please log energy levels first.',
        suggestion: 'Use POST /api/earth/energy/log to start tracking energy'
      });
    }

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const events = await CalendarEvent.find({
      userId,
      startTime: { $gte: targetDate, $lt: nextDay }
    }).sort({ startTime: 1 }).lean();

    const optimizedSchedule = await energyOptimizer.optimizeSchedule(
      userId,
      targetDate,
      events,
      energyPattern
    );

    res.json({
      success: true,
      date: targetDate,
      energyPattern: energyPattern.pattern,
      peakEnergyTime: energyPattern.peakEnergyTime,
      currentSchedule: events,
      optimizedSchedule: optimizedSchedule.recommendations,
      energyAlignment: optimizedSchedule.alignmentScore,
      suggestions: optimizedSchedule.suggestions,
      insights: optimizedSchedule.insights
    });
  } catch (error) {
    console.error('Energy map error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate energy-optimized schedule',
      details: error.message
    });
  }
};

exports.detectConflicts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30, startDate: startDateParam } = req.query || {};

    const startDate = startDateParam ? new Date(startDateParam) : new Date();

    if (startDateParam && isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD)'
      });
    }

    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(days));

    const events = await CalendarEvent.find({
      userId,
      startTime: { $gte: startDate, $lte: endDate }
    }).sort({ startTime: 1 }).lean();

    const conflicts = [];
    const overbooked = [];

    for (let i = 0; i < events.length - 1; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        const start1 = new Date(event1.startTime);
        const end1 = new Date(event1.endTime);
        const start2 = new Date(event2.startTime);
        const end2 = new Date(event2.endTime);

        if (start1 < end2 && start2 < end1) {
          conflicts.push({
            event1: {
              id: event1._id,
              title: event1.title,
              start: event1.startTime,
              end: event1.endTime
            },
            event2: {
              id: event2._id,
              title: event2.title,
              start: event2.startTime,
              end: event2.endTime
            },
            overlapMinutes: Math.min(
              (end1 - start2) / (1000 * 60),
              (end2 - start1) / (1000 * 60)
            )
          });
        }
      }
    }

    const dailyMeetingTime = {};
    events.forEach(event => {
      const dateKey = new Date(event.startTime).toISOString().split('T')[0];
      const duration = (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60 * 60);
      dailyMeetingTime[dateKey] = (dailyMeetingTime[dateKey] || 0) + duration;
    });

    Object.entries(dailyMeetingTime).forEach(([date, hours]) => {
      if (hours > 8) {
        overbooked.push({
          date,
          totalHours: hours.toFixed(2),
          message: `Overbooked day: ${hours.toFixed(2)} hours of meetings`
        });
      }
    });

    res.json({
      success: true,
      dateRange: { start: startDate, end: endDate },
      conflicts,
      overbooked,
      summary: {
        totalConflicts: conflicts.length,
        overbookedDays: overbooked.length,
        totalEvents: events.length
      },
      recommendations: conflicts.length > 0 || overbooked.length > 0
        ? ['Review conflicting events', 'Consider rescheduling overlapping meetings', 'Add buffer time between meetings']
        : ['Schedule looks good! No conflicts detected.']
    });
  } catch (error) {
    console.error('Detect conflicts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect scheduling conflicts',
      details: error.message
    });
  }
};

exports.syncCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.body;

    let results;

    if (provider) {
      results = await calendarSync.syncCalendar(userId, provider);
    } else {
      results = await calendarSync.syncAllCalendars(userId);
    }

    res.json({
      success: true,
      synced: true,
      results,
      lastSync: new Date(),
      message: provider
        ? `${provider} calendar synced successfully`
        : 'All calendars synced successfully'
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync calendar',
      details: error.message
    });
  }
};

exports.getEnergyPattern = async (req, res) => {
  try {
    const userId = req.user.id;

    const energyPattern = await EnergyPattern.findOne({ userId }).lean();

    if (!energyPattern) {
      // Return sensible defaults instead of 404
      // Default pattern: moderate energy with typical peaks at 10am and 3pm
      const defaultPattern = Array(24).fill(null).map((_, hour) => {
        if (hour >= 6 && hour <= 9) return 60 + (hour - 6) * 10; // Morning ramp up
        if (hour >= 10 && hour <= 12) return 80; // Morning peak
        if (hour >= 13 && hour <= 14) return 60; // Post-lunch dip
        if (hour >= 15 && hour <= 17) return 75; // Afternoon peak
        if (hour >= 18 && hour <= 21) return 65 - (hour - 18) * 10; // Evening wind down
        if (hour >= 22 || hour <= 5) return 30; // Night/sleep
        return 50;
      });

      return res.json({
        success: true,
        pattern: defaultPattern,
        peakEnergyTime: 10,
        lowEnergyTime: 14,
        chronotype: 'balanced',
        consistency: 0,
        dataPoints: 0,
        lastUpdated: null,
        insights: ['Start logging your energy levels to personalize your pattern', 'Defaults shown based on typical circadian rhythm'],
        isDefault: true,
        suggestion: 'Use POST /api/earth/energy/log to start tracking'
      });
    }

    const insights = await energyOptimizer.generateEnergyInsights(energyPattern);

    res.json({
      success: true,
      pattern: energyPattern.pattern,
      peakEnergyTime: energyPattern.peakEnergyTime,
      lowEnergyTime: energyPattern.lowEnergyTime,
      chronotype: energyPattern.chronotype,
      consistency: energyPattern.consistency,
      dataPoints: energyPattern.dataPoints,
      lastUpdated: energyPattern.updatedAt,
      insights,
      isDefault: false
    });
  } catch (error) {
    console.error('Get energy pattern error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve energy pattern',
      details: error.message
    });
  }
};

exports.logEnergyLevel = async (req, res) => {
  try {
    const userId = req.user.id;
    const { level, timestamp, notes } = req.body;

    if (!level || level < 1 || level > 10) {
      return res.status(400).json({
        success: false,
        error: 'Energy level must be between 1 and 10'
      });
    }

    // Convert 1-10 scale to 0-100 for model
    const energyLevel = level * 10;
    const logTime = timestamp ? new Date(timestamp) : new Date();
    const hour = logTime.getHours();

    // Get today's date at midnight for unique daily pattern
    const today = new Date(logTime);
    today.setHours(0, 0, 0, 0);

    // Find or create today's energy pattern
    let energyPattern = await EnergyPattern.findOne({
      userId,
      date: today
    });

    if (!energyPattern) {
      energyPattern = new EnergyPattern({
        userId,
        date: today,
        hourlyEnergy: []
      });
    }

    // Add or update the hourly energy entry
    const existingIndex = energyPattern.hourlyEnergy.findIndex(h => h.hour === hour);
    if (existingIndex >= 0) {
      // Update existing entry
      energyPattern.hourlyEnergy[existingIndex].energyLevel = energyLevel;
      energyPattern.hourlyEnergy[existingIndex].activity = notes || '';
    } else {
      // Add new entry
      energyPattern.hourlyEnergy.push({
        hour,
        energyLevel,
        activity: notes || ''
      });
    }

    // Save (pre-save middleware calculates derived fields)
    await energyPattern.save();

    res.json({
      success: true,
      logged: true,
      energyLevel: level,
      energyLevelScaled: energyLevel,
      timestamp: logTime,
      hour,
      pattern: energyPattern.pattern,
      avgDailyEnergy: energyPattern.avgDailyEnergy,
      peakEnergyHours: energyPattern.peakEnergyHours,
      dataPoints: energyPattern.hourlyEnergy.length,
      message: 'Energy level logged successfully'
    });
  } catch (error) {
    console.error('Log energy level error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log energy level',
      details: error.message
    });
  }
};

exports.getOptimalMeetingTimes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'routine', duration = 60 } = req.query || {};

    const energyPattern = await EnergyPattern.findOne({ userId }).lean();

    if (!energyPattern) {
      return res.status(404).json({
        success: false,
        error: 'No energy pattern data found',
        suggestion: 'Log energy levels to get personalized recommendations'
      });
    }

    const meetingTypeRequirements = {
      focus: { minEnergy: 7, ideal: 'peak' },
      creative: { minEnergy: 6, ideal: 'high' },
      social: { minEnergy: 5, ideal: 'medium-high' },
      routine: { minEnergy: 4, ideal: 'any' }
    };

    const requirement = meetingTypeRequirements[type] || meetingTypeRequirements.routine;

    const optimalSlots = energyPattern.pattern
      .map((level, hour) => ({ hour, level }))
      .filter(slot => slot.level !== null && slot.level >= requirement.minEnergy)
      .sort((a, b) => b.level - a.level)
      .slice(0, 5)
      .map(slot => ({
        hour: slot.hour,
        timeRange: `${slot.hour}:00 - ${(slot.hour + 1) % 24}:00`,
        energyLevel: slot.level,
        suitability: slot.level >= 8 ? 'excellent' : slot.level >= 6 ? 'good' : 'acceptable'
      }));

    res.json({
      success: true,
      meetingType: type,
      duration: parseInt(duration),
      chronotype: energyPattern.chronotype,
      optimalTimes: optimalSlots,
      recommendations: [
        `Best time for ${type} meetings: ${optimalSlots[0]?.timeRange || 'Not enough data'}`,
        `Your peak energy is at ${energyPattern.peakEnergyTime}:00`,
        `Avoid scheduling ${type} meetings during low energy hours (around ${energyPattern.lowEnergyTime}:00)`
      ],
      insights: energyOptimizer.getMeetingTypeInsights(type, energyPattern)
    });
  } catch (error) {
    console.error('Get optimal times error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get optimal meeting times',
      details: error.message
    });
  }
};

exports.predictEnergy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, hour } = req.query;

    if (hour === undefined || hour < 0 || hour > 23) {
      return res.status(400).json({
        success: false,
        error: 'Hour must be specified and between 0 and 23'
      });
    }

    const energyPattern = await EnergyPattern.findOne({ userId }).lean();

    if (!energyPattern) {
      return res.status(404).json({
        success: false,
        error: 'No energy pattern data found',
        suggestion: 'Log energy levels to enable predictions'
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    const targetHour = parseInt(hour);

    const predictedLevel = energyPattern.pattern[targetHour];

    if (predictedLevel === null) {
      return res.json({
        success: true,
        prediction: null,
        message: 'No data available for this hour yet',
        suggestion: 'Log more energy levels during this time'
      });
    }

    const confidence = Math.min(
      100,
      (energyPattern.dataPoints / 100) * 100
    );

    const context = {
      isPeakTime: targetHour === energyPattern.peakEnergyTime,
      isLowTime: targetHour === energyPattern.lowEnergyTime,
      recommendation: predictedLevel >= 7
        ? 'Great time for important tasks'
        : predictedLevel >= 5
        ? 'Good time for routine work'
        : 'Consider lighter tasks or rest'
    };

    res.json({
      success: true,
      prediction: {
        date: targetDate,
        hour: targetHour,
        predictedLevel,
        confidence: Math.round(confidence),
        ...context
      },
      chronotype: energyPattern.chronotype,
      dataPoints: energyPattern.dataPoints
    });
  } catch (error) {
    console.error('Predict energy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict energy level',
      details: error.message
    });
  }
};

module.exports = exports;
