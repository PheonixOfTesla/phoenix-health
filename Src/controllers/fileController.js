// Src/controllers/fileController.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Ensure uploads directory exists
const ensureUploadDir = () => {
  const userDir = path.join(UPLOAD_DIR, 'users');
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
};

/**
 * POST /api/files/upload
 * Upload a file - multipart/form-data with file
 */
exports.uploadFile = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    // Validate file size
    if (req.file.size > MAX_FILE_SIZE) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(413).json({
        success: false,
        error: `File size exceeds 50MB limit. Uploaded: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Generate unique file ID
    const fileId = uuidv4();
    const userId = req.user.id;

    // Create user directory if needed
    const userDir = path.join(UPLOAD_DIR, 'users', userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate storage path (relative to uploads directory)
    const storagePath = `users/${userId}/${fileId}_${req.file.originalname}`;
    const fullPath = path.join(UPLOAD_DIR, storagePath);

    // Move file to final location
    fs.renameSync(req.file.path, fullPath);

    // Save file metadata to database
    const fileDoc = new File({
      fileId,
      userId,
      filename: `${fileId}_${req.file.originalname}`,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath,
      storageType: 'local'
    });

    await fileDoc.save();

    res.status(201).json({
      success: true,
      fileId,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      url: `/api/files/${fileId}`,
      uploadedAt: fileDoc.uploadedAt
    });
  } catch (error) {
    console.error('File upload error:', error);

    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to cleanup file:', e);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error.message
    });
  }
};

/**
 * GET /api/files/:fileId
 * Download file with proper Content-Type header and streaming
 */
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Find file in database
    const fileDoc = await File.findOne({ fileId });

    if (!fileDoc) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Security: Ensure user can only access their own files
    if (fileDoc.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this file'
      });
    }

    // Construct full file path
    const filePath = path.join(UPLOAD_DIR, fileDoc.storagePath);

    // Security: Prevent directory traversal
    const realPath = path.resolve(filePath);
    if (!realPath.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(403).json({
        success: false,
        error: 'Invalid file path'
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on storage'
      });
    }

    // Get file size for Content-Length header
    const stats = fs.statSync(filePath);

    // Set response headers
    res.setHeader('Content-Type', fileDoc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);

    // Use inline for PDFs and images so they can be previewed, attachment for others
    const isPreviewable = fileDoc.mimeType?.startsWith('image/') ||
                         fileDoc.mimeType === 'application/pdf' ||
                         fileDoc.mimeType?.startsWith('text/');
    const disposition = isPreviewable ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${fileDoc.originalFilename}"`);

    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stream file'
      });
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      message: error.message
    });
  }
};

/**
 * GET /api/files/:fileId/info
 * Get file metadata without downloading
 */
exports.getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileDoc = await File.findOne({ fileId });

    if (!fileDoc) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Security: Ensure user can only access their own files
    if (fileDoc.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this file'
      });
    }

    res.json({
      success: true,
      fileId: fileDoc.fileId,
      filename: fileDoc.originalFilename,
      mimeType: fileDoc.mimeType,
      size: fileDoc.size,
      uploadedAt: fileDoc.uploadedAt,
      url: `/api/files/${fileDoc.fileId}`
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file info',
      message: error.message
    });
  }
};

/**
 * GET /api/files
 * List all files for current user
 */
exports.listFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    const files = await File.find({ userId })
      .select('fileId originalFilename mimeType size uploadedAt')
      .sort({ uploadedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await File.countDocuments({ userId });

    res.json({
      success: true,
      files: files.map(f => ({
        fileId: f.fileId,
        filename: f.originalFilename,
        mimeType: f.mimeType,
        size: f.size,
        uploadedAt: f.uploadedAt,
        url: `/api/files/${f.fileId}`
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files',
      message: error.message
    });
  }
};

/**
 * DELETE /api/files/:fileId
 * Delete a file
 */
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileDoc = await File.findOne({ fileId });

    if (!fileDoc) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Security: Ensure user can only delete their own files
    if (fileDoc.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this file'
      });
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, fileDoc.storagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await File.deleteOne({ fileId });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      message: error.message
    });
  }
};

// Initialize upload directory on module load
ensureUploadDir();
