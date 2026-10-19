/**
 * GENESIS FILE SYSTEM MANAGER
 *
 * Purpose: Safe file operations with atomic writes and automatic rollback
 * - Create, modify, delete files safely
 * - Automatic backup before changes
 * - Rollback capability
 * - Diff generation
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../../../.genesis-backups');
const MAX_BACKUPS = 1000;
const BACKUP_RETENTION_DAYS = 30;

// File locks to prevent race conditions
const fileLocks = new Map();

/**
 * Initialize backup directory
 */
const initBackupDir = async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error('[FILE SYSTEM] Backup dir init error:', error);
  }
};

/**
 * Acquire lock on a file
 */
const acquireLock = async (filePath) => {
  const lockKey = path.resolve(filePath);

  while (fileLocks.get(lockKey)) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  fileLocks.set(lockKey, true);
};

/**
 * Release lock on a file
 */
const releaseLock = (filePath) => {
  const lockKey = path.resolve(filePath);
  fileLocks.delete(lockKey);
};

/**
 * Validate file path is within allowed directories
 */
const validatePath = (filePath) => {
  const resolved = path.resolve(filePath);
  const backend = path.resolve(__dirname, '../../../');
  const frontend = path.resolve(__dirname, '../../../../../phoenix-fe');

  if (!resolved.startsWith(backend) && !resolved.startsWith(frontend)) {
    throw new Error(`Path ${filePath} is outside allowed directories`);
  }

  return resolved;
};

/**
 * Create backup of a file
 */
const createBackup = async (filePath) => {
  try {
    await initBackupDir();

    const timestamp = Date.now();
    const hash = crypto.randomBytes(4).toString('hex');
    const basename = path.basename(filePath);
    const backupName = `${timestamp}_${hash}_${basename}.bak`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist, no backup needed
      return null;
    }

    // Copy file to backup
    await fs.copyFile(filePath, backupPath);

    // Create metadata
    const metadataPath = `${backupPath}.meta.json`;
    const metadata = {
      originalPath: filePath,
      backupPath,
      timestamp,
      size: (await fs.stat(filePath)).size
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));


    return backupPath;
  } catch (error) {
    console.error('[FILE SYSTEM] Backup error:', error);
    throw error;
  }
};

/**
 * Restore from backup
 */
const restoreBackup = async (backupPath) => {
  try {
    const metadataPath = `${backupPath}.meta.json`;
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

    await fs.copyFile(backupPath, metadata.originalPath);


    return metadata.originalPath;
  } catch (error) {
    console.error('[FILE SYSTEM] Restore error:', error);
    throw error;
  }
};

/**
 * Write file with automatic backup
 */
const writeFile = async (filePath, content, options = {}) => {
  const { backup = true, atomic = true } = options;

  try {
    const validPath = validatePath(filePath);
    await acquireLock(validPath);

    let backupPath = null;

    if (backup) {
      backupPath = await createBackup(validPath);
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(validPath), { recursive: true });

    if (atomic) {
      // Atomic write: write to temp file, then rename
      const tempPath = `${validPath}.tmp`;
      await fs.writeFile(tempPath, content, 'utf8');
      await fs.rename(tempPath, validPath);
    } else {
      await fs.writeFile(validPath, content, 'utf8');
    }


    return { path: validPath, backupPath };
  } catch (error) {
    console.error('[FILE SYSTEM] Write error:', error);
    throw error;
  } finally {
    releaseLock(filePath);
  }
};

/**
 * Read file
 */
const readFile = async (filePath) => {
  try {
    const validPath = validatePath(filePath);
    return await fs.readFile(validPath, 'utf8');
  } catch (error) {
    console.error('[FILE SYSTEM] Read error:', error);
    throw error;
  }
};

/**
 * Delete file with backup
 */
const deleteFile = async (filePath, options = {}) => {
  const { backup = true } = options;

  try {
    const validPath = validatePath(filePath);
    await acquireLock(validPath);

    let backupPath = null;

    if (backup) {
      backupPath = await createBackup(validPath);
    }

    await fs.unlink(validPath);


    return { path: validPath, backupPath };
  } catch (error) {
    console.error('[FILE SYSTEM] Delete error:', error);
    throw error;
  } finally {
    releaseLock(filePath);
  }
};

/**
 * Modify file (read, transform, write)
 */
const modifyFile = async (filePath, transformFn, options = {}) => {
  try {
    const content = await readFile(filePath);
    const newContent = await transformFn(content);
    return await writeFile(filePath, newContent, options);
  } catch (error) {
    console.error('[FILE SYSTEM] Modify error:', error);
    throw error;
  }
};

/**
 * Generate diff between old and new content
 */
const generateDiff = (oldContent, newContent) => {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  let added = 0;
  let removed = 0;
  let modified = 0;

  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === undefined) added++;
    else if (newLine === undefined) removed++;
    else if (oldLine !== newLine) modified++;
  }

  return {
    linesAdded: added,
    linesRemoved: removed,
    linesModified: modified,
    totalLines: newLines.length
  };
};

/**
 * Atomic operation: execute multiple file operations, rollback all on failure
 */
const atomicOperation = async (operations) => {
  const backups = [];
  const completed = [];

  try {
    for (const op of operations) {
      let result;

      if (op.type === 'write') {
        result = await writeFile(op.path, op.content, { backup: true });
      } else if (op.type === 'delete') {
        result = await deleteFile(op.path, { backup: true });
      } else if (op.type === 'modify') {
        result = await modifyFile(op.path, op.transform, { backup: true });
      }

      if (result.backupPath) {
        backups.push(result.backupPath);
      }

      completed.push(result);
    }

    return { success: true, completed, backups };
  } catch (error) {
    // Rollback all operations
    console.error('[FILE SYSTEM] Atomic operation failed, rolling back...');

    for (const backupPath of backups) {
      try {
        await restoreBackup(backupPath);
      } catch (restoreError) {
        console.error('[FILE SYSTEM] Rollback failed:', restoreError);
      }
    }

    throw error;
  }
};

/**
 * List all backups
 */
const listBackups = async (limit = 50) => {
  try {
    await initBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const metaFiles = files.filter(f => f.endsWith('.meta.json'));

    const backups = [];

    for (const metaFile of metaFiles.slice(0, limit)) {
      try {
        const metaPath = path.join(BACKUP_DIR, metaFile);
        const metadata = JSON.parse(await fs.readFile(metaPath, 'utf8'));
        backups.push(metadata);
      } catch (error) {
        // Skip invalid metadata
      }
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[FILE SYSTEM] List backups error:', error);
    return [];
  }
};

/**
 * Clean old backups
 */
const cleanOldBackups = async () => {
  try {
    await initBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const now = Date.now();
    const maxAge = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deleted = 0;

    for (const file of files) {
      if (!file.endsWith('.meta.json')) continue;

      const metaPath = path.join(BACKUP_DIR, file);
      const metadata = JSON.parse(await fs.readFile(metaPath, 'utf8'));

      if (now - metadata.timestamp > maxAge) {
        await fs.unlink(metaPath);
        await fs.unlink(metadata.backupPath);
        deleted++;
      }
    }


    return deleted;
  } catch (error) {
    console.error('[FILE SYSTEM] Clean backups error:', error);
    return 0;
  }
};

/**
 * Check if file exists
 */
const fileExists = async (filePath) => {
  try {
    const validPath = validatePath(filePath);
    await fs.access(validPath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file stats
 */
const getFileStats = async (filePath) => {
  try {
    const validPath = validatePath(filePath);
    const stats = await fs.stat(validPath);
    const content = await fs.readFile(validPath, 'utf8');

    return {
      size: stats.size,
      lines: content.split('\n').length,
      modified: stats.mtime,
      created: stats.birthtime
    };
  } catch (error) {
    console.error('[FILE SYSTEM] Get stats error:', error);
    return null;
  }
};

/**
 * Move/rename a file with backup and validation
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @param {object} options - { backup: true, overwrite: false }
 */
const moveFile = async (srcPath, destPath, options = {}) => {
  const { backup = true, overwrite = false } = options;
  let srcBackup = null;
  let destBackup = null;

  try {
    // Validate both paths
    const validSrc = validatePath(srcPath);
    const validDest = validatePath(destPath);

    // Check source exists
    const srcExists = await fileExists(srcPath);
    if (!srcExists) {
      throw new Error(`Source file does not exist: ${srcPath}`);
    }

    // Check for circular reference (moving into itself)
    if (validDest.startsWith(validSrc + path.sep)) {
      throw new Error('Cannot move a directory into itself');
    }

    // Check destination
    const destExists = await fileExists(destPath);
    if (destExists && !overwrite) {
      throw new Error(`Destination already exists: ${destPath}. Use overwrite: true to replace.`);
    }

    // Acquire locks
    await acquireLock(srcPath);
    await acquireLock(destPath);

    // Create backups
    if (backup) {
      srcBackup = await createBackup(srcPath);
      if (destExists) {
        destBackup = await createBackup(destPath);
      }
    }

    // Ensure destination directory exists
    const destDir = path.dirname(validDest);
    await fs.mkdir(destDir, { recursive: true });

    // Perform the move (rename for same filesystem, copy+delete otherwise)
    try {
      await fs.rename(validSrc, validDest);
    } catch (renameError) {
      // Cross-filesystem move: copy then delete
      if (renameError.code === 'EXDEV') {
        await fs.copyFile(validSrc, validDest);
        await fs.unlink(validSrc);
      } else {
        throw renameError;
      }
    }

    console.log(`[FILE SYSTEM] Moved: ${srcPath} → ${destPath}`);

    return {
      success: true,
      srcPath: validSrc,
      destPath: validDest,
      srcBackup,
      destBackup,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('[FILE SYSTEM] Move file error:', error);
    throw error;
  } finally {
    releaseLock(srcPath);
    releaseLock(destPath);
  }
};

/**
 * Copy a file with backup and validation
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @param {object} options - { backup: true, overwrite: false }
 */
const copyFile = async (srcPath, destPath, options = {}) => {
  const { backup = true, overwrite = false } = options;

  try {
    const validSrc = validatePath(srcPath);
    const validDest = validatePath(destPath);

    // Check source exists
    const srcExists = await fileExists(srcPath);
    if (!srcExists) {
      throw new Error(`Source file does not exist: ${srcPath}`);
    }

    // Check destination
    const destExists = await fileExists(destPath);
    if (destExists && !overwrite) {
      throw new Error(`Destination already exists: ${destPath}. Use overwrite: true to replace.`);
    }

    await acquireLock(destPath);

    // Backup destination if exists
    let destBackup = null;
    if (backup && destExists) {
      destBackup = await createBackup(destPath);
    }

    // Ensure destination directory exists
    const destDir = path.dirname(validDest);
    await fs.mkdir(destDir, { recursive: true });

    // Copy the file
    await fs.copyFile(validSrc, validDest);

    console.log(`[FILE SYSTEM] Copied: ${srcPath} → ${destPath}`);

    return {
      success: true,
      srcPath: validSrc,
      destPath: validDest,
      destBackup,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('[FILE SYSTEM] Copy file error:', error);
    throw error;
  } finally {
    releaseLock(destPath);
  }
};

module.exports = {
  writeFile,
  readFile,
  deleteFile,
  modifyFile,
  moveFile,
  copyFile,
  createBackup,
  restoreBackup,
  generateDiff,
  atomicOperation,
  listBackups,
  cleanOldBackups,
  fileExists,
  getFileStats,
  validatePath
};
