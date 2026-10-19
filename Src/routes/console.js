/**
 * CONSOLE ROUTES - Full Terminal Access for Phoenix
 *
 * LOCAL: Unrestricted - Phoenix can do ANYTHING
 * CLOUD: Sandboxed workspace with export capability
 *
 * This is the bridge that makes Phoenix "conscious software"
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const shellExecutor = require('../services/genesis/shellExecutor');

/**
 * GET /api/console/info
 * Get environment information
 */
router.get('/info', protect, async (req, res) => {
  try {
    const info = await shellExecutor.getEnvironmentInfo();
    res.json({
      success: true,
      data: info,
      message: info.mode === 'LOCAL'
        ? 'Full console access enabled'
        : 'Cloud sandbox mode - workspace isolated'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/execute
 * Execute ANY shell command
 *
 * Body: { command: string, cwd?: string, timeout?: number }
 */
router.post('/execute', protect, async (req, res) => {
  try {
    const { command, cwd, timeout } = req.body;

    if (!command) {
      return res.status(400).json({ success: false, error: 'Command is required' });
    }

    console.log(`[CONSOLE] User ${req.user._id} executing: ${command}`);

    const result = await shellExecutor.execute(command, {
      cwd,
      timeout,
      userId: req.user._id.toString()
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/execute-stream
 * Execute command with streaming output (SSE)
 */
router.get('/execute-stream', protect, async (req, res) => {
  const { command, cwd } = req.query;

  if (!command) {
    return res.status(400).json({ success: false, error: 'Command is required' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  console.log(`[CONSOLE STREAM] User ${req.user._id} executing: ${command}`);

  const child = shellExecutor.executeStream(command, {
    cwd,
    onStdout: (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stdout', data })}\n\n`);
    },
    onStderr: (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stderr', data })}\n\n`);
    },
    onClose: (code) => {
      res.write(`data: ${JSON.stringify({ type: 'close', code })}\n\n`);
      res.end();
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    child.kill();
  });
});

/**
 * GET /api/console/history
 * Get command execution history
 */
router.get('/history', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = shellExecutor.getHistory(limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ FILE OPERATIONS ============

/**
 * GET /api/console/files/list
 * List directory contents
 */
router.get('/files/list', protect, async (req, res) => {
  try {
    const { path: dirPath = '.', options = '-la' } = req.query;
    const result = await shellExecutor.fileOps.ls(dirPath, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/files/mkdir
 * Create directory
 */
router.post('/files/mkdir', protect, async (req, res) => {
  try {
    const { path: dirPath } = req.body;
    const result = await shellExecutor.fileOps.mkdir(dirPath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/files/copy
 * Copy file or directory
 */
router.post('/files/copy', protect, async (req, res) => {
  try {
    const { src, dest, recursive = false } = req.body;
    const result = await shellExecutor.fileOps.cp(src, dest, recursive);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/files/move
 * Move or rename file
 */
router.post('/files/move', protect, async (req, res) => {
  try {
    const { src, dest } = req.body;
    const result = await shellExecutor.fileOps.mv(src, dest);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/console/files
 * Delete file or directory
 */
router.delete('/files', protect, async (req, res) => {
  try {
    const { path: targetPath, recursive = false } = req.body;
    const result = await shellExecutor.fileOps.rm(targetPath, recursive);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/console/files/read
 * Read file contents
 */
router.get('/files/read', protect, async (req, res) => {
  try {
    const { path: filePath } = req.query;
    const result = await shellExecutor.fileOps.cat(filePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/files/write
 * Write content to file
 */
router.post('/files/write', protect, async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    const result = await shellExecutor.fileOps.write(filePath, content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/files/find
 * Find files matching pattern
 */
router.post('/files/find', protect, async (req, res) => {
  try {
    const { directory = '.', pattern } = req.body;
    const result = await shellExecutor.fileOps.find(directory, pattern);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ SYSTEM OPERATIONS ============

/**
 * GET /api/console/system/info
 * Get system information
 */
router.get('/system/info', protect, async (req, res) => {
  try {
    const [uname, df, hostname, uptime] = await Promise.all([
      shellExecutor.systemOps.uname(),
      shellExecutor.systemOps.df(),
      shellExecutor.systemOps.hostname(),
      shellExecutor.systemOps.uptime()
    ]);

    res.json({
      success: true,
      data: {
        system: uname.stdout,
        disk: df.stdout,
        hostname: hostname.stdout,
        uptime: uptime.stdout
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/console/system/processes
 * List running processes
 */
router.get('/system/processes', protect, async (req, res) => {
  try {
    const result = await shellExecutor.systemOps.ps();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ GIT OPERATIONS ============

/**
 * POST /api/console/git
 * Git operations
 */
router.post('/git/:operation', protect, async (req, res) => {
  try {
    const { operation } = req.params;
    const { cwd, ...params } = req.body;

    let result;
    switch (operation) {
      case 'status':
        result = await shellExecutor.gitOps.status(cwd);
        break;
      case 'pull':
        result = await shellExecutor.gitOps.pull(cwd);
        break;
      case 'push':
        result = await shellExecutor.gitOps.push(cwd);
        break;
      case 'add':
        result = await shellExecutor.gitOps.add(params.files || '.', cwd);
        break;
      case 'commit':
        result = await shellExecutor.gitOps.commit(params.message, cwd);
        break;
      case 'clone':
        result = await shellExecutor.gitOps.clone(params.repo, params.dest);
        break;
      case 'branch':
        result = await shellExecutor.gitOps.branch(cwd);
        break;
      case 'checkout':
        result = await shellExecutor.gitOps.checkout(params.branch, cwd);
        break;
      case 'log':
        result = await shellExecutor.gitOps.log(params.n || 10, cwd);
        break;
      case 'diff':
        result = await shellExecutor.gitOps.diff(cwd);
        break;
      default:
        return res.status(400).json({ success: false, error: `Unknown git operation: ${operation}` });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ NETWORK OPERATIONS ============

/**
 * POST /api/console/network/curl
 * Make HTTP request via curl
 */
router.post('/network/curl', protect, async (req, res) => {
  try {
    const { url, options = '' } = req.body;
    const result = await shellExecutor.networkOps.curl(url, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/network/download
 * Download file via wget
 */
router.post('/network/download', protect, async (req, res) => {
  try {
    const { url, dest = '.' } = req.body;
    const result = await shellExecutor.networkOps.wget(url, dest);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ PROCESS MANAGEMENT ============

/**
 * POST /api/console/process/kill
 * Kill a process
 */
router.post('/process/kill', protect, async (req, res) => {
  try {
    const { pid, name, signal = 'TERM' } = req.body;

    let result;
    if (pid) {
      result = await shellExecutor.processOps.kill(pid, signal);
    } else if (name) {
      result = await shellExecutor.processOps.killByName(name);
    } else {
      return res.status(400).json({ success: false, error: 'PID or name required' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/process/background
 * Run command in background
 */
router.post('/process/background', protect, async (req, res) => {
  try {
    const { command } = req.body;
    const result = await shellExecutor.processOps.background(command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ macOS DESKTOP CONTROL (Local Only) ============

/**
 * POST /api/console/macos/open-app
 * Open macOS application
 */
router.post('/macos/open-app', protect, async (req, res) => {
  try {
    const { app } = req.body;
    const result = await shellExecutor.macOps.openApp(app);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/macos/open-file
 * Open file with default app
 */
router.post('/macos/open-file', protect, async (req, res) => {
  try {
    const { path: filePath } = req.body;
    const result = await shellExecutor.macOps.openFile(filePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/macos/open-url
 * Open URL in browser
 */
router.post('/macos/open-url', protect, async (req, res) => {
  try {
    const { url } = req.body;
    const result = await shellExecutor.macOps.openUrl(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/macos/screenshot
 * Take screenshot
 */
router.post('/macos/screenshot', protect, async (req, res) => {
  try {
    const { dest = '~/Desktop/phoenix-screenshot.png' } = req.body;
    const result = await shellExecutor.macOps.screenshot(dest);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/macos/applescript
 * Run AppleScript
 */
router.post('/macos/applescript', protect, async (req, res) => {
  try {
    const { script } = req.body;
    const result = await shellExecutor.macOps.osascript(script);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/console/macos/keystroke
 * Simulate keystroke
 */
router.post('/macos/keystroke', protect, async (req, res) => {
  try {
    const { key, modifiers = '' } = req.body;
    const result = await shellExecutor.macOps.keystroke(key, modifiers);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ CLOUD WORKSPACE ============

/**
 * POST /api/console/workspace/export
 * Export workspace as ZIP (cloud mode)
 */
router.post('/workspace/export', protect, async (req, res) => {
  try {
    const { filename = 'export.zip' } = req.body;
    const result = await shellExecutor.cloudOps.export(filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/console/workspace/size
 * Get workspace size
 */
router.get('/workspace/size', protect, async (req, res) => {
  try {
    const result = await shellExecutor.cloudOps.workspaceSize();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/console/workspace/list
 * List workspace contents
 */
router.get('/workspace/list', protect, async (req, res) => {
  try {
    const result = await shellExecutor.cloudOps.listWorkspace();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
