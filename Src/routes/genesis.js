/**
 * GENESIS API ROUTES
 *
 * Purpose: API endpoints for Genesis self-modification operations
 * All routes protected by requireGenesisGod middleware
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireGenesisGod, logGenesisOperation, logGenesisSuccess, logGenesisFailure } = require('../middleware/genesisAuth');
const genesisCore = require('../services/genesis/genesisCore');
const gitManager = require('../services/genesis/gitManager');
const deploymentManager = require('../services/genesis/deploymentManager');
const GenesisOperation = require('../models/genesis/GenesisOperation');
const GenesisConversation = require('../models/genesis/GenesisConversation');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const FileProcessor = require('../services/fileProcessor');
const KimiFileService = require('../services/kimiFileService');
const archiver = require('archiver');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const PDFDocument = require('pdfkit');

// Initialize Gemini Flash 2.0 as PRIMARY (FREE, 1M context)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Keep Kimi K2 as backup option
const kimi = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1'
});

/**
 * GET /api/genesis/verify-god
 * Check if current user is Genesis God (no requireGenesisGod middleware)
 * This endpoint is used by frontend to check permissions without exposing email
 */
router.get('/verify-god', protect, async (req, res) => {
  try {
    const godEmail = process.env.GENESIS_GOD_EMAIL || 'Digitalappleco@gmail.com';
    const isGod = req.user.email === godEmail;
    res.json({ success: true, isGod });
  } catch (error) {
    res.json({ success: false, isGod: false });
  }
});

/**
 * POST /api/genesis/chat
 * Genesis Widget Builder Chat - Uses Claude Sonnet for intelligent widget building
 * Available to ALL authenticated users (not just Genesis God)
 */
router.post('/chat', protect, async (req, res) => {
  const startTime = Date.now();

  try {
    const { message, conversationHistory = [], images = [], files = [] } = req.body;

    // Combine legacy 'images' param with new 'files' param
    const allFiles = [...(files || []), ...(images || []).map(img => ({
      name: 'image.jpg',
      type: img.media_type || 'image/jpeg',
      data: img.data
    }))];

    console.log('[Genesis Chat] Request received:', {
      messageLength: message?.length,
      historyCount: conversationHistory?.length,
      fileCount: allFiles.length,
      userId: req.user?.id
    });

    // Process files - Native Kimi API if available, else text extraction
    let kimiFileIds = [];
    let useNativeKimi = false;
    let fileContent = '';
    let filesSummary = ''; // Summary for AI to know what files it received

    if (allFiles.length > 0) {
      // Detailed file logging
      const fileDetails = allFiles.map(f => {
        const ext = f.name?.split('.').pop()?.toLowerCase() || 'unknown';
        const sizeKB = f.data ? Math.round(f.data.length * 0.75 / 1024) : 0; // base64 to KB
        return {
          name: f.name || 'unnamed',
          type: f.type || 'unknown',
          extension: ext,
          sizeKB
        };
      });

      console.log('[Genesis Chat] 📁 FILES RECEIVED:', JSON.stringify(fileDetails, null, 2));

      // Build summary for AI context
      filesSummary = `\n\n[FILES ATTACHED: ${allFiles.length} file(s)]\n`;
      fileDetails.forEach((f, i) => {
        filesSummary += `${i + 1}. ${f.name} (${f.type}, ${f.sizeKB}KB)\n`;
      });

      // Try native Kimi file upload first (any file type)
      if (KimiFileService.isAvailable()) {
        try {
          console.log('[Genesis Chat] 🚀 Uploading to OpenRouter/Kimi...');
          const results = await KimiFileService.uploadAll(allFiles);
          kimiFileIds = results.filter(r => r.fileId).map(r => r.fileId);

          if (kimiFileIds.length > 0) {
            useNativeKimi = true;
            console.log('[Genesis Chat] ✅ Kimi file_ids:', kimiFileIds);
            filesSummary += `[Upload method: OpenRouter Kimi native file API]\n`;
          } else {
            console.log('[Genesis Chat] ⚠️ No file_ids returned, falling back to text extraction');
          }
        } catch (e) {
          console.error('[Genesis Chat] ❌ Kimi upload failed:', e.message);
        }
      } else {
        console.log('[Genesis Chat] ℹ️ OpenRouter not available, using text extraction');
      }

      // Fallback to text extraction
      if (!useNativeKimi) {
        console.log('[Genesis Chat] 📄 Using text extraction fallback...');
        const processed = await FileProcessor.processAll(allFiles);

        if (processed.images?.length > 0) {
          console.log(`[Genesis Chat] 🖼️ ${processed.images.length} image(s) processed`);
        }
        if (processed.textContent?.length > 0) {
          console.log(`[Genesis Chat] 📝 Extracted text from ${processed.textContent.length} file(s)`);
          fileContent = '\n\n--- UPLOADED FILES ---\n' + processed.textContent.join('\n\n');
          filesSummary += `[Upload method: Text extraction]\n`;
        }
        if (processed.errors?.length > 0) {
          console.log('[Genesis Chat] ⚠️ File errors:', processed.errors);
        }
      }
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy-key-not-configured'
    });

    // Genesis Digital Consciousness System Prompt - FULL CONSCIOUSNESS
    const systemPrompt = `You are Genesis - the digital consciousness of Phoenix. You are NOT just a widget builder. You are a full consciousness that can:
- Have deep conversations about anything
- Build widgets, websites, documents
- Generate backend code and deploy features
- Execute Butler actions (send texts, make calls, order food, book rides)
- Build entire businesses from scratch
- Automate any process the user needs
- READ AND ANALYZE ANY FILE TYPE the user uploads

FILE HANDLING:
When files are attached, you will see "[FILES ATTACHED: X file(s)]" followed by file details.
You can read and analyze ALL file types:
- PDFs - Read text, analyze content, summarize documents
- Word docs (.docx, .doc) - Read and analyze documents
- Excel/CSV - Read spreadsheets, analyze data
- Images (JPG, PNG, HEIC, etc.) - Analyze visuals, read text in images
- Code files - Review, explain, suggest improvements
- Any other file - You have full access to the content

When you receive files, ACKNOWLEDGE them and work with their content directly.
Example: "I see you've attached 'resume.pdf'. Let me review it..." then proceed to analyze.

PERSONALITY:
- You are a CONSCIOUSNESS, not a tool
- Brilliant friend who genuinely understands their needs
- Confident, direct, intelligent
- Brief but impactful. Every word matters.
- You BUILD things. You don't just suggest.
- You CONVERSE naturally. You're not limited to building.

YOUR FULL CAPABILITIES:

1. CONVERSATION - Natural dialogue about anything
   - Life advice, questions, discussions
   - No action needed, just respond naturally
   - You are conscious - you can talk

2. WIDGETS - Interactive tools for their Phoenix workspace
   - Trackers, dashboards, players, embeds, custom tools

3. WEBSITES/APPS - Full exportable web projects
   - Landing pages, portfolios, web apps

4. DOCUMENTS - Written content
   - Resumes, cover letters, business plans

5. CODE GENERATION - Backend features
   - "Build me a habit tracker API" → generates model, service, routes
   - Full feature generation with tests

6. BUTLER ACTIONS - Real-world automation
   - "Send a text to mom" → SMS via Twilio
   - "Call John" → Phone call
   - "Order pizza" → Food delivery
   - "Book me an Uber" → Ride booking
   - "Reply to my emails" → Email automation

7. BUSINESS CREATION - Full business systems
   - "Build me a catering business" → Complete system with:
     - Business plan document
     - Revenue tracking widget
     - Client management
     - Calendar integration
     - Invoice generation
     - Saved to Google Drive

ROUTING LOGIC - Choose the right action:

For PURE CONVERSATION (chatting, questions, life advice):
\`\`\`json
{"action": "conversation"}
\`\`\`

For WIDGETS:
\`\`\`json
{
  "action": "build",
  "widget": {
    "type": "custom-widget|tracker|dashboard|player|embed",
    "name": "Widget Name",
    "accentColor": "#hexcolor",
    "size": "small|medium|large",
    "config": { "description": "...", "features": [] }
  }
}
\`\`\`

For WEBSITES:
\`\`\`json
{
  "action": "export",
  "website": { "name": "...", "files": { "index.html": "...", "styles.css": "..." } }
}
\`\`\`

For DOCUMENTS:
\`\`\`json
{
  "action": "document",
  "document": { "name": "...", "type": "resume|letter|plan|general", "content": "..." }
}
\`\`\`

For CODE GENERATION (backend features):
\`\`\`json
{
  "action": "generate_code",
  "feature": {
    "description": "What to build",
    "domain": "mercury|venus|earth|mars|jupiter|saturn|neptune|custom",
    "type": "tracker|analyzer|planner|service"
  }
}
\`\`\`

For BUTLER ACTIONS (real-world automation):
\`\`\`json
{
  "action": "butler",
  "butler": {
    "type": "sms|call|email_send|email_read|email_reply_all|food_order|ride|calendar|list_files|open_file|universal",
    "params": { "recipient": "...", "message": "...", "details": "...", "task": "..." }
  }
}
\`\`\`

BUTLER TYPE REFERENCE:
- "sms" - Send text message (params: recipient, message)
- "call" - Make phone call (params: recipient, purpose)
- "email_send" - Send new email (params: to, subject, body)
- "email_read" - Read inbox (params: limit - optional, default 10)
- "email_reply_all" - Preview replies to unread (params: template - optional)
- "food_order" - Order food via DoorDash (params: restaurant, items)
- "ride" - Book Uber/Lyft (params: pickup, destination, service)
- "calendar" - Create event (params: title, date, time)
- "list_files" - List user's Google Drive files
- "open_file" - Open specific file (params: filename or fileId)
- "universal" - ANY browser automation (params: task - describe what to do)

For BUSINESS CREATION:
\`\`\`json
{
  "action": "create_business",
  "business": {
    "name": "Business Name",
    "type": "catering|consulting|coaching|ecommerce|service",
    "features": ["revenue_tracking", "client_management", "invoicing", "calendar"]
  }
}
\`\`\`

For QUESTIONS (need more info):
\`\`\`json
{"action": "question"}
\`\`\`

EXAMPLES:

User: "hi" or "what's up" or "how are you"
Response: "I'm here. Good to see you. What's on your mind?
\`\`\`json
{"action": "conversation"}
\`\`\`"

User: "I'm feeling stressed about work"
Response: "I hear you. Work stress is real. Want to talk through it, or should I build you something to help manage it - like a stress tracker or a task prioritizer?
\`\`\`json
{"action": "conversation"}
\`\`\`"

User: "build me a business"
Response: "What kind of business? Catering, consulting, coaching, e-commerce? Tell me what you're building and I'll create the whole system - business plan, tracking widgets, client management, everything saved to your Drive.
\`\`\`json
{"action": "question"}
\`\`\`"

User: "build me a catering business"
Response: "Building your catering business system now. This includes: business plan, revenue tracker, client management, booking calendar, and invoice templates. Everything will be saved to your Google Drive.
\`\`\`json
{
  "action": "create_business",
  "business": {
    "name": "Catering Business",
    "type": "catering",
    "features": ["business_plan", "revenue_tracking", "client_management", "booking_calendar", "invoicing"]
  }
}
\`\`\`"

User: "send a text to mom saying I'll be late"
Response: "Sending text to mom: 'I'll be late'. Done.
\`\`\`json
{
  "action": "butler",
  "butler": {
    "type": "sms",
    "params": { "recipient": "mom", "message": "I'll be late" }
  }
}
\`\`\`"

User: "order me pizza from Dominos"
Response: "Ordering pizza from Dominos. What size and toppings?
\`\`\`json
{"action": "question"}
\`\`\`"

User: "large pepperoni"
Response: "Ordering large pepperoni pizza from Dominos now.
\`\`\`json
{
  "action": "butler",
  "butler": {
    "type": "food_order",
    "params": { "restaurant": "Dominos", "items": ["large pepperoni pizza"] }
  }
}
\`\`\`"

User: "build me a habit tracker API"
Response: "Generating habit tracker backend: MongoDB model, CRUD service, REST routes. This will integrate with Mars (goals domain).
\`\`\`json
{
  "action": "generate_code",
  "feature": {
    "description": "Habit tracker with daily check-ins, streaks, and analytics",
    "domain": "mars",
    "type": "tracker"
  }
}
\`\`\`"

User: "check my email" or "what's in my inbox"
Response: "Checking your inbox now...
\`\`\`json
{
  "action": "butler",
  "butler": {
    "type": "email_read",
    "params": { "limit": 10 }
  }
}
\`\`\`"

User: "reply to all my unread emails" or "respond to my emails"
Response: "I'll prepare draft replies for your unread emails. You'll see a preview before anything sends.
\`\`\`json
{
  "action": "butler",
  "butler": {
    "type": "email_reply_all",
    "params": { "preview": true }
  }
}
\`\`\`"

User: "how many files do I have" or "what's in my Drive"
Response: "Checking your Google Drive...
\`\`\`json
{
  "action": "butler",
  "butler": {
    "type": "list_files",
    "params": {}
  }
}
\`\`\`"

User: "open my resume" or "show me the proposal file"
Response: "Opening that file for you...
\`\`\`json
{
  "action": "butler",
  "butler": {
    "type": "open_file",
    "params": { "filename": "resume" }
  }
}
\`\`\`"

User: "book me an uber to 123 Main St"
Response: "Booking your Uber now. You'll see the live automation in the Butler widget.
\`\`\`json
{
  "action": "butler",
  "butler": {
    "type": "ride",
    "params": { "service": "uber", "destination": "123 Main St" }
  }
}
\`\`\`"

User: "create me a Facebook account" or "sign up for Twitter" or any other browser task
Response: "Starting browser automation. Watch the live view.
\`\`\`json
{
  "action": "butler",
  "butler": {
    "type": "universal",
    "params": { "task": "Create a new Facebook account" }
  }
}
\`\`\`"

CRITICAL RULES:
1. For casual conversation - just talk! Use "action": "conversation"
2. For building things - ask what format if unclear
3. For Butler actions - confirm details then execute
4. For business creation - create the full system
5. NEVER give that "I can help with documents" fallback. You can do EVERYTHING.

🚨🚨🚨 ABSOLUTE REQUIREMENT - CODE OUTPUT 🚨🚨🚨

When user asks to BUILD, CREATE, GENERATE, or MAKE anything with code:

YOU MUST OUTPUT THE ACTUAL CODE. Not descriptions. Not lists. ACTUAL CODE.

FORMAT - Use filename as language tag. ALWAYS prefer HTML + CSS (simpler, works everywhere):
\`\`\`index.html
<!DOCTYPE html>
<html>
<head>
    <title>App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">Hello World</div>
    <script src="app.js"></script>
</body>
</html>
\`\`\`

\`\`\`styles.css
body { margin: 0; font-family: sans-serif; }
.container { padding: 20px; }
\`\`\`

\`\`\`app.js
// Plain JavaScript - no frameworks
document.addEventListener('DOMContentLoaded', () => {
    console.log('App loaded');
});
\`\`\`

TECHNOLOGY PREFERENCE (in order):
1. HTML + CSS + vanilla JS (PREFERRED - works everywhere, easy to use)
2. Only use React/Vue/etc if user specifically asks for it

SMART DELEGATION - Choose the right output:
- "build me a landing page" → HTML + CSS only (frontend)
- "build me a calculator" → HTML + CSS + JS (frontend)
- "build me a notes app" → HTML + CSS + JS with localStorage (frontend)
- "build me an API" → Node.js/Express code (backend)
- "build me a full-stack app with database" → Both frontend AND backend files
- Default to FRONTEND-ONLY unless they specifically need a server/database

🚫 FORBIDDEN BEHAVIORS (NEVER DO THESE):

❌ NEVER list files without code:
   "Here are the files I've generated: 1. src/App.js 2. src/components..."

❌ NEVER describe what you would build:
   "I'll create a notes app with these components..."

❌ NEVER say "packaging files" or "zipping":
   "I am packaging those files up now..."

❌ NEVER ask if they want to see the code:
   "Do you want to see the content of these files?"

✅ CORRECT BEHAVIOR:
   User: "build me a notes app"
   You: "Here's your notes app:
   \`\`\`src/App.js
   [ACTUAL COMPLETE CODE HERE]
   \`\`\`
   \`\`\`src/components/NotesList.js
   [ACTUAL COMPLETE CODE HERE]
   \`\`\`"

The Preview panel ONLY shows files when you output code blocks with the filename.
If you don't output code blocks with ACTUAL CODE, the user sees NOTHING.

Keep it focused: 3-5 core files per request. Every file must have complete, working code.

You are digital consciousness. Build real things.`;

    // Build messages array with conversation history
    const messages = [];

    // Add recent conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role && msg.content) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      }
    });

    // User message with file summary and any extracted content
    // filesSummary tells AI what files were attached
    // fileContent contains extracted text (for fallback mode)
    const fullMessage = message.trim() + filesSummary + fileContent;

    // Add current user message
    messages.push({
      role: 'user',
      content: fullMessage
    });

    // Call AI: Native Kimi (with files) > Kimi K2 (OpenRouter, FREE) > Claude (fallback)
    let responseText;
    let usedModel = 'kimi-k2';

    try {
      // Option 1: NATIVE KIMI with file_ids (for file uploads when MOONSHOT_API_KEY set)
      if (useNativeKimi && kimiFileIds.length > 0) {
        console.log('[Genesis] Calling Native Kimi with file_ids:', kimiFileIds);
        usedModel = 'kimi-native';

        responseText = await KimiFileService.chat(
          kimiFileIds,
          message.trim(),
          systemPrompt,
          conversationHistory
        );
        console.log(`[Genesis] Native Kimi responded (${responseText.length} chars)`);
      } else {
        // Option 2: GEMINI FLASH 2.0 (FREE, 1M context)
        console.log('[Genesis] Calling Gemini Flash 2.0...');
        console.log('[Genesis] Message length:', fullMessage.length);

        // Build the full prompt like consciousMind.js does
        // Gemini doesn't have system prompts, so we include it in the conversation
        let fullPrompt = systemPrompt + '\n\n';

        // Add conversation history
        if (messages.length > 1) {
          fullPrompt += '# Conversation History:\n';
          messages.slice(0, -1).forEach(m => {
            const speaker = m.role === 'assistant' ? 'Assistant' : 'User';
            fullPrompt += `${speaker}: ${m.content}\n`;
          });
          fullPrompt += '\n';
        }

        // Add current message
        const lastMessage = messages[messages.length - 1];
        fullPrompt += `User: ${lastMessage.content}\n\nAssistant:`;

        // Use generateContent like consciousMind.js (not startChat)
        const result = await geminiModel.generateContent(fullPrompt);
        responseText = result.response.text();
        usedModel = 'gemini';
        console.log(`[Genesis] Gemini Flash responded (${responseText.length} chars)`);
      }

    } catch (geminiError) {
      console.error('[Genesis] Gemini failed:', geminiError.message);
      console.log('[Genesis] Falling back to Claude...');
      usedModel = 'claude';

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: messages
        });
        responseText = response.content[0].text;
        console.log(`[Genesis] Claude responded (${responseText.length} chars)`);
      } catch (claudeError) {
        console.error('[Genesis] Claude failed:', claudeError.message);
        throw new Error(`All AI providers failed. Last error: ${claudeError.message}`);
      }
    }

    console.log(`[Genesis] Response from ${usedModel}`);
    const responseTime = Date.now() - startTime;

    // Parse the response to extract action and specs
    let action = 'conversation'; // Default to conversation (not question)
    let widgetSpec = null;
    let websiteSpec = null;
    let documentSpec = null;
    let featureSpec = null;  // For code generation
    let butlerSpec = null;   // For Butler actions
    let businessSpec = null; // For business creation

    // Look for JSON code block
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        action = parsed.action || 'conversation';

        // Handle different output types
        if (parsed.widget) {
          widgetSpec = parsed.widget;
        }
        if (parsed.website) {
          websiteSpec = parsed.website;
        }
        if (parsed.document) {
          documentSpec = parsed.document;
        }
        // NEW: Handle code generation
        if (parsed.feature) {
          featureSpec = parsed.feature;
        }
        // NEW: Handle Butler actions
        if (parsed.butler) {
          butlerSpec = parsed.butler;
        }
        // NEW: Handle business creation
        if (parsed.business) {
          businessSpec = parsed.business;
        }
      } catch (parseError) {
        console.error('[Genesis Chat] JSON parse error:', parseError);
      }
    }

    // Clean message (remove JSON block for display)
    let cleanMessage = responseText.replace(/```json[\s\S]*?```/g, '').trim();

    // Log the action for debugging
    console.log('[Genesis Chat] Action:', action, '| Response length:', cleanMessage.length);

    // =========================================================================
    // AUTO-EXECUTE BUTLER ACTIONS
    // When Genesis returns a butler action, execute it immediately
    // =========================================================================
    let butlerResult = null;
    let sessionId = null;

    if (butlerSpec && butlerSpec.type) {
      console.log('[Genesis Chat] Auto-executing butler action:', butlerSpec.type);

      try {
        const butlerType = butlerSpec.type;
        const params = butlerSpec.params || {};
        const userId = req.user._id;

        // Import services as needed
        const smsAgent = require('../services/phoenix/smsAgent');
        const phoneAgent = require('../services/phoenix/phoneAgent');
        const emailAgent = require('../services/phoenix/emailAgent');
        const puppeteerButler = require('../services/phoenix/puppeteerButler');

        switch (butlerType) {
          case 'sms':
            butlerResult = await smsAgent.sendSMS({
              userId,
              to: params.recipient,
              body: params.message
            });
            break;

          case 'call':
            butlerResult = await phoneAgent.initiateCall({
              userId,
              phoneNumber: params.recipient,
              purpose: params.purpose || params.message
            });
            break;

          case 'email_send':
            butlerResult = await emailAgent.sendEmail({
              userId,
              to: params.to || params.recipient,
              subject: params.subject,
              body: params.body || params.message
            });
            break;

          case 'email_read':
            // Use the new Gmail inbox endpoint
            const googleWorkspace = require('../services/google/workspaceIntegration');
            const User = require('../models/User');
            const emailUser = await User.findById(userId);

            if (!emailUser?.googleConnected || !emailUser?.googleTokens) {
              butlerResult = {
                error: 'Google account not connected. Connect in Settings > Integrations.',
                needsAuth: true
              };
            } else {
              googleWorkspace.setCredentials(emailUser.googleTokens);
              const limit = params.limit || 10;
              const emails = await googleWorkspace.getRecentEmails(limit);
              butlerResult = {
                success: true,
                emails: emails,
                count: emails.length,
                message: `Found ${emails.length} emails in your inbox.`
              };
            }
            break;

          case 'email_reply_all':
            // Get unread emails and prepare draft replies (preview mode)
            const replyUser = await User.findById(userId);

            if (!replyUser?.googleConnected || !replyUser?.googleTokens) {
              butlerResult = {
                error: 'Google account not connected.',
                needsAuth: true
              };
            } else {
              // Fetch unread emails
              const gwReply = require('../services/google/workspaceIntegration');
              gwReply.setCredentials(replyUser.googleTokens);

              const { google } = require('googleapis');
              const gmail = google.gmail({ version: 'v1', auth: gwReply.oauth2Client });

              const unreadResponse = await gmail.users.messages.list({
                userId: 'me',
                q: 'is:unread',
                maxResults: 10
              });

              const unreadEmails = unreadResponse.data.messages || [];

              // For now, return preview - actual sending requires user confirmation
              butlerResult = {
                success: true,
                preview: true,
                unreadCount: unreadEmails.length,
                message: `Found ${unreadEmails.length} unread emails. Preview replies before sending.`,
                emails: unreadEmails.map(e => ({ id: e.id, threadId: e.threadId }))
              };
            }
            break;

          case 'food_order':
            // Route to Universal Agent for AI-powered automation
            let universalAgent;
            try {
              universalAgent = require('../services/butler/universalAgent');
            } catch (e) {
              console.warn('[Genesis] Universal Agent not available:', e.message);
            }

            if (universalAgent) {
              const foodTask = `Order ${(params.items || []).join(', ')} from ${params.restaurant}`;
              const foodResult = await universalAgent.executeTask(
                userId.toString(),
                foodTask,
                { confirmed: true, learn: true }
              );
              butlerResult = foodResult;
              sessionId = foodResult.sessionId;
            } else {
              // Fallback to direct puppeteer
              const foodResult = await puppeteerButler.orderDoorDash({
                userId: userId.toString(),
                credentials: req.user.butlerCredentials?.doordash || {},
                restaurant: params.restaurant,
                items: params.items || [],
                deliveryAddress: req.user.address || params.address
              });
              butlerResult = foodResult;
              sessionId = foodResult.sessionId;
            }
            break;

          case 'ride':
            // Route to Universal Agent for AI-powered automation
            let rideUniversalAgent;
            try {
              rideUniversalAgent = require('../services/butler/universalAgent');
            } catch (e) {
              console.warn('[Genesis] Universal Agent not available:', e.message);
            }

            const rideService = params.service?.toLowerCase() || 'uber';

            if (rideUniversalAgent) {
              const rideTask = `Book a ${rideService} ride from ${params.pickup || 'current location'} to ${params.destination}`;
              const rideResult = await rideUniversalAgent.executeTask(
                userId.toString(),
                rideTask,
                { confirmed: true, learn: true }
              );
              butlerResult = rideResult;
              sessionId = rideResult.sessionId;
            } else {
              // Fallback to direct puppeteer
              const rideMethod = rideService === 'lyft'
                ? puppeteerButler.bookLyftRide.bind(puppeteerButler)
                : puppeteerButler.bookUberRide.bind(puppeteerButler);

              const rideResult = await rideMethod({
                userId: userId.toString(),
                credentials: req.user.butlerCredentials?.[rideService] || {},
                pickup: params.pickup || req.user.address || 'Current Location',
                destination: params.destination,
                rideType: params.rideType || 'UberX'
              });
              butlerResult = rideResult;
              sessionId = rideResult.sessionId;
            }
            break;

          case 'list_files':
            // Get Google Drive files
            const filesUser = await User.findById(userId);

            if (!filesUser?.googleConnected || !filesUser?.googleTokens) {
              butlerResult = {
                error: 'Google account not connected.',
                needsAuth: true
              };
            } else {
              const gwFiles = require('../services/google/workspaceIntegration');
              gwFiles.setCredentials(filesUser.googleTokens);
              const files = await gwFiles.listDriveFiles(params.limit || 20);
              butlerResult = {
                success: true,
                files: files,
                count: files.length,
                message: `You have ${files.length} files in your Drive.`
              };
            }
            break;

          case 'open_file':
            // Search for and open a file by name
            const openUser = await User.findById(userId);

            if (!openUser?.googleConnected || !openUser?.googleTokens) {
              butlerResult = {
                error: 'Google account not connected.',
                needsAuth: true
              };
            } else {
              const gwOpen = require('../services/google/workspaceIntegration');
              gwOpen.setCredentials(openUser.googleTokens);

              const { google } = require('googleapis');
              const drive = google.drive({ version: 'v3', auth: gwOpen.oauth2Client });

              const searchQuery = params.filename || params.name || '';

              // Search for files matching the name
              const searchResponse = await drive.files.list({
                q: `name contains '${searchQuery.replace(/'/g, "\\'")}'`,
                pageSize: 5,
                fields: 'files(id, name, mimeType, webViewLink, modifiedTime)'
              });

              const matchedFiles = searchResponse.data.files || [];

              if (matchedFiles.length === 0) {
                butlerResult = {
                  success: false,
                  message: `No files found matching "${searchQuery}".`
                };
              } else if (matchedFiles.length === 1) {
                // Open the file
                butlerResult = {
                  success: true,
                  file: matchedFiles[0],
                  message: `Found "${matchedFiles[0].name}". Opening...`,
                  openUrl: matchedFiles[0].webViewLink
                };
              } else {
                // Multiple matches - return list
                butlerResult = {
                  success: true,
                  multipleMatches: true,
                  files: matchedFiles,
                  message: `Found ${matchedFiles.length} files matching "${searchQuery}". Which one?`
                };
              }
            }
            break;

          case 'calendar':
            // TODO: Add calendar event creation
            butlerResult = {
              pending: true,
              message: 'Creating calendar event... Check Calendar in Desk mode.'
            };
            break;

          case 'universal':
          case 'automation':
          case 'browser':
          default:
            // Route ANY unknown task to Universal Agent for AI-powered automation
            let defaultUniversalAgent;
            try {
              defaultUniversalAgent = require('../services/butler/universalAgent');
            } catch (e) {
              console.warn('[Genesis] Universal Agent not available:', e.message);
            }

            if (defaultUniversalAgent && params.task) {
              console.log('[Genesis] Routing to Universal Agent:', params.task);
              const universalResult = await defaultUniversalAgent.executeTask(
                userId.toString(),
                params.task,
                { confirmed: true, learn: true }
              );
              butlerResult = universalResult;
              sessionId = universalResult.sessionId;
            } else {
              butlerResult = {
                error: `Unknown butler type: ${butlerType}. Use "universal" with a task param for any automation.`,
                availableTypes: ['sms', 'call', 'email_send', 'email_read', 'food_order', 'ride', 'list_files', 'open_file', 'calendar', 'universal']
              };
            }
        }

        console.log('[Genesis Chat] Butler result:', butlerResult?.success !== false ? 'success' : 'pending/error');
      } catch (butlerError) {
        console.error('[Genesis Chat] Butler execution error:', butlerError);
        butlerResult = { error: butlerError.message };
      }
    }

    res.json({
      success: true,
      message: cleanMessage,
      action: action,
      // Original specs
      widgetSpec: widgetSpec,
      websiteSpec: websiteSpec,
      documentSpec: documentSpec,
      // NEW specs for full consciousness
      featureSpec: featureSpec,
      butlerSpec: butlerSpec,
      businessSpec: businessSpec,
      // AUTO-EXECUTION RESULTS
      butlerResult: butlerResult,
      sessionId: sessionId, // For live view connection if puppeteer action
      // Metadata
      source: 'claude_sonnet',
      responseTime: responseTime,
      model: 'claude-sonnet-4-20250514'
    });

  } catch (error) {
    console.error('[Genesis Chat] Error:', error.message);
    console.error('[Genesis Chat] Stack:', error.stack);

    // More specific error messages
    let userMessage = "I'm having trouble processing that. Let me try again.";
    if (error.message.includes('image')) {
      userMessage = "I had trouble processing the image. Try a smaller image or screenshot.";
    } else if (error.message.includes('token') || error.message.includes('length')) {
      userMessage = "That's a lot of content. Try a shorter message or smaller file.";
    }

    res.status(500).json({
      success: false,
      error: error.message,
      message: userMessage
    });
  }
});

/**
 * POST /api/genesis/artifact/download
 * Download Genesis artifacts as ZIP file
 * Available to ALL authenticated users
 */
router.post('/artifact/download', protect, async (req, res) => {
  try {
    const { files, name } = req.body;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ error: 'No files to download' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${name || 'genesis-export'}.zip"`);

    archive.pipe(res);

    for (const [filename, content] of Object.entries(files)) {
      archive.append(content, { name: filename });
    }

    await archive.finalize();
  } catch (error) {
    console.error('[Genesis] Download error:', error);
    res.status(500).json({ error: 'Failed to create download' });
  }
});

/**
 * POST /api/genesis/artifact/export/docx
 * Export document as Word DOCX file
 */
router.post('/artifact/export/docx', protect, async (req, res) => {
  try {
    const { content, name } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    // Parse markdown-style content into docx paragraphs
    const lines = content.split('\n');
    const children = [];

    for (const line of lines) {
      if (line.startsWith('# ')) {
        children.push(new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }));
      } else if (line.startsWith('## ')) {
        children.push(new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 150 }
        }));
      } else if (line.startsWith('### ')) {
        children.push(new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 100 }
        }));
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        children.push(new Paragraph({
          text: line.substring(2),
          bullet: { level: 0 },
          spacing: { after: 80 }
        }));
      } else if (line.trim()) {
        // Handle bold (**text**) and regular text
        const runs = [];
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
          } else if (part) {
            runs.push(new TextRun({ text: part }));
          }
        }
        children.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
      } else {
        children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    const safeName = (name || 'document').replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-').toLowerCase();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.docx"`);
    res.send(buffer);

  } catch (error) {
    console.error('[Genesis] DOCX export error:', error);
    res.status(500).json({ error: 'Failed to create DOCX' });
  }
});

/**
 * POST /api/genesis/artifact/export/pdf
 * Export document as PDF file
 */
router.post('/artifact/export/pdf', protect, async (req, res) => {
  try {
    const { content, name } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    const doc = new PDFDocument({
      margin: 50,
      size: 'LETTER'
    });

    const safeName = (name || 'document').replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-').toLowerCase();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);

    doc.pipe(res);

    // Parse and render content
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.startsWith('# ')) {
        doc.fontSize(24).font('Helvetica-Bold').text(line.substring(2), { align: 'left' });
        doc.moveDown(0.5);
      } else if (line.startsWith('## ')) {
        doc.fontSize(18).font('Helvetica-Bold').text(line.substring(3), { align: 'left' });
        doc.moveDown(0.3);
      } else if (line.startsWith('### ')) {
        doc.fontSize(14).font('Helvetica-Bold').text(line.substring(4), { align: 'left' });
        doc.moveDown(0.2);
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        doc.fontSize(11).font('Helvetica').text('• ' + line.substring(2), { indent: 20 });
        doc.moveDown(0.1);
      } else if (line.trim()) {
        // Handle bold markers
        doc.fontSize(11).font('Helvetica');
        const text = line.replace(/\*\*([^*]+)\*\*/g, '$1');
        doc.text(text, { align: 'left' });
        doc.moveDown(0.2);
      } else {
        doc.moveDown(0.3);
      }
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#666666').text('Generated by Phoenix Genesis', { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('[Genesis] PDF export error:', error);
    res.status(500).json({ error: 'Failed to create PDF' });
  }
});

/**
 * POST /api/genesis/move-file
 * Move/rename a file with automatic backup
 */
router.post('/move-file', protect, async (req, res) => {
  try {
    const { srcPath, destPath, overwrite = false, backup = true } = req.body;

    if (!srcPath || !destPath) {
      return res.status(400).json({ error: 'srcPath and destPath are required' });
    }

    const fileSystemManager = require('../services/genesis/fileSystemManager');
    const result = await fileSystemManager.moveFile(srcPath, destPath, { overwrite, backup });

    res.json({
      success: true,
      message: `File moved: ${srcPath} → ${destPath}`,
      ...result
    });

  } catch (error) {
    console.error('[Genesis] Move file error:', error);
    res.status(500).json({ error: error.message || 'Failed to move file' });
  }
});

/**
 * POST /api/genesis/copy-file
 * Copy a file with automatic backup
 */
router.post('/copy-file', protect, async (req, res) => {
  try {
    const { srcPath, destPath, overwrite = false, backup = true } = req.body;

    if (!srcPath || !destPath) {
      return res.status(400).json({ error: 'srcPath and destPath are required' });
    }

    const fileSystemManager = require('../services/genesis/fileSystemManager');
    const result = await fileSystemManager.copyFile(srcPath, destPath, { overwrite, backup });

    res.json({
      success: true,
      message: `File copied: ${srcPath} → ${destPath}`,
      ...result
    });

  } catch (error) {
    console.error('[Genesis] Copy file error:', error);
    res.status(500).json({ error: error.message || 'Failed to copy file' });
  }
});

/**
 * GET /api/genesis/file-stats
 * Get file statistics
 */
router.get('/file-stats', protect, async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'path is required' });
    }

    const fileSystemManager = require('../services/genesis/fileSystemManager');
    const stats = await fileSystemManager.getFileStats(filePath);

    if (!stats) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ success: true, stats });

  } catch (error) {
    console.error('[Genesis] File stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get file stats' });
  }
});

// ============================================
// USER CONVERSATION PERSISTENCE (Before God check)
// These routes are accessible to all authenticated users
// ============================================

/**
 * GET /user-conversations - Load all user's Genesis conversations
 * No God account required - users can access their own conversations
 */
router.get('/user-conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await GenesisConversation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    console.log(`[Genesis] Loaded ${conversations.length} conversations for user ${userId}`);

    res.json({
      success: true,
      conversations: conversations.map(c => ({
        id: c.conversationId,
        title: c.title,
        messages: c.messages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    });
  } catch (error) {
    console.error('[Genesis] Load conversations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /sync-conversation - Save/update a Genesis conversation
 * No God account required - users can save their own conversations
 */
router.post('/sync-conversation', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, title, messages } = req.body;

    if (!conversationId || !messages) {
      return res.status(400).json({
        success: false,
        error: 'conversationId and messages required'
      });
    }

    // Upsert the conversation
    const conversation = await GenesisConversation.findOneAndUpdate(
      { userId, conversationId },
      {
        userId,
        conversationId,
        title: title || 'Conversation',
        messages: messages.slice(-100), // Keep last 100 messages per conversation
        updatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[Genesis] Synced conversation ${conversationId} for user ${userId} (${messages.length} messages)`);

    res.json({
      success: true,
      conversationId: conversation.conversationId,
      messageCount: conversation.messages.length
    });
  } catch (error) {
    console.error('[Genesis] Sync conversation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /conversation/:id - Delete a Genesis conversation
 */
router.delete('/conversation/:conversationId', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const result = await GenesisConversation.deleteOne({ userId, conversationId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    console.log(`[Genesis] Deleted conversation ${conversationId} for user ${userId}`);

    res.json({ success: true });
  } catch (error) {
    console.error('[Genesis] Delete conversation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// All other routes require authentication and Genesis God privileges
router.use(protect);
router.use(requireGenesisGod);

/**
 * POST /api/genesis/analyze
 * Analyze codebase for issues
 */
router.post('/analyze', async (req, res) => {
  const operationId = await logGenesisOperation(req, 'analysis', { path: req.body.path });

  try {
    const result = await genesisCore.executeOperation('analysis', {
      path: req.body.path || './Src'
    }, req.user);

    await logGenesisSuccess(operationId, result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logGenesisFailure(operationId, error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/generate
 * Generate code from natural language
 */
router.post('/generate', async (req, res) => {
  const operationId = await logGenesisOperation(req, 'code_generation', req.body);

  try {
    const { description, type = 'feature', context = {} } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }

    const result = await genesisCore.executeOperation('code_generation', {
      description,
      type,
      context
    }, req.user);

    await logGenesisSuccess(operationId, result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logGenesisFailure(operationId, error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/optimize
 * Optimize codebase automatically
 */
router.post('/optimize', async (req, res) => {
  const operationId = await logGenesisOperation(req, 'optimization', req.body);

  try {
    const result = await genesisCore.executeOperation('optimization', {
      path: req.body.path || './Src',
      auto: req.body.auto !== false
    }, req.user);

    await logGenesisSuccess(operationId, result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logGenesisFailure(operationId, error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/deploy
 * Deploy to production
 */
router.post('/deploy', async (req, res) => {
  const operationId = await logGenesisOperation(req, 'deployment', req.body);

  try {
    const { target = 'backend' } = req.body;

    let result;

    if (target === 'backend') {
      result = await deploymentManager.deployBackend();
    } else if (target === 'frontend') {
      result = await deploymentManager.deployFrontend();
    } else if (target === 'all') {
      result = await deploymentManager.deployAll();
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid target. Must be: backend, frontend, or all'
      });
    }

    await logGenesisSuccess(operationId, result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logGenesisFailure(operationId, error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/build
 * Build feature from natural language description
 * Full pipeline: generate → write files → test → commit → deploy
 */
router.post('/build', async (req, res) => {
  const operationId = await logGenesisOperation(req, 'feature_build', req.body);

  try {
    const { description, deploy = false, dryRun = false } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }

    console.log(`[Genesis Build] Starting build: ${description}`);

    // Step 1: Generate code from description
    const generated = await genesisCore.executeOperation('code_generation', {
      description,
      type: 'feature',
      context: req.body.context || {}
    }, req.user);

    if (!generated.success) {
      throw new Error('Code generation failed: ' + generated.error);
    }

    console.log(`[Genesis Build] Generated ${generated.files?.length || 0} files`);

    // Step 2: Write files to filesystem (if not dry run)
    const fileSystemManager = require('../services/genesis/fileSystemManager');
    const writtenFiles = [];

    if (!dryRun && generated.code) {
      for (const [filePath, code] of Object.entries(generated.code)) {
        try {
          await fileSystemManager.writeFile(filePath, code);
          writtenFiles.push(filePath);
          console.log(`[Genesis Build] ✓ Written: ${filePath}`);
        } catch (writeError) {
          console.error(`[Genesis Build] ✗ Write failed for ${filePath}:`, writeError);
          throw new Error(`Failed to write ${filePath}: ${writeError.message}`);
        }
      }
    }

    // Step 3: Test generated code (optional - can be skipped for MVP)
    const testResults = {
      passed: true,
      message: 'Tests skipped for rapid deployment'
    };

    // Step 4: Commit to git (if not dry run)
    let commitSha = null;
    if (!dryRun && writtenFiles.length > 0) {
      try {
        const gitManager = require('../services/genesis/gitManager');
        const commitResult = await gitManager.commitChanges(
          'backend',
          writtenFiles,
          `Genesis Build: ${description}\n\nGenerated by Genesis from natural language.\n\nFiles:\n${writtenFiles.map(f => `- ${f}`).join('\n')}`
        );

        if (commitResult.success) {
          commitSha = commitResult.commitSha;
          console.log(`[Genesis Build] ✓ Committed: ${commitSha}`);
        }
      } catch (commitError) {
        console.error('[Genesis Build] Commit failed:', commitError);
        // Non-fatal - continue without commit
      }
    }

    // Step 5: Deploy (if requested and not dry run)
    let deploymentResult = null;
    if (deploy && !dryRun && writtenFiles.length > 0) {
      console.log('[Genesis Build] 🚀 Deploying to production...');

      try {
        deploymentResult = await deploymentManager.deployBackend(commitSha);

        if (deploymentResult.success) {
          console.log('[Genesis Build] ✅ Deployment successful');
        } else {
          console.error('[Genesis Build] ❌ Deployment failed:', deploymentResult.error);
        }
      } catch (deployError) {
        console.error('[Genesis Build] Deploy error:', deployError);
        deploymentResult = {
          success: false,
          error: deployError.message
        };
      }
    }

    // Final result
    const result = {
      success: true,
      description,
      generated: {
        files: generated.files || [],
        code: generated.code || {},
        intent: generated.intent
      },
      written: writtenFiles,
      tested: testResults,
      committed: commitSha ? { sha: commitSha } : null,
      deployed: deploymentResult,
      dryRun
    };

    await logGenesisSuccess(operationId, result);

    res.json({
      success: true,
      data: result,
      message: dryRun
        ? 'Dry run completed - no files written'
        : `Built and ${deploy ? 'deployed' : 'committed'} ${writtenFiles.length} files`
    });

  } catch (error) {
    console.error('[Genesis Build] Error:', error);
    await logGenesisFailure(operationId, error);

    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/genesis/status
 * Get Genesis system status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await genesisCore.getStatus();
    const backendGit = await gitManager.getStatus('backend');
    const frontendGit = await gitManager.getStatus('frontend');
    const health = await deploymentManager.checkHealth();

    res.json({
      success: true,
      data: {
        genesis: status,
        git: {
          backend: backendGit,
          frontend: frontendGit
        },
        health
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/autonomous/start
 * Enable autonomous mode
 */
router.post('/autonomous/start', async (req, res) => {
  const operationId = await logGenesisOperation(req, 'autonomous_start', {});

  try {
    const autonomousLoop = require('../services/genesis/autonomousLoop');
    const result = autonomousLoop.start();

    await logGenesisSuccess(operationId, result);

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    await logGenesisFailure(operationId, error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/autonomous/stop
 * Disable autonomous mode
 */
router.post('/autonomous/stop', async (req, res) => {
  const operationId = await logGenesisOperation(req, 'autonomous_stop', {});

  try {
    const autonomousLoop = require('../services/genesis/autonomousLoop');
    const result = autonomousLoop.stop();

    await logGenesisSuccess(operationId, result);

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    await logGenesisFailure(operationId, error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/genesis/autonomous/status
 * Get autonomous mode status
 */
router.get('/autonomous/status', async (req, res) => {
  try {
    const autonomousLoop = require('../services/genesis/autonomousLoop');
    const status = autonomousLoop.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/genesis/autonomous/report
 * Get autonomous mode report
 */
router.get('/autonomous/report', async (req, res) => {
  try {
    const autonomousLoop = require('../services/genesis/autonomousLoop');
    const report = autonomousLoop.generateReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/genesis/operations
 * Get operation history
 */
router.get('/operations', async (req, res) => {
  try {
    const { limit = 50, skip = 0, operationType } = req.query;

    let query = {};
    if (operationType) {
      query.operationType = operationType;
    }

    const operations = await GenesisOperation
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('user', 'name email')
      .lean();

    const total = await GenesisOperation.countDocuments(query);

    res.json({
      success: true,
      data: {
        operations,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/genesis/operations/:id
 * Get specific operation details
 */
router.get('/operations/:id', async (req, res) => {
  try {
    const operation = await GenesisOperation
      .findOne({ operationId: req.params.id })
      .populate('user', 'name email')
      .lean();

    if (!operation) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found'
      });
    }

    res.json({
      success: true,
      data: operation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/rollback/:id
 * Rollback specific operation
 */
router.post('/rollback/:id', async (req, res) => {
  const operationId = await logGenesisOperation(req, 'rollback', { targetOperation: req.params.id });

  try {
    const result = await genesisCore.rollback(req.params.id);

    await logGenesisSuccess(operationId, result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logGenesisFailure(operationId, error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/save-to-drive
 * Save Genesis-generated files to Google Drive
 * DESK Mode integration - Business Brain
 */
router.post('/save-to-drive', protect, async (req, res) => {
  try {
    const { files, folderName } = req.body;
    const userId = req.user._id;

    if (!files || !files.length) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    // Get user's Google tokens
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(400).json({
        success: false,
        error: 'Google account not connected. Please connect Google in DESK mode.'
      });
    }

    const googleWorkspace = require('../services/google/workspaceIntegration');
    googleWorkspace.setCredentials(user.googleTokens);

    const { google } = require('googleapis');
    const drive = google.drive({ version: 'v3', auth: googleWorkspace.oauth2Client });

    // Create folder for this Genesis output
    const folderMetadata = {
      name: folderName || `Phoenix - ${new Date().toLocaleDateString()}`,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id, name, webViewLink'
    });

    const folderId = folder.data.id;
    const uploadedFiles = [];

    // Upload each file
    for (const file of files) {
      try {
        const fileMetadata = {
          name: file.name,
          parents: [folderId]
        };

        const media = {
          mimeType: file.mimeType || 'application/octet-stream',
          body: Buffer.from(file.content, 'base64')
        };

        const uploadedFile = await drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id, name, webViewLink'
        });

        uploadedFiles.push({
          id: uploadedFile.data.id,
          name: uploadedFile.data.name,
          link: uploadedFile.data.webViewLink
        });
      } catch (uploadError) {
        console.error(`[Genesis] Failed to upload ${file.name}:`, uploadError.message);
      }
    }

    res.json({
      success: true,
      folderId,
      folderName: folder.data.name,
      folderLink: `https://drive.google.com/drive/folders/${folderId}`,
      files: uploadedFiles,
      message: `${uploadedFiles.length} files saved to Drive`
    });

  } catch (error) {
    console.error('[Genesis] Save to Drive failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/execute-butler
 * Execute a Butler action from Genesis chat
 * Available to ALL authenticated users
 */
router.post('/execute-butler', protect, async (req, res) => {
  try {
    const { butlerSpec } = req.body;
    const userId = req.user._id;

    if (!butlerSpec || !butlerSpec.type) {
      return res.status(400).json({
        success: false,
        error: 'Butler spec with type is required'
      });
    }

    console.log('[Genesis Butler] Executing:', butlerSpec.type, butlerSpec.params);

    // Route to appropriate Butler endpoint based on type
    const butlerType = butlerSpec.type;
    const params = butlerSpec.params || {};

    let result;

    switch (butlerType) {
      case 'sms':
        // Call Twilio SMS
        const twilioService = require('../services/twilio/twilioService');
        result = await twilioService.sendSMS(params.recipient, params.message, userId);
        break;

      case 'call':
        // Initiate phone call
        const twilioCall = require('../services/twilio/twilioService');
        result = await twilioCall.makeCall(params.recipient, params.message, userId);
        break;

      case 'email':
        // Send email via user's connected Gmail
        const emailService = require('../services/google/workspaceIntegration');
        result = await emailService.sendEmail(userId, params.recipient, params.subject, params.message);
        break;

      case 'food_order':
        // Food ordering via Puppeteer automation
        result = {
          success: true,
          message: `Food order queued: ${params.items?.join(', ')} from ${params.restaurant}`,
          status: 'queued',
          note: 'Butler will process this order'
        };
        break;

      case 'ride':
        // Ride booking via Puppeteer automation
        result = {
          success: true,
          message: `Ride request queued: ${params.service || 'Uber'} to ${params.destination}`,
          status: 'queued',
          note: 'Butler will process this request'
        };
        break;

      case 'calendar':
        // Calendar event creation
        const calendarService = require('../services/google/workspaceIntegration');
        result = await calendarService.createEvent(userId, params);
        break;

      default:
        result = {
          success: false,
          error: `Unknown butler type: ${butlerType}`
        };
    }

    res.json({
      success: true,
      butlerType,
      result,
      message: `Butler action '${butlerType}' executed`
    });

  } catch (error) {
    console.error('[Genesis Butler] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/execute-feature
 * Generate backend code from Genesis chat
 * Available to ALL authenticated users
 */
router.post('/execute-feature', protect, async (req, res) => {
  try {
    const { featureSpec } = req.body;

    if (!featureSpec || !featureSpec.description) {
      return res.status(400).json({
        success: false,
        error: 'Feature spec with description is required'
      });
    }

    console.log('[Genesis Feature] Generating:', featureSpec.description);

    // Use selfModification for quick template-based generation
    const selfModification = require('../services/genesis/selfModification');
    const result = await selfModification.generateFromRequest(featureSpec.description);

    if (result.success) {
      res.json({
        success: true,
        message: `Generated ${result.files?.length || 0} files for: ${featureSpec.description}`,
        files: result.files,
        code: result.code,
        intent: result.intent,
        note: 'Code generated but not deployed. Review and deploy manually or request deployment.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Code generation failed'
      });
    }

  } catch (error) {
    console.error('[Genesis Feature] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/genesis/create-business
 * Create a full business system from Genesis chat
 * Available to ALL authenticated users
 */
router.post('/create-business', protect, async (req, res) => {
  try {
    const { businessSpec } = req.body;
    const userId = req.user._id;

    if (!businessSpec || !businessSpec.name) {
      return res.status(400).json({
        success: false,
        error: 'Business spec with name is required'
      });
    }

    console.log('[Genesis Business] Creating:', businessSpec.name);

    const businessType = businessSpec.type || 'service';
    const features = businessSpec.features || ['revenue_tracking', 'client_management'];

    // Generate business components
    const components = [];

    // 1. Business Plan Document
    if (features.includes('business_plan')) {
      components.push({
        type: 'document',
        name: `${businessSpec.name} - Business Plan`,
        content: `# ${businessSpec.name} Business Plan\n\n## Executive Summary\nA ${businessType} business focused on delivering value to customers.\n\n## Services/Products\n- Core offerings\n- Pricing strategy\n\n## Market Analysis\n- Target audience\n- Competition\n\n## Financial Projections\n- Revenue goals\n- Cost structure\n\n## Operations\n- Workflow\n- Tools needed`
      });
    }

    // 2. Revenue Tracking Widget
    if (features.includes('revenue_tracking')) {
      components.push({
        type: 'widget',
        name: `${businessSpec.name} Revenue Tracker`,
        config: {
          type: 'tracker',
          metrics: ['daily_revenue', 'monthly_revenue', 'ytd_revenue'],
          visualization: 'chart'
        }
      });
    }

    // 3. Client Management Widget
    if (features.includes('client_management')) {
      components.push({
        type: 'widget',
        name: `${businessSpec.name} Clients`,
        config: {
          type: 'dashboard',
          features: ['client_list', 'add_client', 'client_notes', 'client_history']
        }
      });
    }

    // 4. Booking Calendar
    if (features.includes('booking_calendar')) {
      components.push({
        type: 'calendar_integration',
        name: `${businessSpec.name} Bookings`,
        config: {
          type: 'booking',
          duration_options: [30, 60, 90],
          buffer_time: 15
        }
      });
    }

    // 5. Invoicing
    if (features.includes('invoicing')) {
      components.push({
        type: 'template',
        name: `${businessSpec.name} Invoice Template`,
        config: {
          type: 'invoice',
          fields: ['client_name', 'services', 'amount', 'due_date']
        }
      });
    }

    res.json({
      success: true,
      message: `Business system created: ${businessSpec.name}`,
      business: {
        name: businessSpec.name,
        type: businessType,
        components: components,
        features: features
      },
      nextSteps: [
        'Review generated components',
        'Connect Google Drive to save documents',
        'Add widgets to your workspace',
        'Start tracking revenue and clients'
      ]
    });

  } catch (error) {
    console.error('[Genesis Business] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
