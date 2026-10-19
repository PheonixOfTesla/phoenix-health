/**
 * Local Piper TTS using sherpa-onnx-node
 * Runs entirely on CPU without external API calls
 */
const path = require('path');
const fs = require('fs');

// Paths relative to project root
const VOICES_DIR = path.join(process.cwd(), 'piper-voices');

// Try to load sherpa-onnx-node (may fail if native binaries not available)
let sherpa_onnx = null;

// Only attempt to load if explicitly enabled (prevents Railway crashes)
if (process.env.ENABLE_LOCAL_PIPER === 'true') {
  try {
    sherpa_onnx = require('sherpa-onnx-node');
  } catch (err) {
    console.log('[PiperLocal] sherpa-onnx-node not available:', err.message);
  }
} else {
  console.log('[PiperLocal] disabled via env (ENABLE_LOCAL_PIPER!=true)');
}

// TTS instance (lazy initialized)
let tts = null;
let initError = null;

/**
 * Initialize the TTS engine
 */
function initTTS() {
  if (tts) return tts;
  if (initError) throw initError;

  try {
    // Check if sherpa-onnx is available
    if (!sherpa_onnx) {
      throw new Error('sherpa-onnx-node not loaded');
    }

    const modelDir = path.join(VOICES_DIR, 'vits-piper-en_US-lessac-medium');
    const modelPath = path.join(modelDir, 'en_US-lessac-medium.onnx');
    const tokensPath = path.join(modelDir, 'tokens.txt');
    const dataDir = path.join(modelDir, 'espeak-ng-data');

    // Check if model files exist
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model not found: ${modelPath}`);
    }
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`Tokens not found: ${tokensPath}`);
    }
    if (!fs.existsSync(dataDir)) {
      throw new Error(`espeak-ng-data not found: ${dataDir}`);
    }

    const config = {
      model: {
        vits: {
          model: modelPath,
          tokens: tokensPath,
          dataDir: dataDir,
        },
        debug: false,
        numThreads: 2,
        provider: 'cpu',
      },
      maxNumSentences: 1,
    };

    tts = new sherpa_onnx.OfflineTts(config);
    console.log('[PiperLocal] TTS engine initialized successfully');
    return tts;
  } catch (err) {
    initError = err;
    console.error('[PiperLocal] Failed to initialize TTS:', err.message);
    throw err;
  }
}

/**
 * Synthesize speech from text
 * @param {string} text - Text to synthesize
 * @param {number} speed - Speech speed (default 1.0)
 * @returns {Object} - { samples: Float32Array, sampleRate: number }
 */
function synthesize(text, speed = 1.0) {
  const engine = initTTS();
  const audio = engine.generate({ text, sid: 0, speed });
  return {
    samples: audio.samples,
    sampleRate: audio.sampleRate
  };
}

/**
 * Synthesize and return WAV buffer
 * @param {string} text - Text to synthesize
 * @param {number} speed - Speech speed (default 1.0)
 * @returns {Buffer} - WAV audio buffer
 */
function synthesizeToWav(text, speed = 1.0) {
  const { samples, sampleRate } = synthesize(text, speed);
  return createWavBuffer(samples, sampleRate);
}

/**
 * Create WAV buffer from float samples
 */
function createWavBuffer(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = Math.round(sample * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

/**
 * Check if TTS is available
 */
function isAvailable() {
  try {
    initTTS();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  synthesize,
  synthesizeToWav,
  isAvailable,
};
