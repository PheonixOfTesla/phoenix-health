/**
 * Intent Router - Classifies user messages and routes to appropriate handlers
 * Routes between AI responses and Butler actions based on intent detection
 */

const ACTIONABLE_INTENTS = {
  // Butler Actions
  order_food: ['order', 'hungry', 'food', 'doordash', 'pizza', 'dinner', 'lunch'],
  book_ride: ['uber', 'lyft', 'ride', 'car', 'pickup', 'take me'],
  reservation: ['reserve', 'table', 'restaurant', 'opentable', 'book'],
  email: ['email', 'gmail', 'inbox', 'send email', 'check mail', 'unsubscribe'],
  calendar: ['calendar', 'meeting', 'schedule', 'cancel meeting', 'reschedule', 'remind me at'],
  finance: ['pay', 'bill', 'transfer', 'venmo', 'send money', 'bank'],
  travel: ['flight', 'hotel', 'book flight', 'airbnb'],
  deploy: ['deploy', 'launch', 'publish', 'go live'],

  // Consciousness/Logging - NEW
  notes: ['note', 'notes', 'remember', 'remind me', 'save', 'write down', 'don\'t forget', 'log this'],

  // Health Tracking (Mercury) - NEW
  health: ['weight', 'weigh', 'sleep', 'slept', 'workout', 'exercise', 'calories', 'water', 'steps', 'walked', 'heart rate', 'hrv', 'recovery'],

  // Goals/Habits (Mars) - NEW
  goals: ['goal', 'set a goal', 'create a goal', 'new goal', 'habit', 'new habit', 'create a habit', 'milestone', 'progress', 'streak', 'completed goal', 'achieved'],

  // Content Generation - write/create documents, plans, drafts
  content: ['write', 'draft', 'compose', 'create a', 'make a', 'business plan', 'outline', 'essay', 'letter', 'email draft', 'proposal', 'report', 'summary', 'analysis'],

  // Genesis Creation - NEW
  genesis: ['create', 'build', 'make me', 'generate', 'widget', 'design', 'code']
};

// Common entity patterns for extraction
const ENTITY_PATTERNS = {
  restaurant: /(?:at|to|from)\s+([A-Z][a-zA-Z\s&']+(?:Restaurant|Cafe|Grill|Bar|Kitchen|Bistro)?)/i,
  address: /(?:to|at|from)\s+(\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln))/i,
  money: /\$(\d+(?:\.\d{2})?)/,
  email_address: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/,
  time: /(?:at|@)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/,
  date: /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2})/i,
  person: /(?:with|to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  location: /(?:to|from|at|near)\s+([A-Z][a-zA-Z\s]+(?:Airport|Station|Center|Mall)?)/
};

/**
 * Classifies user intent using keyword matching
 * @param {string} message - User message
 * @returns {Object} { action: string, confidence: number, entities: {} }
 */
function classifyIntent(message) {
  if (!message || typeof message !== 'string') {
    return { action: 'ai_response', confidence: 1.0, entities: {} };
  }

  const normalizedMessage = message.toLowerCase().trim();
  const words = normalizedMessage.split(/\s+/);

  let bestMatch = null;
  let highestScore = 0;
  let matchedKeywords = [];

  // Detect command mode - message starts with action verb
  const actionVerbs = ['order', 'book', 'reserve', 'send', 'pay', 'deploy', 'check', 'cancel', 'schedule'];
  const firstWord = words[0];
  const isCommandMode = actionVerbs.includes(firstWord);

  // Score each intent based on keyword matches
  for (const [intentName, keywords] of Object.entries(ACTIONABLE_INTENTS)) {
    let score = 0;
    let matched = [];

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();

      // Exact word match gets higher score
      if (words.includes(keywordLower)) {
        score += 2;
        matched.push(keyword);
      }
      // Partial match gets lower score
      else if (normalizedMessage.includes(keywordLower)) {
        score += 1;
        matched.push(keyword);
      }
    }

    // Boost score for action verbs at start of message (increased from 1.5 to 3.0)
    if (matched.length > 0 && isCommandMode) {
      score += 3.0;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = intentName;
      matchedKeywords = matched;
    }
  }

  // Apply command mode multiplier to total score
  let finalScore = highestScore;
  if (isCommandMode && bestMatch) {
    finalScore = highestScore * 1.5;
  }

  // Calculate confidence (normalize score to 0-1 range)
  const maxPossibleScore = 10; // Reasonable upper bound
  const confidence = Math.min(finalScore / maxPossibleScore, 1.0);

  // Threshold for actionable intent - must have decent confidence
  const CONFIDENCE_THRESHOLD = 0.15;

  if (confidence < CONFIDENCE_THRESHOLD || !bestMatch) {
    return {
      action: 'ai_response',
      confidence: 1.0 - confidence,
      entities: {}
    };
  }

  // Extract entities based on detected intent
  const entities = extractEntities(message, bestMatch);

  return {
    action: bestMatch,
    confidence: confidence,
    entities: entities,
    matchedKeywords: matchedKeywords
  };
}

/**
 * Extracts relevant entities from message based on intent type
 * @param {string} message - User message
 * @param {string} intentType - Detected intent type
 * @returns {Object} Extracted entities
 */
function extractEntities(message, intentType) {
  const entities = {};

  switch (intentType) {
    case 'order_food':
      // Extract restaurant, food items, address
      const restaurant = message.match(ENTITY_PATTERNS.restaurant);
      if (restaurant) entities.restaurant = restaurant[1].trim();

      const address = message.match(ENTITY_PATTERNS.address);
      if (address) entities.deliveryAddress = address[1].trim();

      // Extract food items (simple heuristic)
      const foodKeywords = ['pizza', 'burger', 'sushi', 'salad', 'pasta', 'chicken', 'sandwich'];
      const foodItems = foodKeywords.filter(food => message.toLowerCase().includes(food));
      if (foodItems.length > 0) entities.foodItems = foodItems;

      break;

    case 'book_ride':
      // Extract pickup/dropoff locations
      const locations = message.match(/(?:to|from)\s+([^,\.]+)/gi);
      if (locations) {
        entities.locations = locations.map(loc => loc.replace(/^(to|from)\s+/i, '').trim());
      }

      // Extract time
      const time = message.match(ENTITY_PATTERNS.time);
      if (time) entities.time = time[1].trim();

      // Detect service preference
      if (message.toLowerCase().includes('uber')) entities.service = 'uber';
      if (message.toLowerCase().includes('lyft')) entities.service = 'lyft';

      break;

    case 'reservation':
      // Extract restaurant
      const resRestaurant = message.match(ENTITY_PATTERNS.restaurant);
      if (resRestaurant) entities.restaurant = resRestaurant[1].trim();

      // Extract time and date
      const resTime = message.match(ENTITY_PATTERNS.time);
      if (resTime) entities.time = resTime[1].trim();

      const date = message.match(ENTITY_PATTERNS.date);
      if (date) entities.date = date[1].trim();

      // Extract party size
      const partySize = message.match(/(\d+)\s+(?:people|person|guests?)/i);
      if (partySize) entities.partySize = parseInt(partySize[1]);

      break;

    case 'email':
      // Extract email address
      const emailAddr = message.match(ENTITY_PATTERNS.email_address);
      if (emailAddr) entities.emailAddress = emailAddr[1];

      // Extract recipient name
      const recipient = message.match(/to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (recipient) entities.recipient = recipient[1].trim();

      // Detect action type
      if (message.toLowerCase().includes('send')) entities.action = 'send';
      if (message.toLowerCase().includes('check') || message.toLowerCase().includes('inbox')) {
        entities.action = 'check';
      }
      if (message.toLowerCase().includes('unsubscribe')) entities.action = 'unsubscribe';

      break;

    case 'calendar':
      // Extract meeting title (heuristic: text in quotes or after 'about'/'for')
      const title = message.match(/(?:about|for|titled?)\s+"([^"]+)"/i) ||
                   message.match(/(?:about|for|regarding)\s+([^,\.]+)/i);
      if (title) entities.meetingTitle = title[1].trim();

      // Extract time and date
      const calTime = message.match(ENTITY_PATTERNS.time);
      if (calTime) entities.time = calTime[1].trim();

      const calDate = message.match(ENTITY_PATTERNS.date);
      if (calDate) entities.date = calDate[1].trim();

      // Extract attendees
      const person = message.match(ENTITY_PATTERNS.person);
      if (person) entities.attendees = [person[1].trim()];

      // Detect action
      if (message.toLowerCase().includes('cancel')) entities.action = 'cancel';
      if (message.toLowerCase().includes('reschedule')) entities.action = 'reschedule';
      if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('book')) {
        entities.action = 'create';
      }

      break;

    case 'finance':
      // Extract amount
      const amount = message.match(ENTITY_PATTERNS.money);
      if (amount) entities.amount = parseFloat(amount[1]);

      // Extract recipient
      const finRecipient = message.match(/(?:to|pay)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (finRecipient) entities.recipient = finRecipient[1].trim();

      // Detect service
      if (message.toLowerCase().includes('venmo')) entities.service = 'venmo';
      if (message.toLowerCase().includes('bill')) entities.type = 'bill_payment';
      if (message.toLowerCase().includes('transfer')) entities.type = 'transfer';

      break;

    case 'travel':
      // Extract origin and destination
      const travelLocations = message.match(/(?:from|to)\s+([A-Z][a-zA-Z\s]+)/gi);
      if (travelLocations && travelLocations.length >= 2) {
        entities.origin = travelLocations[0].replace(/^from\s+/i, '').trim();
        entities.destination = travelLocations[1].replace(/^to\s+/i, '').trim();
      } else if (travelLocations && travelLocations.length === 1) {
        entities.destination = travelLocations[0].replace(/^(from|to)\s+/i, '').trim();
      }

      // Extract date
      const travelDate = message.match(ENTITY_PATTERNS.date);
      if (travelDate) entities.date = travelDate[1].trim();

      // Detect type
      if (message.toLowerCase().includes('flight')) entities.type = 'flight';
      if (message.toLowerCase().includes('hotel') || message.toLowerCase().includes('airbnb')) {
        entities.type = 'accommodation';
      }

      break;

    case 'deploy':
      // Extract project/service name
      const project = message.match(/deploy\s+([a-zA-Z0-9-_]+)/i);
      if (project) entities.project = project[1].trim();

      // Extract environment
      if (message.toLowerCase().includes('production') || message.toLowerCase().includes('prod')) {
        entities.environment = 'production';
      } else if (message.toLowerCase().includes('staging')) {
        entities.environment = 'staging';
      }

      break;

    case 'notes':
      // Determine action type
      if (message.match(/show|list|all|my|read|get|what are/i)) {
        entities.action = 'list';
      } else if (message.match(/delete|remove|clear/i)) {
        entities.action = 'delete';
      } else {
        entities.action = 'create';
      }

      // Extract note content (everything after key phrase)
      const noteContent = message.match(/(?:remember|note|save|write down|log|remind me)[:\s]+(.+)/i);
      if (noteContent) entities.content = noteContent[1].trim();
      else if (entities.action === 'create') {
        // If no prefix found, use whole message as content
        entities.content = message.replace(/^(remember|note|save|write down|log)\s*/i, '').trim();
      }

      break;

    case 'health':
      // Extract weight
      const weight = message.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg)/i);
      if (weight) {
        entities.type = 'weight';
        entities.value = parseFloat(weight[1]);
        entities.unit = message.toLowerCase().includes('kg') ? 'kg' : 'lbs';
      }

      // Extract sleep duration
      const sleep = message.match(/(?:slept|sleep)\s*(?:for\s*)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
      if (sleep) {
        entities.type = 'sleep';
        entities.value = parseFloat(sleep[1]);
      }

      // Extract calories
      const calories = message.match(/(\d+)\s*(?:calories|cals?|kcal)/i);
      if (calories) {
        entities.type = 'calories';
        entities.value = parseInt(calories[1]);
      }

      // Extract water
      const water = message.match(/(\d+)\s*(?:glasses?|cups?|oz|ounces?)\s*(?:of\s*)?water/i);
      if (water) {
        entities.type = 'water';
        entities.value = parseInt(water[1]);
      }

      // Extract steps
      const steps = message.match(/(\d+)\s*steps/i);
      if (steps) {
        entities.type = 'steps';
        entities.value = parseInt(steps[1]);
      }

      break;

    case 'goals':
      // Determine action
      if (message.match(/new|create|add|set/i)) {
        entities.action = 'create';
      } else if (message.match(/complet|done|finish|achiev/i)) {
        entities.action = 'complete';
      } else if (message.match(/progress|update/i)) {
        entities.action = 'update';
      } else {
        entities.action = 'list';
      }

      // Extract goal/habit name - multiple patterns
      // Pattern 1: "goal: exercise daily" or "goal to exercise daily"
      let goalName = message.match(/(?:goal|habit)[:\s]+(?:to\s+)?["']?([^"']+)["']?/i);
      if (goalName) {
        entities.name = goalName[1].trim();
      } else {
        // Pattern 2: "set a goal to exercise daily" -> extract after "goal to"
        goalName = message.match(/goal\s+to\s+(.+)/i);
        if (goalName) entities.name = goalName[1].trim();
      }

      // Pattern 3: If still no name, try "create a habit of X"
      if (!entities.name) {
        goalName = message.match(/(?:create|set|add)\s+(?:a\s+)?(?:new\s+)?(?:goal|habit)\s+(?:of\s+|to\s+)?(.+)/i);
        if (goalName) entities.name = goalName[1].trim();
      }

      break;

    case 'content':
      // Extract content type
      const contentTypes = {
        'business plan': 'business_plan',
        'plan': 'plan',
        'letter': 'letter',
        'email': 'email',
        'proposal': 'proposal',
        'report': 'report',
        'summary': 'summary',
        'analysis': 'analysis',
        'essay': 'essay',
        'outline': 'outline',
        'draft': 'draft',
        'document': 'document'
      };

      // Find content type
      for (const [keyword, type] of Object.entries(contentTypes)) {
        if (message.toLowerCase().includes(keyword)) {
          entities.contentType = type;
          break;
        }
      }

      // Extract topic/subject - multiple patterns
      // Pattern 1: "write a letter about X" or "draft a report on X"
      let topic = message.match(/(?:about|on|regarding|for|of)\s+(.+)/i);
      if (topic) {
        entities.topic = topic[1].trim();
      } else {
        // Pattern 2: "write [content type] [topic]" - extract everything after content type
        const afterContentType = message.match(/(?:write|draft|compose|create|make)\s+(?:a\s+|an\s+)?(?:\w+\s+)?(.+)/i);
        if (afterContentType) {
          entities.topic = afterContentType[1].trim();
        }
      }

      entities.action = 'generate';
      break;

    case 'genesis':
      // Genesis always creates - extract what to create
      const createWhat = message.match(/(?:create|build|make|generate)\s+(?:a\s+|an\s+|me\s+)?(.+)/i);
      if (createWhat) entities.description = createWhat[1].trim();
      entities.action = 'create';

      break;
  }

  return entities;
}

/**
 * Routes intent to appropriate Butler handler method
 * @param {Object} intent - Classified intent from classifyIntent()
 * @param {string} userId - User ID for context
 * @returns {Object} { handlerType: string, method: string, params: {} }
 */
function routeToHandler(intent, userId) {
  const { action, confidence, entities } = intent;

  // If not actionable or low confidence, route to AI
  if (action === 'ai_response' || confidence < 0.15) {
    return {
      handlerType: 'ai',
      method: 'generateResponse',
      params: { userId }
    };
  }

  // Map intents to Butler methods
  const handlerMap = {
    order_food: {
      handlerType: 'butler',
      method: 'orderFood',
      params: {
        userId,
        restaurant: entities.restaurant,
        items: entities.foodItems,
        deliveryAddress: entities.deliveryAddress
      }
    },
    book_ride: {
      handlerType: 'butler',
      method: 'bookRide',
      params: {
        userId,
        service: entities.service || 'uber',
        locations: entities.locations,
        time: entities.time
      }
    },
    reservation: {
      handlerType: 'butler',
      method: 'makeReservation',
      params: {
        userId,
        restaurant: entities.restaurant,
        date: entities.date,
        time: entities.time,
        partySize: entities.partySize
      }
    },
    email: {
      handlerType: 'butler',
      method: 'handleEmail',
      params: {
        userId,
        action: entities.action || 'check',
        recipient: entities.recipient,
        emailAddress: entities.emailAddress
      }
    },
    calendar: {
      handlerType: 'butler',
      method: 'manageCalendar',
      params: {
        userId,
        action: entities.action || 'create',
        title: entities.meetingTitle,
        date: entities.date,
        time: entities.time,
        attendees: entities.attendees
      }
    },
    finance: {
      handlerType: 'butler',
      method: 'handleFinance',
      params: {
        userId,
        type: entities.type || 'payment',
        amount: entities.amount,
        recipient: entities.recipient,
        service: entities.service
      }
    },
    travel: {
      handlerType: 'butler',
      method: 'bookTravel',
      params: {
        userId,
        type: entities.type || 'flight',
        origin: entities.origin,
        destination: entities.destination,
        date: entities.date
      }
    },
    deploy: {
      handlerType: 'butler',
      method: 'deployProject',
      params: {
        userId,
        project: entities.project,
        environment: entities.environment || 'production'
      }
    },

    // NEW: Consciousness/Logging handlers
    notes: {
      handlerType: 'consciousness',
      method: 'handleNotes',
      params: {
        userId,
        action: entities.action || 'create',
        content: entities.content
      }
    },
    health: {
      handlerType: 'consciousness',
      method: 'handleHealth',
      params: {
        userId,
        type: entities.type,
        value: entities.value,
        unit: entities.unit
      }
    },
    goals: {
      handlerType: 'consciousness',
      method: 'handleGoals',
      params: {
        userId,
        action: entities.action || 'list',
        name: entities.name
      }
    },
    content: {
      handlerType: 'consciousness',
      method: 'handleContent',
      params: {
        userId,
        action: entities.action || 'generate',
        contentType: entities.contentType,
        topic: entities.topic
      }
    },
    genesis: {
      handlerType: 'genesis',
      method: 'create',
      params: {
        userId,
        description: entities.description
      }
    }
  };

  return handlerMap[action] || {
    handlerType: 'ai',
    method: 'generateResponse',
    params: { userId }
  };
}

module.exports = {
  ACTIONABLE_INTENTS,
  classifyIntent,
  extractEntities,
  routeToHandler
};
