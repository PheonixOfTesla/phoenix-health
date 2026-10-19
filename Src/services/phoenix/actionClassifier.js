// Src/services/phoenix/actionClassifier.js
// Action vs Wisdom Classification for Voice Commands
// Routes commands to Butler (actions) or AI (wisdom/conversation)

class ActionClassifier {
  constructor() {
    // Action patterns with parameter extraction
    this.actionPatterns = {
      // RIDE BOOKING
      ride_booking: {
        patterns: [
          /(?:order|book|get|call|request)\s+(?:me\s+)?(?:an?\s+)?(uber|lyft)/i,
          /(?:i need|get me)\s+a\s+ride/i,
          /take me to/i
        ],
        parameters: {
          destination: /(?:to|going to)\s+([^.,]+)/i,
          pickup: /(?:from|pick(?:up)? me up (?:at|from))\s+([^.,]+)/i,
          rideType: /(uber\s*x|uber\s*xl|lyft|lyft\s*xl|uber\s*black)/i
        },
        method: 'twilio', // Default: Twilio call
        requiresConfirmation: true,
        estimatedCost: 25 // Average ride cost
      },

      // CALENDAR
      calendar_event: {
        patterns: [
          /schedule\s+(?:a\s+)?(?:meeting|call|event)/i,
          /add\s+(?:to\s+)?(?:my\s+)?calendar/i,
          /book\s+(?:a\s+)?(?:meeting|call)/i,
          /set\s+up\s+(?:a\s+)?meeting/i
        ],
        parameters: {
          time: /(?:at|for)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
          date: /(?:on|for)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
          attendees: /with\s+([^.,]+?)(?:\s+(?:at|for|on)|$)/i,
          title: /(?:called|titled|named)\s+["']?([^"'.,]+)["']?/i
        },
        method: 'calendar_api',
        requiresConfirmation: true,
        estimatedCost: 0
      },

      // EMAIL
      email: {
        patterns: [
          /(?:send|write)\s+(?:an?\s+)?email/i,
          /email\s+(?:to\s+)?([^.,]+)/i,
          /compose\s+(?:an?\s+)?email/i
        ],
        parameters: {
          recipient: /(?:to|email)\s+([^.,]+?)(?:\s+(?:saying|about|that)|$)/i,
          subject: /(?:about|subject|regarding)\s+([^.,]+)/i,
          body: /(?:saying|that|message)\s+["']?([^"']+)["']?/i
        },
        method: 'gmail_api',
        requiresConfirmation: true,
        estimatedCost: 0
      },

      // SMS
      sms: {
        patterns: [
          /(?:text|message|sms)\s+([^.,]+)/i,
          /send\s+(?:a\s+)?(?:text|message)/i
        ],
        parameters: {
          recipient: /(?:text|message|sms)\s+([^.,]+?)(?:\s+(?:saying|that)|$)/i,
          message: /(?:saying|that|tell (?:them|her|him))\s+["']?([^"']+)["']?/i
        },
        method: 'twilio_sms',
        requiresConfirmation: true,
        estimatedCost: 0.0075 // Twilio SMS cost
      },

      // PHONE CALL
      phone_call: {
        patterns: [
          /(?:call|phone|dial)\s+([^.,]+)/i,
          /make\s+a\s+call\s+to/i
        ],
        parameters: {
          recipient: /(?:call|phone|dial)\s+([^.,]+)/i,
          phoneNumber: /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/
        },
        method: 'twilio_call',
        requiresConfirmation: true,
        estimatedCost: 0.04
      },

      // FOOD ORDER
      food_order: {
        patterns: [
          /order\s+(?:me\s+)?(?:some\s+)?food/i,
          /order\s+(?:from\s+)?(doordash|uber\s*eats|grubhub)/i,
          /(?:get|order)\s+(?:me\s+)?(?:pizza|chinese|thai|mexican|indian)/i
        ],
        parameters: {
          restaurant: /(?:from|order)\s+([^.,]+?)(?:\s+(?:for|on)|$)/i,
          items: /(?:get|order)\s+(?:me\s+)?([^.,]+)/i,
          service: /(doordash|uber\s*eats|grubhub)/i
        },
        method: 'puppeteer',
        requiresConfirmation: true,
        estimatedCost: 30
      },

      // RESTAURANT RESERVATION
      reservation: {
        patterns: [
          /(?:make|book)\s+(?:a\s+)?reservation/i,
          /reserve\s+(?:a\s+)?table/i,
          /book\s+(?:a\s+)?table\s+(?:at|for)/i
        ],
        parameters: {
          restaurant: /(?:at|for)\s+([^.,]+?)(?:\s+(?:for|at)|$)/i,
          time: /(?:at|for)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
          partySize: /for\s+(\d+)\s+(?:people|person)/i,
          date: /(?:on|for)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
        },
        method: 'puppeteer',
        requiresConfirmation: true,
        estimatedCost: 0
      },

      // FINANCIAL QUERY
      financial_query: {
        patterns: [
          /(?:what'?s|check|show)\s+(?:my\s+)?(?:account\s+)?balance/i,
          /how much\s+(?:money\s+)?(?:do i have|is in my account)/i,
          /show\s+(?:me\s+)?(?:my\s+)?(?:recent\s+)?transactions/i
        ],
        parameters: {
          accountType: /(checking|savings|credit\s*card)/i,
          timeframe: /(today|this week|this month|recent)/i
        },
        method: 'plaid_api',
        requiresConfirmation: false, // Read-only, no confirmation needed
        estimatedCost: 0
      }
    };

    // Wisdom keywords (conversation, not actions)
    this.wisdomKeywords = [
      /what do you think/i,
      /should i/i,
      /why (?:is|do|does)/i,
      /how (?:can|do|does)/i,
      /tell me about/i,
      /explain/i,
      /do you know/i,
      /what is/i,
      /who is/i,
      /can you help me (?:understand|with)/i
    ];
  }

  /**
   * MAIN CLASSIFICATION METHOD
   * Determines if command is ACTION or WISDOM
   */
  classify(voiceCommand, userContext = {}) {
    const command = voiceCommand.toLowerCase().trim();

    // Check if it's a wisdom/conversation query
    const isWisdom = this.wisdomKeywords.some(pattern => pattern.test(command));
    if (isWisdom) {
      return {
        category: 'wisdom',
        tier: this.classifyWisdomTier(command),
        routeToAI: true,
        confidence: 0.9
      };
    }

    // Check for action patterns
    for (const [actionType, config] of Object.entries(this.actionPatterns)) {
      const matchesPattern = config.patterns.some(pattern => pattern.test(command));

      if (matchesPattern) {
        const parameters = this.extractParameters(command, config.parameters);
        const enrichedParams = this.enrichParameters(parameters, actionType, userContext);

        return {
          category: 'butler_action',
          actionType,
          method: config.method,
          parameters: enrichedParams,
          requiresConfirmation: config.requiresConfirmation,
          estimatedCost: this.estimateCost(actionType, enrichedParams),
          confidence: 0.95,
          rawCommand: voiceCommand
        };
      }
    }

    // Default: route to AI for wisdom
    return {
      category: 'wisdom',
      tier: 'WISDOM_CASUAL',
      routeToAI: true,
      confidence: 0.5,
      note: 'No explicit action pattern matched'
    };
  }

  /**
   * EXTRACT PARAMETERS
   * Pull structured data from voice command
   */
  extractParameters(command, parameterPatterns) {
    const extracted = {};

    for (const [paramName, pattern] of Object.entries(parameterPatterns)) {
      const match = command.match(pattern);
      if (match && match[1]) {
        extracted[paramName] = match[1].trim();
      }
    }

    return extracted;
  }

  /**
   * ENRICH PARAMETERS
   * Add defaults and context
   */
  enrichParameters(parameters, actionType, userContext) {
    const enriched = { ...parameters };

    // Add user location if available
    if (!enriched.pickup && userContext.currentLocation) {
      enriched.pickup = userContext.currentLocation;
    }

    // Add default time (now) for calendar events
    if (actionType === 'calendar_event' && !enriched.time) {
      enriched.time = 'now';
    }

    // Add default date (today)
    if ((actionType === 'calendar_event' || actionType === 'reservation') && !enriched.date) {
      enriched.date = 'today';
    }

    // Add default ride type
    if (actionType === 'ride_booking' && !enriched.rideType) {
      enriched.rideType = 'UberX';
    }

    // Add default party size for reservations
    if (actionType === 'reservation' && !enriched.partySize) {
      enriched.partySize = '2';
    }

    return enriched;
  }

  /**
   * ESTIMATE COST
   * Calculate estimated cost for confirmation
   */
  estimateCost(actionType, parameters) {
    switch (actionType) {
      case 'ride_booking':
        // Estimate based on distance or default
        return 25; // Average Uber ride

      case 'food_order':
        return 30; // Average food delivery

      case 'phone_call':
        return 0.04; // Twilio call cost

      case 'sms':
        return 0.0075; // Twilio SMS cost

      default:
        return 0;
    }
  }

  /**
   * CLASSIFY WISDOM TIER
   * Determine if wisdom query is casual or deep
   */
  classifyWisdomTier(command) {
    const deepPatterns = [
      /why/i,
      /philosophy/i,
      /meaning/i,
      /purpose/i,
      /should i (?:quit|leave|break|stay)/i
    ];

    const isDeep = deepPatterns.some(pattern => pattern.test(command));
    return isDeep ? 'WISDOM_DEEP' : 'WISDOM_CASUAL';
  }

  /**
   * GENERATE CONFIRMATION MESSAGE
   * Create price transparency message
   */
  generateConfirmation(classification) {
    const { actionType, parameters, estimatedCost } = classification;

    switch (actionType) {
      case 'ride_booking':
        return `I found ${parameters.rideType || 'a ride'} to ${parameters.destination || 'your destination'}. The total price for this ride is $${estimatedCost}. Would you like me to continue?`;

      case 'calendar_event':
        return `I'll schedule a meeting ${parameters.time ? 'at ' + parameters.time : ''} ${parameters.date || 'today'}${parameters.attendees ? ' with ' + parameters.attendees : ''}. Should I proceed?`;

      case 'email':
        return `I'll send an email to ${parameters.recipient}${parameters.subject ? ' about ' + parameters.subject : ''}. Should I send it?`;

      case 'sms':
        return `I'll text ${parameters.recipient}: "${parameters.message}". Should I send it?`;

      case 'phone_call':
        return `I'll call ${parameters.recipient}. The call will cost $${estimatedCost}. Should I proceed?`;

      case 'food_order':
        return `I'll order ${parameters.items || 'food'}${parameters.restaurant ? ' from ' + parameters.restaurant : ''}. Estimated total: $${estimatedCost}. Should I place the order?`;

      case 'reservation':
        return `I'll make a reservation ${parameters.restaurant ? 'at ' + parameters.restaurant : ''} for ${parameters.partySize || '2'} people ${parameters.time ? 'at ' + parameters.time : ''}. Should I book it?`;

      default:
        return 'Should I proceed with this action?';
    }
  }
}

module.exports = new ActionClassifier();
