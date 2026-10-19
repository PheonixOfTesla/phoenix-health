/**
 * GENESIS GIT MANAGER
 *
 * Purpose: Local git operations using simple-git
 * - Commit, push, pull, branch management
 * - Auto-generated commit messages
 * - Works with both pal-backend and phoenix-fe repos
 */

const simpleGit = require('simple-git');
const path = require('path');

const BACKEND_PATH = '.';
const FRONTEND_PATH = '/Users/pheonix/Desktop/phoenix-fe';

/**
 * Get git instance for a repo
 */
const getGit = (repo) => {
  const repoPath = repo === 'backend' ? BACKEND_PATH : FRONTEND_PATH;
  return simpleGit(repoPath);
};

/**
 * Get current git status
 */
const getStatus = async (repo = 'backend') => {
  try {
    const git = getGit(repo);
    const status = await git.status();

    return {
      repo,
      modified: status.modified,
      created: status.created,
      deleted: status.deleted,
      staged: status.staged,
      ahead: status.ahead,
      behind: status.behind,
      current: status.current
    };
  } catch (error) {
    console.error('[GIT MANAGER] Status error:', error);
    throw error;
  }
};

/**
 * Commit changes
 */
const commit = async (repo, message, files = []) => {
  try {
    const git = getGit(repo);

    // Add files (or all if not specified)
    if (files.length > 0) {
      await git.add(files);
    } else {
      await git.add('.');
    }

    // Commit
    const result = await git.commit(message);

    return {
      repo,
      commit: result.commit,
      summary: result.summary
    };
  } catch (error) {
    console.error('[GIT MANAGER] Commit error:', error);
    throw error;
  }
};

/**
 * Push to remote
 */
const push = async (repo, branch = 'main') => {
  try {
    const git = getGit(repo);
    await git.push('origin', branch);

    return { repo, branch, success: true };
  } catch (error) {
    console.error('[GIT MANAGER] Push error:', error);
    throw error;
  }
};

/**
 * Pull from remote
 */
const pull = async (repo, branch = 'main') => {
  try {
    const git = getGit(repo);
    const result = await git.pull('origin', branch);

    return { repo, branch, files: result.files, summary: result.summary };
  } catch (error) {
    console.error('[GIT MANAGER] Pull error:', error);
    throw error;
  }
};

/**
 * Get commit history
 */
const getHistory = async (repo, limit = 10) => {
  try {
    const git = getGit(repo);
    const log = await git.log({ maxCount: limit });

    return {
      repo,
      commits: log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: commit.date
      }))
    };
  } catch (error) {
    console.error('[GIT MANAGER] History error:', error);
    throw error;
  }
};

/**
 * Get diff
 */
const getDiff = async (repo) => {
  try {
    const git = getGit(repo);
    const diff = await git.diff();

    return { repo, diff };
  } catch (error) {
    console.error('[GIT MANAGER] Diff error:', error);
    throw error;
  }
};

/**
 * Auto-generate commit message from operation context
 */
const generateCommitMessage = (operation) => {
  const { operationType, filesChanged = [] } = operation;

  let message = '⚡ Genesis Autonomous Operation\n\n';

  if (operationType === 'code_generation') {
    message += `GENERATED: ${filesChanged.length} new files\n`;
  } else if (operationType === 'optimization') {
    message += `OPTIMIZED: ${filesChanged.length} files\n`;
  } else if (operationType === 'file_modification') {
    message += `MODIFIED: ${filesChanged.length} files\n`;
  }

  message += '\nFILES:\n';
  filesChanged.slice(0, 10).forEach(file => {
    message += `- ${file.action.toUpperCase()}: ${path.basename(file.path)}\n`;
  });

  if (filesChanged.length > 10) {
    message += `... and ${filesChanged.length - 10} more files\n`;
  }

  message += '\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\n';
  message += 'Co-Authored-By: Claude <noreply@anthropic.com>';

  return message;
};

module.exports = {
  getStatus,
  commit,
  push,
  pull,
  getHistory,
  getDiff,
  generateCommitMessage
};
