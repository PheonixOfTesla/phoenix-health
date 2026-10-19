// Src/routes/files.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const fileController = require('../controllers/fileController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'temp');

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error('[Files] Failed to create upload directory:', uploadDir, err);
        return cb(err);
      }
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename for reference
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Optional: Add file type restrictions
    // For now, accept all file types
    cb(null, true);
  }
});

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// POST /api/files/upload - Upload a file
router.post('/upload', protect, upload.single('file'), fileController.uploadFile);

// GET /api/files - List all files for current user
router.get('/', protect, fileController.listFiles);

// GET /api/files/:fileId/info - Get file metadata
router.get('/:fileId/info', protect, fileController.getFileInfo);

// GET /api/files/:fileId - Download file with streaming
router.get('/:fileId', protect, fileController.downloadFile);

// DELETE /api/files/:fileId - Delete a file
router.delete('/:fileId', protect, fileController.deleteFile);

// ============================================
// DOCUMENTATION ROUTE
// ============================================
router.get('/docs', (req, res) => {
  res.json({
    message: 'File Upload API Documentation',
    baseUrl: '/api/files',
    endpoints: {
      upload: {
        method: 'POST',
        path: '/api/files/upload',
        authentication: 'Required (Bearer token)',
        contentType: 'multipart/form-data',
        body: {
          file: 'File (required) - The file to upload (max 50MB)'
        },
        response: {
          success: true,
          fileId: 'string - Unique file identifier',
          filename: 'string - Original filename',
          size: 'number - File size in bytes',
          mimeType: 'string - MIME type',
          url: 'string - Endpoint to download file',
          uploadedAt: 'ISO timestamp'
        },
        description: 'Upload a file to storage. Files are stored in user-specific directories.'
      },
      list: {
        method: 'GET',
        path: '/api/files',
        authentication: 'Required (Bearer token)',
        queryParams: {
          limit: 'number (optional, default 50) - Max results per page',
          skip: 'number (optional, default 0) - Pagination offset'
        },
        response: {
          success: true,
          files: [
            {
              fileId: 'string',
              filename: 'string',
              mimeType: 'string',
              size: 'number',
              uploadedAt: 'ISO timestamp',
              url: 'string'
            }
          ],
          pagination: {
            total: 'number',
            limit: 'number',
            skip: 'number',
            hasMore: 'boolean'
          }
        },
        description: 'List all uploaded files for the current user with pagination'
      },
      getInfo: {
        method: 'GET',
        path: '/api/files/:fileId/info',
        authentication: 'Required (Bearer token)',
        response: {
          success: true,
          fileId: 'string',
          filename: 'string',
          mimeType: 'string',
          size: 'number',
          uploadedAt: 'ISO timestamp',
          url: 'string'
        },
        description: 'Get metadata for a specific file without downloading it'
      },
      download: {
        method: 'GET',
        path: '/api/files/:fileId',
        authentication: 'Required (Bearer token)',
        headers: {
          'Content-Type': 'application/octet-stream (varies by file)',
          'Content-Length': 'number - File size in bytes',
          'Content-Disposition': 'attachment; filename="..."'
        },
        description: 'Download a file with streaming. Returns file data with proper MIME type.'
      },
      delete: {
        method: 'DELETE',
        path: '/api/files/:fileId',
        authentication: 'Required (Bearer token)',
        response: {
          success: true,
          message: 'File deleted successfully'
        },
        description: 'Delete a file from storage and database'
      }
    },
    limits: {
      maxFileSize: '50MB',
      fileStorageLocation: 'uploads/users/{userId}'
    },
    notes: {
      security: 'Files are stored in user-specific directories. Users can only access their own files.',
      storage: 'Files are stored on local disk. Implement S3 integration for cloud storage.',
      mimeTypes: 'All file types accepted. Consider adding restrictions as needed.',
      authentication: 'Include JWT token in Authorization header: "Bearer {token}"'
    }
  });
});

module.exports = router;
