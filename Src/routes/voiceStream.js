/**
 * ========================================
 * STREAMING VOICE PROCESSING
 * ========================================
 *
 * Real-time voice pipeline for <3s latency:
 * 1. Receive audio chunks via WebSocket
 * 2. Stream STT transcription
 * 3. Stream LLM tokens as they generate
 * 4. Stream TTS audio chunks
 *
 * Target: User stops talking → audio plays in <2s
 * ========================================
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const geminiService = require('../services/gemini/consciousMind');
const phoenixSocket = require('../services/websocket/phoenixSocket');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-not-configured'
});
const openaiEnabled = !!process.env.OPENAI_API_KEY;

/**
 * STREAMING VOICE PROCESSING ENDPOINT
 * POST /api/voice-stream/process
 *
 * Request body:
 * {
 *   transcript: string,      // Partial or complete transcript
 *   isPartial: boolean,      // Is this a partial transcript?
 *   isComplete: boolean      // Is the user done speaking?
 * }
 */
router.post('/process', protect, async (req, res) => {
  try {
    const { transcript, isPartial = false, isComplete = false } = req.body;
    const userId = req.user.id;

    console.log(`🎤 [VoiceStream] Received: "${transcript}" (partial: ${isPartial}, complete: ${isComplete})`);

    // ⚡ OPTIMIZATION: Start LLM processing on first 3 words (don't wait for complete)
    const wordCount = transcript.trim().split(/\s+/).length;

    if (wordCount >= 3 || isComplete) {
      // Start streaming LLM response
      console.log(`🧠 [VoiceStream] Starting LLM stream for: "${transcript}"`);

      // Set response headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';
      let sentenceBuffer = '';
      let audioSequence = 0;

      try {
        // ⚡ STREAMING LLM: Use Gemini streaming API
        const stream = await geminiService.streamResponse(transcript, userId);

        for await (const chunk of stream) {
          const token = chunk.text();
          fullResponse += token;
          sentenceBuffer += token;

          // Send token to frontend via SSE
          res.write(`data: ${JSON.stringify({
            type: 'llm_token',
            token: token,
            timestamp: Date.now()
          })}\n\n`);

          // ⚡ STREAMING TTS: Generate audio when we have a complete sentence
          if (sentenceBuffer.match(/[.!?]\s*$/)) {
            console.log(`🔊 [VoiceStream] Generating TTS for sentence: "${sentenceBuffer}"`);

            // Generate TTS for this sentence
            const ttsResponse = await openai.audio.speech.create({
              model: 'gpt-4o-mini-tts',
              voice: 'nova',
              input: sentenceBuffer.trim(),
              speed: 1.0
            });

            const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
            const audioBase64 = audioBuffer.toString('base64');

            // Send audio chunk via SSE
            res.write(`data: ${JSON.stringify({
              type: 'audio_chunk',
              sequence: audioSequence++,
              audio: audioBase64,
              format: 'base64',
              timestamp: Date.now()
            })}\n\n`);

            // Also push via WebSocket if available
            if (phoenixSocket.isUserConnected(userId)) {
              phoenixSocket.pushAudioChunk(userId, audioBase64, audioSequence - 1);
            }

            // Clear sentence buffer
            sentenceBuffer = '';
          }
        }

        // Generate TTS for any remaining text
        if (sentenceBuffer.trim().length > 0) {
          console.log(`🔊 [VoiceStream] Generating final TTS: "${sentenceBuffer}"`);

          const ttsResponse = await openai.audio.speech.create({
            model: 'gpt-4o-mini-tts',
            voice: 'nova',
            input: sentenceBuffer.trim(),
            speed: 1.0
          });

          const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
          const audioBase64 = audioBuffer.toString('base64');

          res.write(`data: ${JSON.stringify({
            type: 'audio_chunk',
            sequence: audioSequence++,
            audio: audioBase64,
            format: 'base64',
            timestamp: Date.now()
          })}\n\n`);

          if (phoenixSocket.isUserConnected(userId)) {
            phoenixSocket.pushAudioChunk(userId, audioBase64, audioSequence - 1);
          }
        }

        // Send completion message
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          fullResponse: fullResponse,
          timestamp: Date.now()
        })}\n\n`);

        res.end();

      } catch (error) {
        console.error('❌ [VoiceStream] Streaming error:', error);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.message,
          timestamp: Date.now()
        })}\n\n`);
        res.end();
      }

    } else {
      // Not enough words yet, just acknowledge
      res.json({
        success: true,
        message: 'Waiting for more words...',
        wordCount: wordCount
      });
    }

  } catch (error) {
    console.error('❌ Voice stream error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
