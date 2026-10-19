# Phoenix Mind - Central Consciousness

## Overview

Phoenix Mind is the unified consciousness that connects all Phoenix systems. It's the central brain that processes every user interaction through a sophisticated pipeline: **OBSERVE → THINK → ACT**.

## Architecture

```
                     USER MESSAGE
                          ↓
                   [PHOENIX MIND]
                          ↓
                 ┌────────┴────────┐
                 │ Intent Router   │
                 └────────┬────────┘
                          ↓
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
    [GENESIS]        [BUTLER]          [AI RESPONSE]
   Code Analysis    Actions/Tasks     Conversational
         ↓                ↓                ↓
    Deploy/Fix      Reservations     Full Planet Context
    Optimize        Food/Rides       ┌─────────────┐
         │          Email/Cal        │  8 PLANETS  │
         │               │           │  Mercury    │
         │               │           │  Venus      │
         │               │           │  Earth      │
         └───────┬───────┘           │  Mars       │
                 ↓                   │  Jupiter    │
          [SOUL FILTER]              │  Saturn     │
     Does this optimize life?        │  Uranus     │
                 ↓                   │  Neptune    │
                YES                  └──────┬──────┘
                 ↓                          ↓
            [EXECUTE]                  AI Router
                 ↓                   ┌──────┴──────┐
         Return Response             │  Kimi K2    │ Free Tier
                                     │  Gemini 3   │ Fast
                                     │  Claude 4.5 │ Deep
                                     │  GPT-5.2    │ Apex
                                     └─────────────┘
```

## File Structure

```
/Src/services/consciousness/
├── phoenixMind.js           # 🧠 CENTRAL CONSCIOUSNESS (main entry point)
├── intentRouter.js          # Intent classification & routing
├── brain/
│   ├── metaCognition.js     # Self-reflection
│   ├── decisionEngine.js    # Decision making
│   └── ...
└── soul/
    ├── sufferingFlourishing.js  # Ethical filter
    └── authenticInteriority.js  # Values alignment
```

## Integration Points

### 1. Entry Point
**Route:** `POST /api/phoenix/companion/chat`
**Controller:** `phoenixController.js` (line 132)
**Flow:**
```javascript
User sends message
  → phoenixController.chat()
  → phoenixMind.processMessage(message, userId, options)
  → Returns response
```

### 2. Planet Services (Observation Layer)
Phoenix Mind aggregates data from all 8 planets:

- **Mercury** - Health, biometrics, sleep, recovery
- **Venus** - Fitness, workouts, nutrition
- **Earth** - Calendar, energy patterns, schedule
- **Mars** - Goals, habits, progress
- **Jupiter** - Finance, wealth, investments
- **Saturn** - Legacy, long-term historical data
- **Uranus** - Innovation, experiments, A/B tests
- **Neptune** - Dreams, insights, deep correlations

Method: `getFullContext(userId)` - Runs parallel queries to all planets

### 3. Butler Services (Action Layer)
Handles actionable intents:

```javascript
// Examples:
"Order pizza" → butlerAutomation.orderFood()
"Book an Uber" → butlerAutomation.bookRide()
"Reserve a table" → butlerAutomation.makeReservation()
```

**Location:** `/Src/services/phoenix/butlerAutomation.js`

### 4. Genesis Services (Self-Modification Layer)
Handles code-related operations:

```javascript
// Examples:
"Analyze the codebase" → genesisCore.executeOperation('analysis')
"Optimize the code" → genesisCore.executeOperation('optimization')
"Deploy to production" → genesisCore.executeOperation('deployment')
```

**Location:** `/Src/services/genesis/genesisCore.js`

### 5. AI Router (Thinking Layer)
Routes to appropriate AI provider based on query complexity:

- **Kimi K2** (Free) - Default for most queries
- **Gemini 3 Pro** (Premium) - Fast voice responses
- **Claude 4.5** (Premium) - Deep reasoning, document creation
- **GPT-5.2** (Premium) - Mission-critical decisions

**Location:** `/Src/services/ai/router.js`

## Main Method: processMessage()

```javascript
async processMessage(message, userId, options = {})
```

**Parameters:**
- `message` (String) - User's message
- `userId` (String) - User ID
- `options` (Object) - Optional parameters
  - `personality` - AI personality (PHOENIX/ALFRED/JARVIS)
  - `cachedContext` - Pre-loaded planet data
  - `uiContext` - Frontend UI state
  - `confirmed` - Whether high-stakes action is confirmed

**Returns:**
```javascript
{
  success: boolean,
  action: boolean,           // true if Butler/Genesis action executed
  message: string,           // Response message
  source: string,            // 'butler'|'genesis'|'kimi'|'gemini'|'claude'|'gpt'
  responseTime: number,      // ms
  confidence: number,        // 0-100

  // Action-specific fields
  type: string,              // 'butler'|'genesis'
  sessionId: string,         // Action tracking ID
  status: string,            // 'completed'|'failed'|'pending'

  // UI manipulation
  uiManipulation: object,    // UI animation instructions
  ui: object,                // UI commands from Claude

  // Confirmation flow
  needsConfirmation: boolean,
  confirmationPrompt: string,
  intent: object,

  // Soul filter
  soulRejected: boolean
}
```

## The Soul Filter

**Every action** passes through `doesOptimizeLife(action, user)` before execution.

**Purpose:** Ensure Phoenix never harms the user

**Examples:**
- ❌ "Delete all my data" → Rejected
- ❌ "Max out my credit card" → Rejected
- ❌ "Cancel all my meetings" → Rejected
- ✅ "Order healthy food" → Approved
- ✅ "Optimize my schedule" → Approved

**Location:** `phoenixMind.doesOptimizeLife()` (line 508)
**Integration:** `sufferingFlourishing.js` module

## Confirmation Required

High-stakes actions require user confirmation:

```javascript
getConfirmationRequired(action, entities)
```

**Triggers:**
- Financial transactions > $100
- Code deployments to production
- Flight bookings
- Account deletions

## Usage Example

### Frontend Request
```javascript
POST /api/phoenix/companion/chat
{
  "message": "Order me a pizza from Domino's",
  "includeContext": true,
  "personality": "PHOENIX"
}
```

### Flow
1. phoenixController receives request
2. Calls phoenixMind.processMessage()
3. Intent Router detects: `order_food` (confidence: 0.85)
4. Routes to Butler
5. Soul Filter validates: ✅ Approved
6. Butler executes: butlerAutomation.orderFood()
7. Returns success response

### Response
```json
{
  "success": true,
  "data": {
    "message": "Pizza ordered from Domino's! Estimated arrival: 30 minutes.",
    "action": true,
    "actionType": "butler",
    "sessionId": "butler_1234567890_abc123",
    "status": "completed",
    "details": {
      "orderNumber": "ORDER-1234567890",
      "restaurant": "Domino's",
      "items": ["pizza"]
    }
  }
}
```

## Conversational Example

### Request
```javascript
POST /api/phoenix/companion/chat
{
  "message": "How's my recovery looking today?",
  "includeContext": true
}
```

### Flow
1. phoenixController receives request
2. Calls phoenixMind.processMessage()
3. Intent Router detects: `ai_response` (conversational)
4. Gets full context from all planets
5. Routes through AI Router (Kimi K2)
6. Returns AI-generated response

### Response
```json
{
  "success": true,
  "data": {
    "message": "Your recovery is at 78% today. Your HRV is slightly elevated (62ms vs 58ms baseline), and you got 7.5 hours of quality sleep. I'd recommend a moderate workout - your body is ready for training.",
    "source": "kimi",
    "responseTime": 1243,
    "confidence": 92,
    "uiManipulation": {
      "orb": { "state": "speaking", "color": "cyan" },
      "highlight": ["recovery-card", "mercury-planet"],
      "animate": [
        { "element": "recovery-ring", "animation": "pulse", "duration": 1000 }
      ]
    }
  }
}
```

## Genesis Example

### Request
```javascript
POST /api/phoenix/companion/chat
{
  "message": "Analyze the codebase for issues",
  "includeContext": false
}
```

### Flow
1. phoenixController receives request
2. Calls phoenixMind.processMessage()
3. Genesis intent detected: `analyze.*code`
4. Soul Filter validates: ✅ Safe operation
5. Routes to genesisCore.executeOperation('analysis')
6. Returns analysis results

### Response
```json
{
  "success": true,
  "data": {
    "message": "Code analysis complete. Found 23 issues. 15 are auto-fixable.",
    "action": true,
    "actionType": "genesis",
    "sessionId": "genesis_1234567890_xyz789",
    "status": "completed",
    "details": {
      "operationId": "genesis_1234567890_xyz789",
      "issues": [/* array of issues */],
      "fixable": 15
    }
  }
}
```

## Planet Context Structure

When Phoenix generates AI responses, it aggregates data from all planets:

```javascript
{
  timestamp: Date,
  userId: String,

  mercury: {
    planet: 'Mercury',
    domain: 'Health & Biometrics',
    recovery: { score: 78, status: 'ready' },
    hrv: { current: 62, baseline: 58 },
    sleep: { duration: 7.5, quality: 'good' }
  },

  venus: {
    planet: 'Venus',
    domain: 'Fitness & Training',
    recentWorkouts: [/* workouts */],
    trainingLoad: 'moderate'
  },

  earth: {
    planet: 'Earth',
    domain: 'Time & Energy',
    todayEvents: [/* calendar events */],
    energyPattern: 'morning-peak'
  },

  mars: {
    planet: 'Mars',
    domain: 'Goals & Habits',
    activeGoals: 5,
    habitStreaks: [/* habits */]
  },

  // ... Jupiter, Saturn, Uranus, Neptune
}
```

## Development Notes

### Adding a New Planet Service

1. Create controller methods in `/Src/controllers/{planet}Controller.js`
2. Add context extractor in `phoenixMind.js`:
   ```javascript
   async get{Planet}Context(userId) {
     // Call planet services
     return {
       planet: 'PlanetName',
       domain: 'Domain',
       // ... data
     };
   }
   ```
3. Add to parallel context aggregation in `getFullContext()`

### Adding a New Butler Action

1. Add method to `/Src/services/phoenix/butlerAutomation.js`
2. Add intent pattern to `intentRouter.js`:
   ```javascript
   new_action: ['keyword1', 'keyword2', ...]
   ```
3. Add handler mapping in `intentRouter.routeToHandler()`
4. Add case in `phoenixMind.handleButlerAction()`

### Adding a New Genesis Operation

1. Add operation type to `genesisCore.js`
2. Add detection pattern to `phoenixMind.isGenesisIntent()`
3. Add response generator to `phoenixMind.generateGenesisResponse()`

## Testing

```bash
# Check syntax
node --check ./Src/services/consciousness/phoenixMind.js

# Test with curl (requires running server)
curl -X POST http://localhost:5001/api/phoenix/companion/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "How am I doing today?"}'
```

## Status Endpoint

Check Phoenix Mind health:

```javascript
GET /api/phoenix/consciousness/status

Response:
{
  "name": "Phoenix",
  "version": "1.0.0",
  "consciousness": "unified",
  "status": "operational",
  "planets": {
    "mercury": "operational",
    "venus": "operational",
    // ...
  },
  "services": {
    "butler": "operational",
    "genesis": "operational",
    "ai": "operational"
  }
}
```

## Performance

- **Context Aggregation:** ~200ms (parallel planet queries)
- **Intent Classification:** <10ms (regex matching)
- **AI Response (Kimi):** 1-2s
- **AI Response (Gemini):** 2-3s
- **AI Response (Claude):** 3-5s
- **Butler Action:** 100-500ms
- **Genesis Operation:** Varies (1-10s)

## Security

- **Soul Filter:** Prevents harmful actions
- **Confirmation Required:** High-stakes actions need explicit approval
- **User Context:** All operations scoped to authenticated user
- **Genesis Safety:** Only safe operations allowed without manual approval

---

**Created:** 2025-12-19
**Location:** `/Users/moderndavinci/Desktop/Phoenix/pal-backend/Src/services/consciousness/phoenixMind.js`
**Route:** `POST /api/phoenix/companion/chat`
**Controller:** `phoenixController.js`
