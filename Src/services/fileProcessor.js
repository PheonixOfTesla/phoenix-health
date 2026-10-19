/**
 * UNIVERSAL FILE PROCESSOR
 * Reads ANY file type and converts to Claude-readable format
 * Like Claude Code - accepts everything, converts what's needed
 */

let pdfParse;
let mammoth;
let XLSX;
let sharp;
let heicConvert;

// Lazy load libraries to prevent startup crashes
const getPdfParse = () => {
  if (!pdfParse) {
    try { pdfParse = require('pdf-parse'); } catch (e) { console.log('pdf-parse not available:', e.message); }
  }
  return pdfParse;
};

const getMammoth = () => {
  if (!mammoth) {
    try { mammoth = require('mammoth'); } catch (e) { console.log('mammoth not available'); }
  }
  return mammoth;
};

const getXLSX = () => {
  if (!XLSX) {
    try { XLSX = require('xlsx'); } catch (e) { console.log('xlsx not available'); }
  }
  return XLSX;
};

const getSharp = () => {
  if (!sharp) {
    try { sharp = require('sharp'); } catch (e) { console.log('sharp not available'); }
  }
  return sharp;
};

const getHeicConvert = () => {
  if (!heicConvert) {
    try { heicConvert = require('heic-convert'); } catch (e) { console.log('heic-convert not available'); }
  }
  return heicConvert;
};

class FileProcessor {

  /**
   * Process any file and return content Claude can understand
   * @param {Object} file - { name, type, data (base64) }
   * @returns {Object} - { type: 'text'|'image', content, metadata }
   */
  static async process(file) {
    const { name, type, data } = file;

    // Validate we have data
    if (!data || data.length === 0) {
      console.error(`[FileProcessor] Empty data for file: ${name}`);
      return {
        type: 'text',
        content: `[File: ${name}]\nNo file data received. Please try uploading again.`,
        metadata: { filename: name, error: 'Empty data' }
      };
    }

    const buffer = Buffer.from(data, 'base64');
    const ext = name ? name.split('.').pop().toLowerCase() : '';

    console.log(`[FileProcessor] Processing: ${name} (type: ${type}, ext: ${ext}, buffer: ${buffer.length} bytes, base64: ${data.length} chars)`);

    // Detect file type from magic bytes if MIME type is generic/missing
    let detectedType = type || '';
    if (!type || type === 'application/octet-stream') {
      const signature = buffer.slice(0, 4).toString('hex').toUpperCase();
      console.log(`[FileProcessor] Checking magic bytes for ${name}: ${signature}`);

      // ZIP signature (covers .docx, .xlsx, .pptx, .zip)
      if (signature.startsWith('504B')) {
        // Check if it's an Office document by looking for specific markers
        const bufferStr = buffer.toString('utf8', 0, Math.min(buffer.length, 2000));
        if (bufferStr.includes('word/') || ext === 'docx' || ext === 'doc') {
          detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          console.log(`[FileProcessor] Detected .docx from ZIP signature for ${name}`);
        } else if (bufferStr.includes('xl/') || ext === 'xlsx' || ext === 'xls') {
          detectedType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          console.log(`[FileProcessor] Detected .xlsx from ZIP signature for ${name}`);
        }
      }
      // PDF signature
      else if (signature.startsWith('2550')) {
        detectedType = 'application/pdf';
        console.log(`[FileProcessor] Detected PDF from signature for ${name}`);
      }
    }

    try {
      // IMAGES - convert if needed, pass to Claude vision
      if (detectedType.startsWith('image/') || this.isImageExt(ext)) {
        return await this.processImage(buffer, name, detectedType, ext);
      }

      // PDF - extract text
      if (detectedType === 'application/pdf' || detectedType.includes('pdf') || ext === 'pdf') {
        return await this.processPDF(buffer, name);
      }

      // Word documents (.docx, .doc)
      // .docx MIME: application/vnd.openxmlformats-officedocument.wordprocessingml.document
      // .doc MIME: application/msword
      if (detectedType.includes('wordprocessingml') || detectedType.includes('msword') || ext === 'docx' || ext === 'doc') {
        console.log(`[FileProcessor] Routing to Word processor: ${name} (detectedType: ${detectedType}, ext: ${ext})`);
        return await this.processWord(buffer, name);
      }

      // Excel/CSV
      if (detectedType.includes('spreadsheet') || ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        return await this.processSpreadsheet(buffer, name, ext);
      }

      // Plain text, code, JSON, markdown, etc.
      if (this.isTextFile(detectedType, ext)) {
        return this.processText(buffer, name);
      }

      // Unknown - try as text, fallback to metadata only
      return this.processUnknown(buffer, name, type);

    } catch (error) {
      console.error(`[FileProcessor] Error processing ${name}:`, error.message);
      return {
        type: 'text',
        content: `[File: ${name}]\nCould not fully read this file. Type: ${type}\nError: ${error.message}`,
        metadata: { filename: name, error: error.message }
      };
    }
  }

  /**
   * Check if extension is an image
   */
  static isImageExt(ext) {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'tiff', 'tif', 'bmp', 'ico', 'svg', 'avif'].includes(ext);
  }

  /**
   * Process images - convert HEIC/TIFF/BMP to JPEG for Claude
   */
  static async processImage(buffer, filename, type, ext) {
    // Formats Claude accepts directly
    const directFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    // If Claude can read it directly, pass through
    if (directFormats.includes(type)) {
      return {
        type: 'image',
        media_type: type,
        data: buffer.toString('base64'),
        metadata: { filename, size: buffer.length }
      };
    }

    // HEIC conversion (iPhone photos)
    if (ext === 'heic' || ext === 'heif' || type.includes('heic') || type.includes('heif')) {
      try {
        const convert = getHeicConvert();
        if (convert) {
          const jpegBuffer = await convert({
            buffer: buffer,
            format: 'JPEG',
            quality: 0.9
          });
          console.log(`[FileProcessor] Converted HEIC to JPEG: ${filename}`);
          return {
            type: 'image',
            media_type: 'image/jpeg',
            data: Buffer.from(jpegBuffer).toString('base64'),
            metadata: { filename, converted: 'heic→jpeg', size: jpegBuffer.length }
          };
        }
      } catch (e) {
        console.error(`[FileProcessor] HEIC conversion failed:`, e.message);
      }
    }

    // Use sharp for other conversions (TIFF, BMP, etc.)
    const sharpLib = getSharp();
    if (sharpLib) {
      try {
        const jpegBuffer = await sharpLib(buffer)
          .jpeg({ quality: 90 })
          .toBuffer();
        console.log(`[FileProcessor] Converted ${ext} to JPEG: ${filename}`);
        return {
          type: 'image',
          media_type: 'image/jpeg',
          data: jpegBuffer.toString('base64'),
          metadata: { filename, converted: `${ext}→jpeg`, size: jpegBuffer.length }
        };
      } catch (e) {
        console.error(`[FileProcessor] Image conversion failed:`, e.message);
      }
    }

    // Fallback - try passing as-is, Claude might handle it
    return {
      type: 'image',
      media_type: type || 'image/jpeg',
      data: buffer.toString('base64'),
      metadata: { filename, size: buffer.length, warning: 'unconverted' }
    };
  }

  /**
   * Process PDF files - extract text
   */
  static async processPDF(buffer, filename) {
    console.log(`[FileProcessor] Processing PDF: ${filename} (${buffer.length} bytes)`);

    const pdfParser = getPdfParse();
    if (!pdfParser) {
      console.error(`[FileProcessor] pdf-parse not available for ${filename}`);
      return {
        type: 'text',
        content: `[PDF: ${filename}]\nPDF parsing unavailable. Try converting to text or taking a screenshot.`,
        metadata: { filename, error: 'pdf-parse not available' }
      };
    }

    try {
      const data = await pdfParser(buffer);
      const text = (data.text || '').trim();

      if (!text || text.length < 10) {
        console.warn(`[FileProcessor] PDF ${filename} has minimal text (${text.length} chars)`);
        return {
          type: 'text',
          content: `[PDF: ${filename}]\nThis PDF appears to be image-based or empty. Text extraction found: "${text.substring(0, 100)}"`,
          metadata: { filename, charCount: text.length, warning: 'minimal text' }
        };
      }

      console.log(`[FileProcessor] Extracted ${text.length} chars from PDF: ${filename}`);
      return {
        type: 'text',
        content: `[PDF: ${filename}]\n\n${text.substring(0, 50000)}${text.length > 50000 ? '\n\n[...truncated]' : ''}`,
        metadata: { filename, charCount: text.length, pages: data.numpages }
      };
    } catch (error) {
      console.error(`[FileProcessor] PDF parse failed for ${filename}:`, error.message);
      return {
        type: 'text',
        content: `[PDF: ${filename}]\nFailed to extract text: ${error.message}`,
        metadata: { filename, error: error.message }
      };
    }
  }

  /**
   * Process Word documents (.docx, .doc)
   */
  static async processWord(buffer, filename) {
    console.log(`[FileProcessor] Processing Word doc: ${filename} (${buffer.length} bytes)`);

    // Check mammoth availability first
    const docParser = getMammoth();
    if (!docParser) {
      console.error(`[FileProcessor] Mammoth library not available for ${filename}`);
      return {
        type: 'text',
        content: `[Word Document: ${filename}]\nWord document processing is currently unavailable. Please try:\n- Copy and paste the text directly\n- Save as PDF and upload that instead\n- Take a screenshot of the content`,
        metadata: { filename, error: 'mammoth not available', type: 'word' }
      };
    }

    try {
      // Validate buffer looks like a valid docx (starts with PK - zip signature)
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        console.warn(`[FileProcessor] Word file ${filename} doesn't have ZIP header, might be old .doc format`);
      }

      const result = await docParser.extractRawText({ buffer });
      const text = (result.value || '').trim();

      // Log any warnings from mammoth
      if (result.messages && result.messages.length > 0) {
        console.log(`[FileProcessor] Mammoth messages for ${filename}:`, result.messages);
      }

      // Check if we got any content
      if (!text || text.length < 5) {
        console.warn(`[FileProcessor] Word doc ${filename} extracted minimal text: "${text}"`);
        return {
          type: 'text',
          content: `[Word Document: ${filename}]\nThis document appears to be empty or contains only images/formatting.\n\nIf the document has text, try:\n- Copy and paste the text directly\n- Save as PDF and upload that instead`,
          metadata: { filename, charCount: 0, warning: 'No text extracted', type: 'word' }
        };
      }

      console.log(`[FileProcessor] Successfully extracted ${text.length} chars from Word doc: ${filename}`);

      return {
        type: 'text',
        content: `[Word Document: ${filename}]\n\n${text.substring(0, 50000)}${text.length > 50000 ? '\n\n[...truncated]' : ''}`,
        metadata: { filename, charCount: text.length, type: 'word' }
      };
    } catch (error) {
      console.error(`[FileProcessor] Word parse failed for ${filename}:`, error.message);
      return {
        type: 'text',
        content: `[Word Document: ${filename}]\nFailed to read this Word document: ${error.message}\n\nTry:\n- Copy and paste the text directly\n- Save as PDF and upload that instead\n- Make sure the file isn't corrupted`,
        metadata: { filename, error: error.message, type: 'word' }
      };
    }
  }

  /**
   * Process spreadsheets (Excel, CSV)
   */
  static async processSpreadsheet(buffer, filename, ext) {
    try {
      const xlsxLib = getXLSX();
      if (!xlsxLib) throw new Error('Spreadsheet parser not available');
      const workbook = xlsxLib.read(buffer, { type: 'buffer' });
      let content = `[Spreadsheet: ${filename}]\n`;

      workbook.SheetNames.forEach((sheetName, idx) => {
        if (idx > 2) return; // Limit to first 3 sheets
        const sheet = workbook.Sheets[sheetName];
        const csv = xlsxLib.utils.sheet_to_csv(sheet);
        content += `\n--- Sheet: ${sheetName} ---\n${csv.substring(0, 15000)}\n`;
      });

      return {
        type: 'text',
        content: content.substring(0, 50000),
        metadata: { filename, sheets: workbook.SheetNames.length }
      };
    } catch (error) {
      throw new Error(`Spreadsheet parse failed: ${error.message}`);
    }
  }

  /**
   * Process text files
   */
  static processText(buffer, filename) {
    const text = buffer.toString('utf-8');
    return {
      type: 'text',
      content: `[File: ${filename}]\n\n${text.substring(0, 50000)}${text.length > 50000 ? '\n\n[...truncated]' : ''}`,
      metadata: { filename, chars: text.length }
    };
  }

  /**
   * Try to process unknown file types
   */
  static processUnknown(buffer, filename, type) {
    // Try reading as text
    try {
      const text = buffer.toString('utf-8');
      // Check if it looks like text (no null bytes in first 1000 chars)
      const sample = text.substring(0, 1000);
      if (!sample.includes('\x00')) {
        return {
          type: 'text',
          content: `[File: ${filename}]\n\n${text.substring(0, 50000)}`,
          metadata: { filename, detectedAsText: true }
        };
      }
    } catch (e) {}

    // Binary file - just provide metadata
    return {
      type: 'text',
      content: `[Binary File: ${filename}]\nType: ${type}\nSize: ${buffer.length} bytes\n\nThis is a binary file. If it's an image, document, or readable format, try converting it first.`,
      metadata: { filename, binary: true, size: buffer.length }
    };
  }

  /**
   * Check if file is a text-based format
   */
  static isTextFile(mimeType, ext) {
    const textMimes = ['text/', 'application/json', 'application/xml', 'application/javascript'];
    const textExts = ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'css', 'html', 'xml', 'yaml', 'yml', 'sh', 'bash', 'sql', 'csv', 'log', 'env', 'config', 'ini', 'toml'];

    return textMimes.some(m => mimeType.includes(m)) || textExts.includes(ext);
  }

  /**
   * Process multiple files - extract text from all
   */
  static async processAll(files) {
    const results = {
      images: [],
      textContent: [],
      errors: []
    };

    for (const file of files) {
      try {
        const processed = await this.process(file);

        if (processed.type === 'image') {
          results.images.push(processed);
        } else {
          // All other types (PDF, Word, Excel, text) → extracted text
          results.textContent.push(processed.content);
        }
      } catch (error) {
        results.errors.push({ file: file.name, error: error.message });
      }
    }

    return results;
  }
}

module.exports = FileProcessor;
