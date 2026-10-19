/**
 * Phoenix Butler Capability Manifest
 *
 * This is the SINGLE SOURCE OF TRUTH for everything Butler can do.
 * Claude reads this to understand capabilities and route ANY request.
 *
 * NO HARDCODING - Claude uses this manifest to handle infinite tasks.
 */

const CAPABILITY_MANIFEST = {
  version: '2.0',

  capabilities: {
    // ═══════════════════════════════════════════════════════════════
    // FOOD DELIVERY
    // ═══════════════════════════════════════════════════════════════
    food_delivery: {
      description: 'Order food from restaurants for delivery or pickup',
      triggers: ['food', 'hungry', 'eat', 'order', 'delivery', 'restaurant', 'pizza', 'chinese', 'sushi', 'burger', 'tacos', 'mexican', 'thai', 'indian', 'doordash', 'ubereats', 'uber eats', 'grubhub', 'postmates', 'instacart', 'breakfast', 'lunch', 'dinner', 'snack', 'takeout', 'carry out'],
      services: {
        doordash: {
          name: 'DoorDash',
          url: 'https://www.doordash.com/',
          searchUrl: 'https://www.doordash.com/search/store/{query}/',
          requiresAuth: true,
          sessionService: 'doordash'
        },
        ubereats: {
          name: 'Uber Eats',
          url: 'https://www.ubereats.com/',
          requiresAuth: true,
          sessionService: 'ubereats'
        },
        grubhub: {
          name: 'Grubhub',
          url: 'https://www.grubhub.com/',
          requiresAuth: true,
          sessionService: 'grubhub'
        }
      },
      defaultService: 'doordash',
      requiredInfo: ['delivery_address'],
      optionalInfo: ['food_type', 'restaurant', 'dietary_restrictions', 'budget'],
      steps: [
        'Navigate to food delivery service',
        'Set delivery address',
        'Search for food/restaurant if specified',
        'Show available options to user',
        'User selects items and confirms order'
      ]
    },

    // ═══════════════════════════════════════════════════════════════
    // RIDES & TRANSPORTATION
    // ═══════════════════════════════════════════════════════════════
    rides: {
      description: 'Book rides, taxis, or car services',
      triggers: ['uber', 'lyft', 'ride', 'taxi', 'cab', 'car', 'pickup', 'drop off', 'airport', 'drive me', 'take me', 'get me to', 'transportation'],
      services: {
        uber: {
          name: 'Uber',
          url: 'https://m.uber.com/',
          requiresAuth: true,
          sessionService: 'uber'
        },
        lyft: {
          name: 'Lyft',
          url: 'https://www.lyft.com/',
          requiresAuth: true,
          sessionService: 'lyft'
        }
      },
      defaultService: 'uber',
      requiredInfo: ['pickup_address', 'destination'],
      optionalInfo: ['ride_type', 'scheduled_time'],
      steps: [
        'Navigate to ride service',
        'Enter pickup location',
        'Enter destination',
        'Select ride type',
        'Confirm booking'
      ]
    },

    // ═══════════════════════════════════════════════════════════════
    // RESTAURANT RESERVATIONS
    // ═══════════════════════════════════════════════════════════════
    reservations: {
      description: 'Make restaurant reservations',
      triggers: ['reservation', 'reserve', 'book a table', 'opentable', 'resy', 'dining', 'dinner reservation', 'table for'],
      services: {
        opentable: {
          name: 'OpenTable',
          url: 'https://www.opentable.com/',
          searchUrl: 'https://www.opentable.com/s?term={restaurant}',
          requiresAuth: false,
          sessionService: 'opentable'
        },
        resy: {
          name: 'Resy',
          url: 'https://resy.com/',
          requiresAuth: true,
          sessionService: 'resy'
        }
      },
      defaultService: 'opentable',
      requiredInfo: ['restaurant_name', 'date', 'time', 'party_size'],
      optionalInfo: ['special_requests', 'occasion'],
      steps: [
        'Navigate to reservation service',
        'Search for restaurant',
        'Select date and time',
        'Enter party size',
        'Enter guest information',
        'Confirm reservation'
      ]
    },

    // ═══════════════════════════════════════════════════════════════
    // SHOPPING
    // ═══════════════════════════════════════════════════════════════
    shopping: {
      description: 'Shop online for products',
      triggers: ['buy', 'shop', 'amazon', 'walmart', 'target', 'purchase', 'order', 'find me', 'look for', 'search for', 'price', 'deal', 'sale'],
      services: {
        amazon: {
          name: 'Amazon',
          url: 'https://www.amazon.com/',
          searchUrl: 'https://www.amazon.com/s?k={query}',
          requiresAuth: true,
          sessionService: 'amazon'
        },
        walmart: {
          name: 'Walmart',
          url: 'https://www.walmart.com/',
          searchUrl: 'https://www.walmart.com/search?q={query}',
          requiresAuth: false,
          sessionService: 'walmart'
        },
        target: {
          name: 'Target',
          url: 'https://www.target.com/',
          searchUrl: 'https://www.target.com/s?searchTerm={query}',
          requiresAuth: false,
          sessionService: 'target'
        }
      },
      defaultService: 'amazon',
      requiredInfo: ['product_description'],
      optionalInfo: ['budget', 'brand', 'color', 'size'],
      steps: [
        'Navigate to shopping site',
        'Search for product',
        'Filter by criteria',
        'Show options to user',
        'Add to cart if confirmed'
      ]
    },

    // ═══════════════════════════════════════════════════════════════
    // COMMUNICATION - SMS
    // ═══════════════════════════════════════════════════════════════
    sms: {
      description: 'Send text messages',
      triggers: ['text', 'sms', 'message', 'send a text', 'text message'],
      endpoint: '/api/phoenix/butler/sms',
      method: 'POST',
      requiredInfo: ['phone_number', 'message_content'],
      usesAPI: true
    },

    // ═══════════════════════════════════════════════════════════════
    // COMMUNICATION - CALLS
    // ═══════════════════════════════════════════════════════════════
    phone_call: {
      description: 'Make phone calls',
      triggers: ['call', 'phone', 'dial', 'ring'],
      endpoint: '/api/phoenix/butler/call',
      method: 'POST',
      requiredInfo: ['phone_number'],
      optionalInfo: ['purpose', 'script'],
      usesAPI: true
    },

    // ═══════════════════════════════════════════════════════════════
    // COMMUNICATION - EMAIL
    // ═══════════════════════════════════════════════════════════════
    email: {
      description: 'Send or read emails',
      triggers: ['email', 'mail', 'send email', 'check email', 'inbox', 'gmail'],
      endpoints: {
        send: '/api/google/gmail/send',
        read: '/api/google/gmail/recent'
      },
      requiredInfo: ['recipient_email', 'subject', 'body'],
      requiresOAuth: 'google',
      usesAPI: true
    },

    // ═══════════════════════════════════════════════════════════════
    // CALENDAR
    // ═══════════════════════════════════════════════════════════════
    calendar: {
      description: 'Manage calendar events',
      triggers: ['calendar', 'schedule', 'meeting', 'appointment', 'event', 'remind me', 'add to calendar', 'whats on my calendar', 'schedule for'],
      endpoints: {
        create: '/api/earth/calendar/events',
        list: '/api/earth/calendar/events',
        update: '/api/earth/calendar/events/:id',
        delete: '/api/earth/calendar/events/:id'
      },
      requiredInfo: ['event_title', 'start_time'],
      optionalInfo: ['end_time', 'location', 'attendees', 'description'],
      requiresOAuth: 'google',
      usesAPI: true
    },

    // ═══════════════════════════════════════════════════════════════
    // TRAVEL - FLIGHTS
    // ═══════════════════════════════════════════════════════════════
    flights: {
      description: 'Search and book flights',
      triggers: ['flight', 'fly', 'plane', 'airline', 'book flight', 'airfare', 'travel to'],
      services: {
        google_flights: {
          name: 'Google Flights',
          url: 'https://www.google.com/travel/flights',
          requiresAuth: false
        },
        expedia: {
          name: 'Expedia',
          url: 'https://www.expedia.com/Flights',
          requiresAuth: true,
          sessionService: 'expedia'
        }
      },
      defaultService: 'google_flights',
      requiredInfo: ['origin', 'destination', 'departure_date'],
      optionalInfo: ['return_date', 'passengers', 'class']
    },

    // ═══════════════════════════════════════════════════════════════
    // TRAVEL - HOTELS
    // ═══════════════════════════════════════════════════════════════
    hotels: {
      description: 'Search and book hotels',
      triggers: ['hotel', 'stay', 'accommodation', 'book hotel', 'lodging', 'airbnb', 'booking'],
      services: {
        booking: {
          name: 'Booking.com',
          url: 'https://www.booking.com/',
          requiresAuth: true,
          sessionService: 'booking'
        },
        airbnb: {
          name: 'Airbnb',
          url: 'https://www.airbnb.com/',
          requiresAuth: true,
          sessionService: 'airbnb'
        },
        expedia: {
          name: 'Expedia',
          url: 'https://www.expedia.com/Hotels',
          requiresAuth: true,
          sessionService: 'expedia'
        }
      },
      defaultService: 'booking',
      requiredInfo: ['destination', 'check_in_date', 'check_out_date'],
      optionalInfo: ['guests', 'rooms', 'budget']
    },

    // ═══════════════════════════════════════════════════════════════
    // PAYMENTS
    // ═══════════════════════════════════════════════════════════════
    payments: {
      description: 'Send money or make payments',
      triggers: ['venmo', 'paypal', 'cashapp', 'cash app', 'send money', 'pay', 'transfer', 'zelle'],
      services: {
        venmo: {
          name: 'Venmo',
          url: 'https://venmo.com/',
          requiresAuth: true,
          sessionService: 'venmo'
        },
        paypal: {
          name: 'PayPal',
          url: 'https://www.paypal.com/',
          requiresAuth: true,
          sessionService: 'paypal'
        },
        cashapp: {
          name: 'Cash App',
          url: 'https://cash.app/',
          requiresAuth: true,
          sessionService: 'cashapp'
        }
      },
      requiredInfo: ['recipient', 'amount'],
      optionalInfo: ['note', 'payment_method'],
      riskLevel: 'high'
    },

    // ═══════════════════════════════════════════════════════════════
    // SOCIAL MEDIA
    // ═══════════════════════════════════════════════════════════════
    social_media: {
      description: 'Post to or check social media',
      triggers: ['twitter', 'x', 'instagram', 'facebook', 'linkedin', 'post', 'tweet', 'share'],
      services: {
        twitter: {
          name: 'Twitter/X',
          url: 'https://twitter.com/',
          requiresAuth: true,
          sessionService: 'twitter'
        },
        instagram: {
          name: 'Instagram',
          url: 'https://www.instagram.com/',
          requiresAuth: true,
          sessionService: 'instagram'
        },
        linkedin: {
          name: 'LinkedIn',
          url: 'https://www.linkedin.com/',
          requiresAuth: true,
          sessionService: 'linkedin'
        }
      },
      requiredInfo: ['content'],
      optionalInfo: ['media', 'hashtags']
    },

    // ═══════════════════════════════════════════════════════════════
    // RESEARCH & INFORMATION
    // ═══════════════════════════════════════════════════════════════
    research: {
      description: 'Search for information, compare options, find answers',
      triggers: ['search', 'find', 'look up', 'what is', 'how to', 'where is', 'when does', 'compare', 'research', 'info', 'information'],
      services: {
        google: {
          name: 'Google',
          url: 'https://www.google.com/',
          searchUrl: 'https://www.google.com/search?q={query}',
          requiresAuth: false
        }
      },
      defaultService: 'google',
      requiredInfo: ['query'],
      steps: [
        'Navigate to search engine',
        'Enter search query',
        'Analyze results',
        'Extract relevant information',
        'Present findings to user'
      ]
    },

    // ═══════════════════════════════════════════════════════════════
    // GROCERIES
    // ═══════════════════════════════════════════════════════════════
    groceries: {
      description: 'Order groceries for delivery',
      triggers: ['groceries', 'grocery', 'instacart', 'whole foods', 'supermarket', 'food shopping'],
      services: {
        instacart: {
          name: 'Instacart',
          url: 'https://www.instacart.com/',
          requiresAuth: true,
          sessionService: 'instacart'
        }
      },
      defaultService: 'instacart',
      requiredInfo: ['delivery_address'],
      optionalInfo: ['items', 'store_preference']
    },

    // ═══════════════════════════════════════════════════════════════
    // BANKING & FINANCE
    // ═══════════════════════════════════════════════════════════════
    banking: {
      description: 'Check balances, transactions, financial info',
      triggers: ['balance', 'bank', 'account', 'transactions', 'spent', 'money', 'financial'],
      endpoint: '/api/plaid',
      requiresPlaid: true,
      usesAPI: true
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // CONTEXT UNDERSTANDING
  // ═══════════════════════════════════════════════════════════════
  contextHints: {
    // Time-based hints
    morning: ['breakfast', 'coffee'],
    lunch: ['lunch'],
    evening: ['dinner', 'drinks'],
    late_night: ['late night food', 'bar'],

    // Location hints (if we have user location)
    at_home: ['delivery'],
    at_work: ['lunch delivery'],
    traveling: ['hotel', 'flight', 'car rental']
  },

  // ═══════════════════════════════════════════════════════════════
  // CONFIRMATION REQUIREMENTS
  // ═══════════════════════════════════════════════════════════════
  confirmationRequired: {
    always: ['payments', 'booking_confirmation', 'order_submission'],
    optional: ['navigation', 'search', 'information']
  }
};

/**
 * Get capability from task text using AI understanding
 * This is called by Claude to match ANY task to a capability
 */
function getCapabilityPrompt() {
  return `You are Phoenix Butler's routing system. Given the user's task, determine which capability to use.

AVAILABLE CAPABILITIES:
${JSON.stringify(CAPABILITY_MANIFEST.capabilities, null, 2)}

INSTRUCTIONS:
1. Analyze the user's intent
2. Match to the most appropriate capability
3. Identify which service to use (if multiple available)
4. List what information is still needed
5. Return a structured plan

RESPOND WITH JSON:
{
  "capability": "capability_key",
  "service": "service_key or null",
  "intent": "what user wants to accomplish",
  "hasAllInfo": boolean,
  "missingInfo": ["list", "of", "missing", "required", "fields"],
  "extractedInfo": { "field": "value" },
  "url": "starting URL for browser automation",
  "usesAPI": boolean,
  "steps": ["step1", "step2", ...]
}`;
}

module.exports = {
  CAPABILITY_MANIFEST,
  getCapabilityPrompt
};
