/**
 * KIMI FILE SERVICE - Universal file upload
 * Any file type, up to 100MB, returns reusable file_id
 */

const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');

// Use OpenRouter as unified interface (proxies Moonshot API)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const UP_URL = 'https://openrouter.ai/api/v1/files';
const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

class KimiFileService {

  static isAvailable() {
    // OpenRouter doesn't support /files endpoint (returns 405)
    // Disable native file upload - use text extraction fallback instead
    return false;
  }

  /**
   * Upload any file to Kimi - returns file_id
   */
  static async upload(buffer, filename) {
    if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not set');

    const form = new FormData();
    form.append('file', Readable.from(buffer), filename);

    const { data } = await axios.post(UP_URL, form, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        ...form.getHeaders()
      }
    });

    console.log(`[KimiFile] Uploaded ${filename} -> ${data.id}`);
    return data.id;
  }

  /**
   * Upload multiple files
   */
  static async uploadAll(files) {
    const results = [];
    for (const file of files) {
      try {
        const buffer = Buffer.from(file.data, 'base64');
        const fileId = await this.upload(buffer, file.name);
        results.push({ filename: file.name, fileId });
      } catch (e) {
        console.error(`[KimiFile] Failed ${file.name}:`, e.message);
        results.push({ filename: file.name, error: e.message });
      }
    }
    return results;
  }

  /**
   * Chat with files using file_ids
   */
  static async chat(fileIds, message, systemPrompt, history = []) {
    if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not set');

    // Build user content with text + file references
    const userContent = [{ type: 'text', text: message }];
    fileIds.forEach(id => userContent.push({ type: 'file', file_id: id }));

    // Build messages
    const messages = [{ role: 'system', content: systemPrompt }];
    history.forEach(m => {
      if (m.role && m.content) {
        messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
      }
    });
    messages.push({ role: 'user', content: userContent });

    const { data } = await axios.post(CHAT_URL, {
      model: 'moonshotai/kimi-k2',
      messages,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return data.choices[0].message.content;
  }
}

module.exports = KimiFileService;
