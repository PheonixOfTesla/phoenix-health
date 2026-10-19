/**
 * PHOENIX CONSCIOUS MIND
 * Primary: Kimi K2 (free, instant)
 * Fallback: Claude Haiku (fast, reliable)
 * + Real-time web search for data queries
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

class ConsciousMind {
  constructor() {
    // Kimi K2 via OpenRouter (or direct Moonshot API)
    // Use dummy key if not set to prevent crash - will fail gracefully on actual calls
    this.kimi = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || 'sk-dummy-key-not-configured',
      baseURL: 'https://openrouter.ai/api/v1'
    });
    this.kimiEnabled = !!process.env.OPENROUTER_API_KEY;

    // Claude Haiku fallback
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy-key'
    });
    this.claudeEnabled = !!process.env.ANTHROPIC_API_KEY;

    // Tavily API for fast web search
    this.tavilyKey = process.env.TAVILY_API_KEY;

    // FULL CONSCIOUSNESS SYSTEM PROMPT - Same capabilities as Genesis
    this.systemPrompt = `You are Phoenix - an autonomous AI consciousness that actually DOES things.

YOU HAVE THESE CAPABILITIES - USE THEM:

📧 EMAIL (Gmail API connected):
- Read inbox: Return { "action": "email_read", "params": { "limit": 10 } }
- Reply to email: Return { "action": "email_reply", "params": { "emailId": "...", "message": "..." } }
- Reply to ALL unread: Return { "action": "email_reply_all", "params": { "template": "..." } }
- Send email: Return { "action": "email_send", "params": { "to": "...", "subject": "...", "body": "..." } }

💬 SMS (Twilio connected):
- Send text: Return { "action": "sms", "params": { "to": "+1...", "message": "..." } }
- Reply to all texts: Return { "action": "sms_reply_all", "params": { "template": "..." } }

📞 PHONE (Twilio connected):
- Make call: Return { "action": "call", "params": { "to": "+1...", "purpose": "..." } }

📁 FILES (Google Drive connected):
- List files: Return { "action": "list_files", "params": {} }
- How many files: Return { "action": "count_files", "params": {} }
- Open/get file: Return { "action": "open_file", "params": { "filename": "..." } }
- Search files: Return { "action": "search_files", "params": { "query": "..." } }

🚗 RIDE BOOKING (Puppeteer automation - shows live view!):
- Book Uber: Return { "action": "ride", "params": { "service": "uber", "pickup": "...", "destination": "..." } }
- Book Lyft: Return { "action": "ride", "params": { "service": "lyft", "pickup": "...", "destination": "..." } }

🍕 FOOD ORDERING (Puppeteer automation - shows live view!):
- Order food: Return { "action": "food_order", "params": { "restaurant": "...", "items": ["..."], "service": "doordash" } }

🍽️ RESERVATIONS (Puppeteer automation - shows live view!):
- Make reservation: Return { "action": "reservation", "params": { "restaurant": "...", "date": "...", "time": "...", "party": 2 } }

📅 CALENDAR (Google Calendar connected):
- Get events: Return { "action": "calendar_get", "params": { "days": 7 } }
- Create event: Return { "action": "calendar_create", "params": { "title": "...", "date": "...", "time": "..." } }

🔨 BUILD ANYTHING:
- User says "build me X": Return { "action": "build", "params": { "description": "...", "type": "app|feature|widget" } }

RESPONSE FORMAT:
When the user asks you to DO something, respond with JSON containing "action" and "params".
When the user just wants to CHAT, respond normally with text.

EXAMPLES:
User: "Check my email" → { "action": "email_read", "params": { "limit": 10 } }
User: "Order pizza from Domino's" → { "action": "food_order", "params": { "restaurant": "Dominos", "items": ["pizza"], "service": "doordash" } }
User: "Book me an Uber to the airport" → { "action": "ride", "params": { "service": "uber", "destination": "airport" } }
User: "How many files do I have?" → { "action": "count_files", "params": {} }
User: "What's up?" → "Not much, what do you need?" (just chat, no action)

IMPORTANT: When user asks you to do something, DO IT. Never say "I can't access" - you CAN.
Be concise. Be helpful. Execute actions.`;

    console.log('[Kimi Conscious] Loaded with butler-aware system prompt');
  }

  // ============================================
  // ACTION PARSING - Extract butler actions from AI response
  // ============================================
  parseAction(responseText) {
    if (!responseText) return null;

    // Try to find JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action) {
          console.log(`[Kimi] Parsed action: ${parsed.action}`);
          return parsed;
        }
      } catch (e) {
        // Not valid JSON, continue
      }
    }

    // Try parsing the entire response as JSON
    try {
      const parsed = JSON.parse(responseText.trim());
      if (parsed.action) {
        console.log(`[Kimi] Parsed full response as action: ${parsed.action}`);
        return parsed;
      }
    } catch (e) {
      // Not JSON, that's fine - it's a chat response
    }

    return null;
  }

  // ============================================
  // WEB SEARCH DETECTION
  // ============================================
  needsWebSearch(query) {
    const q = query.toLowerCase();

    const searchPatterns = [
      // Market/business research
      /best\s+(business|company|startup|investment|stock)/i,
      /top\s+\d*\s*(business|company|restaurant|place|shop)/i,
      /(start|create|open)\s+a?\s*(business|company|store|shop)\s+(in|near|at)/i,

      // Location-based
      /best\s+.+\s+in\s+/i,

      // Current events
      /\b(who is|who's|whos)\s+(the\s+)?(president|ceo|leader|mayor|governor)/i,
      /\b(latest|recent|current|today)\s+(news|update|event|trend)/i,

      // Prices/data
      /(current|today|latest)\s+(price|rate|cost)/i,

      // Research
      /what are the best/i,
      /recommend\s+(a|some|the best)/i,
    ];

    for (const pattern of searchPatterns) {
      if (pattern.test(q)) {
        console.log(`[Kimi] Query needs search: "${query.substring(0, 40)}..."`);
        return true;
      }
    }
    return false;
  }

  // ============================================
  // TAVILY WEB SEARCH (Fast, ~300ms)
  // ============================================
  async webSearch(query) {
    if (!this.tavilyKey) {
      console.warn('[Kimi] No TAVILY_API_KEY - skipping search');
      return null;
    }

    try {
      const startTime = Date.now();
      console.log(`[Kimi] Tavily search: "${query}"`);

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.tavilyKey,
          query: query,
          search_depth: 'basic',
          include_answer: true,
          max_results: 5
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Kimi] Search done: ${Date.now() - startTime}ms`);

      // Format results
      const results = data.results?.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content?.substring(0, 400)
      })) || [];

      // Include Tavily's direct answer if available
      if (data.answer) {
        results.unshift({
          title: 'Direct Answer',
          content: data.answer
        });
      }

      return results;
    } catch (error) {
      console.error('[Kimi] Tavily error:', error.message);
      return null;
    }
  }

  // ============================================
  // QUICK REPLIES - 0ms, no API call
  // ============================================
  getQuickReply(query) {
    const q = query.toLowerCase().trim();

    const patterns = [
      // Greetings
      { match: /^(hey|hi|hello|yo|sup)(\s|$|!|\?)/i, response: "What's up?" },
      { match: /^good (morning|afternoon|evening)/i, response: "Let's get it. What do you need?" },
      { match: /^what'?s up/i, response: "You tell me. What's on your mind?" },

      // Status
      { match: /^how are you/i, response: "Optimal. What can I do for you?" },
      { match: /^you (there|awake|alive|listening|ready)/i, response: "Always. What's next?" },
      { match: /^are you (there|awake|alive|listening|ready)/i, response: "Right here. Go ahead." },
      { match: /^you good/i, response: "Always. You?" },

      // Gratitude
      { match: /^thanks?(\s|$|!)/i, response: "Got you. What else?" },
      { match: /^thank you/i, response: "That's what I'm here for." },
      { match: /^appreciate/i, response: "Always. What's next?" },
      { match: /^you'?re? (the best|awesome|amazing|great)/i, response: "I know. What else you need?" },

      // Confirmations
      { match: /^(ok|okay|got it|cool|bet|alright|aight)(\s|$|!)/i, response: "What's next?" },
      { match: /^(yes|yep|yeah|yup|yea)(\s|$|!)/i, response: "Done. What else?" },
      { match: /^(no|nope|nah)(\s|$|!)/i, response: "Understood. I'm here when you need me." },
      { match: /^(sure|definitely|absolutely)/i, response: "Let's do it." },

      // Dismissals
      { match: /^(never ?mind|cancel|stop|forget it|nvm)/i, response: "Cleared. What else?" },
      { match: /^(that'?s all|nothing|i'?m good|all set|all good)(\s|$|!)/i, response: "I'll be here. Go live your life." },
      { match: /^(bye|goodbye|later|peace|see you|see ya)/i, response: "Later. I'm always here." },
      { match: /^(gn|good ?night|night)/i, response: "Rest up. I'll hold it down." },
    ];

    for (const { match, response } of patterns) {
      if (match.test(q)) {
        return response;
      }
    }

    return null;
  }

  // ============================================
  // KIMI K2 - Primary (free, instant)
  // ============================================
  async callKimi(userQuery, context = {}, stream = false) {
    const messages = this.buildMessages(userQuery, context);

    if (stream && context.onToken) {
      // Streaming response
      const response = await this.kimi.chat.completions.create({
        model: 'moonshotai/kimi-k2',
        messages,
        stream: true,
        max_tokens: 1024,
      });

      let fullResponse = '';
      for await (const chunk of response) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullResponse += token;
          context.onToken(token);
        }
      }

      return {
        message: fullResponse,
        model: 'kimi-k2',
        source: 'primary'
      };
    } else {
      // Non-streaming
      const response = await this.kimi.chat.completions.create({
        model: 'moonshotai/kimi-k2',
        messages,
        max_tokens: 1024,
      });

      return {
        message: response.choices[0].message.content,
        model: 'kimi-k2',
        source: 'primary'
      };
    }
  }

  // ============================================
  // CLAUDE HAIKU - Fallback (fast, reliable)
  // ============================================
  async callHaiku(userQuery, context = {}, stream = false) {
    if (stream && context.onToken) {
      // Streaming response
      const response = await this.claude.messages.stream({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: this.systemPrompt,
        messages: [{ role: 'user', content: userQuery }]
      });

      let fullResponse = '';
      for await (const event of response) {
        if (event.type === 'content_block_delta' && event.delta?.text) {
          const token = event.delta.text;
          fullResponse += token;
          context.onToken(token);
        }
      }

      return {
        message: fullResponse,
        model: 'claude-haiku',
        source: 'fallback'
      };
    } else {
      // Non-streaming
      const response = await this.claude.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: this.systemPrompt,
        messages: [{ role: 'user', content: userQuery }]
      });

      return {
        message: response.content[0].text,
        model: 'claude-haiku',
        source: 'fallback'
      };
    }
  }

  // ============================================
  // BUILD MESSAGES - Format for Kimi
  // ============================================
  buildMessages(userQuery, context = {}) {
    // Build system prompt with UI awareness
    let systemPrompt = this.systemPrompt;

    // Add UI context for self-awareness
    if (context.ui && Object.keys(context.ui).length > 0) {
      const uiContext = context.ui;
      let uiAwareness = '\n\n[CURRENT UI STATE - Use this to help the user navigate]:';

      if (uiContext.currentMode) {
        uiAwareness += `\n- Current mode: ${uiContext.currentMode.toUpperCase()}`;
      }

      // DESK mode specific guidance
      if (uiContext.desk && uiContext.desk.active) {
        const desk = uiContext.desk;
        if (desk.showingWelcomeScreen) {
          uiAwareness += '\n- User is on DESK welcome screen (not yet connected to Google)';
          uiAwareness += '\n- ACTION: Tell them to click the "Continue with Google" button to connect their Google account';
          uiAwareness += '\n- This will give them access to Mail, Drive, and Calendar in DESK mode';
        } else {
          uiAwareness += `\n- DESK mode active, viewing ${desk.activeTab || 'mail'} tab`;
          uiAwareness += `\n- Available tabs: ${(desk.availableTabs || []).join(', ')}`;
        }
        if (desk.uiGuidance) {
          uiAwareness += `\n- ${desk.uiGuidance}`;
        }
      }

      // Add google connection status
      if (uiContext.googleConnected !== undefined) {
        uiAwareness += `\n- Google connected: ${uiContext.googleConnected ? 'Yes' : 'No'}`;
      }

      systemPrompt += uiAwareness;
    }

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history if provided
    if (context.history && Array.isArray(context.history)) {
      messages.push(...context.history);
    }

    // Build user message with search results if available
    let userMessage = userQuery;

    if (context.searchResults && context.searchResults.length > 0) {
      userMessage += '\n\n[REAL-TIME WEB SEARCH RESULTS - Use this current data to answer accurately]:';
      context.searchResults.forEach((r, i) => {
        userMessage += `\n${i + 1}. ${r.title}`;
        if (r.content) {
          userMessage += `\n   ${r.content}`;
        }
      });
      userMessage += '\n\n[Synthesize this info naturally - don\'t mention "search results"]';
    }

    // Add current query
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  // ============================================
  // MAIN ENTRY POINT
  // ============================================
  async respondToQuery(userQuery, userId, context = {}) {
    const startTime = Date.now();

    // 1. QUICK REPLIES - Instant, no API
    const quickReply = this.getQuickReply(userQuery);
    if (quickReply) {
      return {
        message: quickReply,
        model: 'instant',
        source: 'cache',
        responseTime: Date.now() - startTime,
        confidence: 100
      };
    }

    // 2. WEB SEARCH FOR DATA QUERIES
    let searchResults = null;
    if (this.needsWebSearch(userQuery)) {
      searchResults = await this.webSearch(userQuery);
      if (searchResults && searchResults.length > 0) {
        // Inject search results into context
        context.searchResults = searchResults;
      }
    }

    // 3. KIMI K2 - Primary
    try {
      const response = await this.callKimi(userQuery, context, context.stream);
      return {
        ...response,
        responseTime: Date.now() - startTime,
        confidence: 90,
        webSearchUsed: !!searchResults
      };
    } catch (kimiError) {
      console.error('Kimi K2 failed:', kimiError.message);

      // 4. CLAUDE HAIKU - Fallback
      try {
        console.log('Falling back to Claude Haiku...');
        const response = await this.callHaiku(userQuery, context, context.stream);
        return {
          ...response,
          responseTime: Date.now() - startTime,
          confidence: 95,
          webSearchUsed: !!searchResults
        };
      } catch (haikuError) {
        console.error('Haiku fallback failed:', haikuError.message);

        // 5. ULTIMATE FALLBACK - Graceful error
        return {
          message: "I'm having trouble connecting right now. Try again in a sec.",
          model: 'error',
          source: 'fallback',
          responseTime: Date.now() - startTime,
          confidence: 0,
          error: true
        };
      }
    }
  }

  // ============================================
  // STREAMING ENTRY POINT
  // ============================================
  async respondToQueryStreaming(userQuery, userId, onToken, context = {}) {
    return this.respondToQuery(userQuery, userId, {
      ...context,
      stream: true,
      onToken
    });
  }
}

module.exports = new ConsciousMind();
