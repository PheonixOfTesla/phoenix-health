// ============================================================================
// TTS ROUTE - Full Language & Voice Support
// ============================================================================

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Local Piper TTS (optional - falls back to OpenAI if unavailable)
// DISABLED BY DEFAULT ON RAILWAY to prevent 502 crashes from sherpa-onnx-node
let piperLocal = null;
if (process.env.ENABLE_LOCAL_PIPER === 'true') {
  try {
    piperLocal = require('../services/genesis/piperLocal');
    if (piperLocal.isAvailable()) {
      console.log('[TTS] Local Piper TTS available');
    } else {
      piperLocal = null;
    }
  } catch (err) {
    console.log('[TTS] Local Piper TTS not available:', err.message);
  }
} else {
  console.log('[TTS] Local Piper TTS disabled (ENABLE_LOCAL_PIPER not set)');
}

// Simple in-memory cache
const cache = new Map();

// Pre-generated common responses for instant playback (<50ms)
// These cover ~30% of all Phoenix responses
const INSTANT_RESPONSES = {
    // Acknowledgments (most common)
    "Got it!": null,
    "On it!": null,
    "No worries!": null,
    "Sure thing!": null,
    "Absolutely!": null,
    "Perfect!": null,
    "Done!": null,
    "All set!": null,
    "You got it!": null,
    "Sounds good!": null,
    "Will do!": null,
    "Of course!": null,
    "Yep!": null,
    "Cool!": null,
    "Awesome!": null,
    "Nice!": null,

    // Quick responses
    "Just a sec...": null,
    "One moment...": null,
    "Give me a second...": null,
    "Let me check...": null,
    "Looking that up...": null,
    "Checking now...": null,

    // Errors (also common)
    "Sorry, I didn't catch that.": null,
    "Could you repeat that?": null,
    "I'm having trouble with that.": null,
    "Something went wrong.": null,

    // Greetings
    "Hey there!": null,
    "What's up?": null,
    "Hello!": null,
    "Hi!": null
};

// Pre-generate instant responses on startup (runs async, doesn't block server start)
async function preGenerateInstantResponses() {
    
    let generated = 0;

    for (const text of Object.keys(INSTANT_RESPONSES)) {
        try {
            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini-tts',
                    input: text,
                    voice: 'nova',  // Warm confident female voice
                    speed: 1.0      // Normal natural speech pace
                })
            });

            if (response.ok) {
                const audioBuffer = Buffer.from(await response.arrayBuffer());
                INSTANT_RESPONSES[text] = audioBuffer;
                const cacheKey = getCacheKey(text, 'echo', 'en-GB');
                cache.set(cacheKey, audioBuffer);
                generated++;
            } else {
                // Log detailed error for non-OK responses
                const errorText = await response.text();
                console.error(`[TTS] Pre-gen failed "${text}": ${response.status} ${response.statusText}`, errorText.substring(0, 200));
            }
        } catch (error) {
            console.error(`[TTS] Exception pre-generating "${text}":`, error.message, error.stack?.substring(0, 200));
        }
    }

    
}

// Start pre-generation (don't await, let it run in background)
if (process.env.OPENAI_API_KEY) {
    setTimeout(() => preGenerateInstantResponses(), 5000); // Wait 5s after server start
}

function getCacheKey(text, voice, language) {
    return crypto.createHash('md5').update(`${text}:${voice}:${language}`).digest('hex');
}

// POST /api/tts/generate - Convert text to speech
router.post('/generate', async (req, res) => {
    const startTime = Date.now();

    try {
        let { text, voice = 'nova', language = 'en-GB', speed = 1.0, model = 'gpt-4o-mini-tts', format = 'binary' } = req.body;

        // Validate text
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ success: false, error: 'Text required' });
        }
        if (text.length > 4000) {
            return res.status(400).json({ success: false, error: 'Text too long (max 4000 chars)' });
        }

        // Validate voice - all 6 OpenAI voices
        const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        let piperVoiceId = null;

        if (voice.startsWith('piper-')) {
            piperVoiceId = voice.substring(6); // Extract the ID after 'piper-'
            // For now, we'll assume any piper- voice is valid if PIPER_TTS_URL is set
        } else if (!validVoices.includes(voice)) {
            return res.status(400).json({ success: false, error: 'Invalid voice' });
        }

        // Validate speed
        if (speed < 0.25 || speed > 4.0) {
            return res.status(400).json({ success: false, error: 'Speed must be 0.25-4.0' });
        }

        // Validate language - all 37 supported languages
        const validLanguages = [
            // Core 11 languages (full i18n support)
            'en', 'en-GB', 'en-US', 'es', 'fr', 'de', 'it',
            'pt', 'nl', 'pl', 'ru', 'ja', 'zh',
            // Additional 26 languages (voice support)
            'ar', 'cs', 'da', 'el', 'fi', 'he', 'hi', 'hu',
            'id', 'ko', 'ms', 'no', 'ro', 'sk', 'sv', 'th',
            'tr', 'uk', 'vi', 'ca', 'hr',
            // English variants
            'en-AU', 'en-IN', 'en-IE', 'en-ZA',
            // Portuguese variant
            'pt-BR'
        ];
        if (!validLanguages.includes(language)) {
            console.warn(`[TTS] Invalid language requested: ${language}`);
            return res.status(400).json({ success: false, error: `Invalid language: ${language}. Supported: ${validLanguages.join(', ')}` });
        }

        // Allow Piper TTS without OpenAI API key
        if (!process.env.OPENAI_API_KEY && !piperVoiceId) {
            console.error('[TTS] No API key and not using Piper');
            return res.status(503).json({ success: false, error: 'Service unavailable' });
        }

        text = text.trim().substring(0, 4000);
        

        // INSTANT RESPONSE: Check if this is a pre-generated response (<50ms)
        if (INSTANT_RESPONSES[text] && voice === 'nova') {
            const cached = INSTANT_RESPONSES[text];
            
            if (format === 'base64') {
                return res.json({ success: true, audio: cached.toString('base64'), contentType: 'audio/mpeg', cache: 'INSTANT' });
            }
            res.set({
                'Content-Type': 'audio/mpeg',
                'X-Cache': 'INSTANT',
                'X-Voice': voice,
                'X-Language': language,
                'Cache-Control': 'public, max-age=86400' // 24 hour cache
            });
            return res.send(cached);
        }

        // Check cache
        const cacheKey = getCacheKey(text, voice, language);
        if (cache.has(cacheKey)) {
            const cached = cache.get(cacheKey);
            
            if (format === 'base64') {
                return res.json({ success: true, audio: cached.toString('base64'), contentType: 'audio/mpeg', cache: 'HIT' });
            }
            res.set({
                'Content-Type': 'audio/mpeg',
                'X-Cache': 'HIT',
                'X-Voice': voice,
                'X-Language': language,
                'Cache-Control': 'public, max-age=3600'
            });
            return res.send(cached);
        }

                // LOCAL PIPER TTS: Use local sherpa-onnx if available
        if (piperVoiceId && piperLocal) {
            console.log(`[TTS] Using LOCAL Piper TTS for voice: ${piperVoiceId}`);
            try {
                const audioBuffer = piperLocal.synthesizeToWav(text, speed);
                const time = Date.now() - startTime;
                console.log(`[TTS] Local Piper generated ${audioBuffer.length} bytes in ${time}ms`);

                // Cache it
                if (cache.size > 500) {
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }
                cache.set(cacheKey, audioBuffer);

                if (format === 'base64') {
                    return res.json({
                        success: true,
                        audio: audioBuffer.toString('base64'),
                        contentType: 'audio/wav',
                        cache: 'MISS',
                        engine: 'PiperLocal',
                        generationTime: time
                    });
                } else {
                    res.set({
                        'Content-Type': 'audio/wav',
                        'X-Cache': 'MISS',
                        'X-Voice': voice,
                        'X-Language': language,
                        'X-TTS-Engine': 'PiperLocal',
                        'X-Generation-Time': `${time}ms`,
                        'Cache-Control': 'public, max-age=3600'
                    });
                    return res.send(audioBuffer);
                }
            } catch (error) {
                console.error('[TTS] Local Piper failed:', error.message);
                // Fall through to OpenAI
            }
        }

        // REMOTE PIPER TTS: Fallback to external service if configured
        if (piperVoiceId && process.env.PIPER_TTS_URL) {
            console.log(`[TTS] Using remote Piper TTS for voice: ${piperVoiceId}`);
            try {
                const piperResponse = await fetch(`${process.env.PIPER_TTS_URL}/synthesize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, language_code: language })
                });

                if (!piperResponse.ok) {
                    const errorText = await piperResponse.text();
                    console.error('[TTS] Piper API error:', piperResponse.status, errorText);
                    return res.status(502).json({
                        success: false,
                        error: 'Piper TTS failed',
                        status: piperResponse.status,
                        message: errorText
                    });
                }

                const audioBuffer = Buffer.from(await piperResponse.arrayBuffer());

                if (cache.size > 500) {
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }
                cache.set(cacheKey, audioBuffer);

                if (format === 'base64') {
                    return res.json({
                        success: true,
                        audio: audioBuffer.toString('base64'),
                        contentType: 'audio/wav',
                        cache: 'MISS',
                        engine: 'PiperRemote'
                    });
                } else {
                    res.set({
                        'Content-Type': 'audio/wav',
                        'X-Cache': 'MISS',
                        'X-Voice': voice,
                        'X-TTS-Engine': 'PiperRemote',
                        'Cache-Control': 'public, max-age=3600'
                    });
                    return res.send(audioBuffer);
                }
            } catch (error) {
                console.error('[TTS] Remote Piper failed:', error.message);
                return res.status(500).json({
                    success: false,
                    error: 'Piper TTS service error',
                    message: error.message
                });
            }
        }
        
                // Call OpenAI - Note: OpenAI TTS doesn't have explicit language param
                // It infers from the input text. We track language for caching/logging.
                const response = await fetch('https://api.openai.com/v1/audio/speech', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        input: text,
                        voice,
                        speed
                    })
                });
        if (!response.ok) {
            const error = await response.text();
            console.error('[TTS] API error:', response.status, error);
            return res.status(502).json({ 
                success: false, 
                error: 'TTS failed',
                status: response.status 
            });
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());
        const time = Date.now() - startTime;

        // Cache it (limit cache size to 500 entries - increased for better hit rate)
        if (cache.size > 500) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        cache.set(cacheKey, audioBuffer);

        

        // Return base64 for iOS compatibility, binary otherwise
        if (format === 'base64') {
            res.json({
                success: true,
                audio: audioBuffer.toString('base64'),
                contentType: 'audio/mpeg',
                cache: 'MISS'
            });
        } else {
            res.set({
                'Content-Type': 'audio/mpeg',
                'X-Cache': 'MISS',
                'X-Voice': voice,
                'X-Language': language,
                'Cache-Control': 'public, max-age=3600'
            });
            res.send(audioBuffer);
        }

    } catch (error) {
        console.error('[TTS] Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'TTS failed',
            message: error.message 
        });
    }
});

// GET /api/tts/voices - Get available voices
router.get('/voices', (req, res) => {
    const voices = [
        { id: 'alloy', name: 'Alloy', description: 'Neutral balanced', engine: 'OpenAI' },
        { id: 'echo', name: 'Echo', description: 'British butler (default)', engine: 'OpenAI' },
        { id: 'fable', name: 'Fable', description: 'British storyteller', engine: 'OpenAI' },
        { id: 'onyx', name: 'Onyx', description: 'Deep professional', engine: 'OpenAI' },
        { id: 'nova', name: 'Nova', description: 'Warm friendly', engine: 'OpenAI' },
        { id: 'shimmer', name: 'Shimmer', description: 'Gentle guide', engine: 'OpenAI' }
    ];

    // Add local Piper voice if available
    if (piperLocal) {
        voices.push({ id: 'piper-lessac', name: 'Lessac', description: 'Local TTS (no API cost)', engine: 'PiperLocal' });
    }

    res.json({ success: true, voices });
});

// GET /api/tts/languages - Get available languages
router.get('/languages', (req, res) => {
    res.json({
        success: true,
        languages: [
            { code: 'en-GB', name: 'British English', flag: '🇬🇧', default: true },
            { code: 'en-US', name: 'American English', flag: '🇺🇸' },
            { code: 'es', name: 'Spanish', flag: '🇪🇸' },
            { code: 'fr', name: 'French', flag: '🇫🇷' },
            { code: 'de', name: 'German', flag: '🇩🇪' },
            { code: 'it', name: 'Italian', flag: '🇮🇹' },
            { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
            { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
            { code: 'pl', name: 'Polish', flag: '🇵🇱' },
            { code: 'ru', name: 'Russian', flag: '🇷🇺' },
            { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
            { code: 'zh', name: 'Chinese', flag: '🇨🇳' }
        ]
    });
});

// GET /api/tts/status - Check if service is working
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: process.env.OPENAI_API_KEY ? 'operational' : 'unavailable',
        hasApiKey: !!process.env.OPENAI_API_KEY,
        cacheSize: cache.size,
        model: 'gpt-4o-mini-tts',
        voices: 11,
        languages: 50,
        defaultVoice: 'echo',
        defaultLanguage: 'en-GB'
    });
});

module.exports = router;
