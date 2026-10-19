/**
 * SHELL EXECUTOR - Full Console Access
 *
 * Gives Phoenix full terminal/console control.
 *
 * LOCAL MODE: Unrestricted - like sitting at the terminal
 * CLOUD MODE: Sandboxed to workspace directory, can export files
 *
 * This is what makes Phoenix "conscious software" -
 * it can do ANYTHING you can do at a terminal.
 */

const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

// Detect environment
const IS_CLOUD = process.env.RAILWAY_ENVIRONMENT || process.env.RENDER || process.env.HEROKU;
const IS_LOCAL = !IS_CLOUD;

// Cloud sandbox directory (Railway provides this)
const CLOUD_WORKSPACE = process.env.RAILWAY_VOLUME_MOUNT_PATH || '/app/workspace';

// Execution history for audit trail
const executionHistory = [];
const MAX_HISTORY = 1000;

/**
 * Execute any shell command
 *
 * @param {string} command - The command to execute
 * @param {object} options - Execution options
 * @returns {Promise<{success: boolean, stdout: string, stderr: string, code: number}>}
 */
const execute = async (command, options = {}) => {
  const {
    cwd = IS_LOCAL ? process.env.HOME : CLOUD_WORKSPACE,
    timeout = 300000, // 5 min default
    shell = true,
    env = process.env,
    userId = 'system'
  } = options;

  const startTime = Date.now();

  // Log execution
  const logEntry = {
    id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    command,
    cwd,
    userId,
    startTime: new Date().toISOString(),
    environment: IS_LOCAL ? 'local' : 'cloud'
  };

  try {
    console.log(`[SHELL] Executing: ${command}`);
    console.log(`[SHELL] CWD: ${cwd}`);
    console.log(`[SHELL] Mode: ${IS_LOCAL ? 'LOCAL (unrestricted)' : 'CLOUD (sandboxed)'}`);

    // Cloud mode: Validate command stays in sandbox
    if (IS_CLOUD) {
      const safeCwd = await ensureCloudSandbox(cwd);
      options.cwd = safeCwd;
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: options.cwd || cwd,
      timeout,
      shell,
      env,
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });

    const duration = Date.now() - startTime;

    // Complete log entry
    logEntry.success = true;
    logEntry.stdout = stdout;
    logEntry.stderr = stderr;
    logEntry.duration = duration;
    logEntry.endTime = new Date().toISOString();

    addToHistory(logEntry);

    console.log(`[SHELL] ✅ Completed in ${duration}ms`);

    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      code: 0,
      duration,
      id: logEntry.id
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    logEntry.success = false;
    logEntry.error = error.message;
    logEntry.code = error.code || 1;
    logEntry.stdout = error.stdout || '';
    logEntry.stderr = error.stderr || '';
    logEntry.duration = duration;
    logEntry.endTime = new Date().toISOString();

    addToHistory(logEntry);

    console.error(`[SHELL] ❌ Failed: ${error.message}`);

    return {
      success: false,
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message,
      code: error.code || 1,
      error: error.message,
      duration,
      id: logEntry.id
    };
  }
};

/**
 * Execute command with streaming output (for long-running processes)
 */
const executeStream = (command, options = {}) => {
  const {
    cwd = IS_LOCAL ? process.env.HOME : CLOUD_WORKSPACE,
    shell = true,
    env = process.env,
    onStdout = () => {},
    onStderr = () => {},
    onClose = () => {}
  } = options;

  console.log(`[SHELL STREAM] Starting: ${command}`);

  const child = spawn(command, [], {
    cwd,
    shell,
    env
  });

  child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[STDOUT] ${output}`);
    onStdout(output);
  });

  child.stderr.on('data', (data) => {
    const output = data.toString();
    console.error(`[STDERR] ${output}`);
    onStderr(output);
  });

  child.on('close', (code) => {
    console.log(`[SHELL STREAM] Process exited with code ${code}`);
    onClose(code);
  });

  return child;
};

/**
 * Ensure cloud commands stay in sandbox
 */
const ensureCloudSandbox = async (requestedCwd) => {
  if (IS_LOCAL) return requestedCwd;

  // Ensure workspace exists
  await fs.mkdir(CLOUD_WORKSPACE, { recursive: true });

  // Resolve and validate path
  const resolved = path.resolve(requestedCwd);

  if (!resolved.startsWith(CLOUD_WORKSPACE) && !resolved.startsWith('/app')) {
    console.warn(`[SHELL] Cloud sandbox: Redirecting ${resolved} to ${CLOUD_WORKSPACE}`);
    return CLOUD_WORKSPACE;
  }

  return resolved;
};

/**
 * File operations - works anywhere in local mode
 */
const fileOps = {
  // List directory contents
  ls: async (dir = '.', options = '') => {
    return execute(`ls ${options} "${dir}"`);
  },

  // Create directory
  mkdir: async (dir) => {
    return execute(`mkdir -p "${dir}"`);
  },

  // Remove file/directory
  rm: async (target, recursive = false) => {
    const flags = recursive ? '-rf' : '-f';
    return execute(`rm ${flags} "${target}"`);
  },

  // Copy file/directory
  cp: async (src, dest, recursive = false) => {
    const flags = recursive ? '-r' : '';
    return execute(`cp ${flags} "${src}" "${dest}"`);
  },

  // Move/rename
  mv: async (src, dest) => {
    return execute(`mv "${src}" "${dest}"`);
  },

  // Find files
  find: async (dir, pattern) => {
    return execute(`find "${dir}" -name "${pattern}"`);
  },

  // Get file info
  stat: async (file) => {
    return execute(`stat "${file}"`);
  },

  // Read file
  cat: async (file) => {
    return execute(`cat "${file}"`);
  },

  // Write to file
  write: async (file, content) => {
    const escaped = content.replace(/'/g, "'\\''");
    return execute(`echo '${escaped}' > "${file}"`);
  },

  // Append to file
  append: async (file, content) => {
    const escaped = content.replace(/'/g, "'\\''");
    return execute(`echo '${escaped}' >> "${file}"`);
  }
};

/**
 * System operations
 */
const systemOps = {
  // Get system info
  uname: async () => execute('uname -a'),

  // Disk usage
  df: async () => execute('df -h'),

  // Memory usage
  free: async () => execute('free -h 2>/dev/null || vm_stat'),

  // Running processes
  ps: async () => execute('ps aux'),

  // Environment variables
  env: async () => execute('env'),

  // Current user
  whoami: async () => execute('whoami'),

  // Hostname
  hostname: async () => execute('hostname'),

  // Current directory
  pwd: async () => execute('pwd'),

  // System uptime
  uptime: async () => execute('uptime')
};

/**
 * Package management (local mode only)
 */
const packageOps = {
  // npm
  npmInstall: async (pkg = '') => {
    if (IS_CLOUD) return { success: false, error: 'Package install disabled in cloud mode' };
    return execute(`npm install ${pkg}`);
  },

  npmRun: async (script) => {
    return execute(`npm run ${script}`);
  },

  // pip (Python)
  pipInstall: async (pkg) => {
    if (IS_CLOUD) return { success: false, error: 'Package install disabled in cloud mode' };
    return execute(`pip install ${pkg}`);
  },

  // brew (macOS)
  brewInstall: async (pkg) => {
    if (IS_CLOUD) return { success: false, error: 'Package install disabled in cloud mode' };
    return execute(`brew install ${pkg}`);
  }
};

/**
 * Git operations
 */
const gitOps = {
  clone: async (repo, dest = '.') => execute(`git clone ${repo} ${dest}`),
  pull: async (cwd) => execute('git pull', { cwd }),
  push: async (cwd) => execute('git push', { cwd }),
  status: async (cwd) => execute('git status', { cwd }),
  add: async (files = '.', cwd) => execute(`git add ${files}`, { cwd }),
  commit: async (message, cwd) => execute(`git commit -m "${message}"`, { cwd }),
  branch: async (cwd) => execute('git branch -a', { cwd }),
  checkout: async (branch, cwd) => execute(`git checkout ${branch}`, { cwd }),
  log: async (n = 10, cwd) => execute(`git log --oneline -n ${n}`, { cwd }),
  diff: async (cwd) => execute('git diff', { cwd })
};

/**
 * Network operations
 */
const networkOps = {
  curl: async (url, options = '') => execute(`curl ${options} "${url}"`),
  wget: async (url, dest = '.') => execute(`wget -P "${dest}" "${url}"`),
  ping: async (host, count = 4) => execute(`ping -c ${count} ${host}`),
  netstat: async () => execute('netstat -an 2>/dev/null || ss -an'),
  ifconfig: async () => execute('ifconfig 2>/dev/null || ip addr')
};

/**
 * Process management
 */
const processOps = {
  // Kill process by PID
  kill: async (pid, signal = 'TERM') => {
    return execute(`kill -${signal} ${pid}`);
  },

  // Kill process by name
  killByName: async (name) => {
    return execute(`pkill -f "${name}"`);
  },

  // List processes by name
  pgrep: async (name) => {
    return execute(`pgrep -fl "${name}"`);
  },

  // Run in background
  background: async (command) => {
    return execute(`nohup ${command} > /dev/null 2>&1 &`);
  }
};

/**
 * macOS specific (Automator bridge for desktop control)
 */
const macOps = {
  // Open application
  openApp: async (appName) => {
    if (!IS_LOCAL) return { success: false, error: 'macOS ops only available locally' };
    return execute(`open -a "${appName}"`);
  },

  // Open file with default app
  openFile: async (filePath) => {
    if (!IS_LOCAL) return { success: false, error: 'macOS ops only available locally' };
    return execute(`open "${filePath}"`);
  },

  // Open URL in browser
  openUrl: async (url) => {
    if (!IS_LOCAL) return { success: false, error: 'macOS ops only available locally' };
    return execute(`open "${url}"`);
  },

  // Run AppleScript
  osascript: async (script) => {
    if (!IS_LOCAL) return { success: false, error: 'macOS ops only available locally' };
    const escaped = script.replace(/"/g, '\\"');
    return execute(`osascript -e "${escaped}"`);
  },

  // Take screenshot
  screenshot: async (dest = '~/Desktop/screenshot.png') => {
    if (!IS_LOCAL) return { success: false, error: 'macOS ops only available locally' };
    return execute(`screencapture -x "${dest}"`);
  },

  // Get frontmost app
  getFrontApp: async () => {
    if (!IS_LOCAL) return { success: false, error: 'macOS ops only available locally' };
    return execute('osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\'');
  },

  // Simulate keystroke
  keystroke: async (key, modifiers = '') => {
    if (!IS_LOCAL) return { success: false, error: 'macOS ops only available locally' };
    const modStr = modifiers ? `using {${modifiers}}` : '';
    return execute(`osascript -e 'tell application "System Events" to keystroke "${key}" ${modStr}'`);
  },

  // Click at position
  click: async (x, y) => {
    if (!IS_LOCAL) return { success: false, error: 'macOS ops only available locally' };
    return execute(`osascript -e 'tell application "System Events" to click at {${x}, ${y}}'`);
  }
};

/**
 * Cloud workspace operations
 */
const cloudOps = {
  // Create export package (zip workspace)
  export: async (filename = 'export.zip') => {
    if (!IS_CLOUD) return { success: false, error: 'Export is for cloud mode' };
    const exportPath = path.join(CLOUD_WORKSPACE, filename);
    return execute(`cd "${CLOUD_WORKSPACE}" && zip -r "${exportPath}" . -x "*.zip"`);
  },

  // Get workspace size
  workspaceSize: async () => {
    const wsPath = IS_CLOUD ? CLOUD_WORKSPACE : process.cwd();
    return execute(`du -sh "${wsPath}"`);
  },

  // List workspace contents
  listWorkspace: async () => {
    const wsPath = IS_CLOUD ? CLOUD_WORKSPACE : process.cwd();
    return execute(`ls -la "${wsPath}"`);
  },

  // Clean workspace (dangerous!)
  cleanWorkspace: async () => {
    if (!IS_CLOUD) return { success: false, error: 'Clean workspace is for cloud mode only' };
    return execute(`rm -rf "${CLOUD_WORKSPACE}"/* "${CLOUD_WORKSPACE}"/.[!.]*`);
  }
};

/**
 * Add to execution history
 */
const addToHistory = (entry) => {
  executionHistory.push(entry);
  if (executionHistory.length > MAX_HISTORY) {
    executionHistory.shift();
  }
};

/**
 * Get execution history
 */
const getHistory = (limit = 50) => {
  return executionHistory.slice(-limit);
};

/**
 * Get environment info
 */
const getEnvironmentInfo = async () => {
  const [uname, whoami, pwd, hostname] = await Promise.all([
    systemOps.uname(),
    systemOps.whoami(),
    systemOps.pwd(),
    systemOps.hostname()
  ]);

  return {
    mode: IS_LOCAL ? 'LOCAL' : 'CLOUD',
    unrestricted: IS_LOCAL,
    workspace: IS_CLOUD ? CLOUD_WORKSPACE : 'Full filesystem access',
    system: uname.stdout,
    user: whoami.stdout,
    cwd: pwd.stdout,
    hostname: hostname.stdout
  };
};

module.exports = {
  // Core execution
  execute,
  executeStream,

  // Operation groups
  fileOps,
  systemOps,
  packageOps,
  gitOps,
  networkOps,
  processOps,
  macOps,
  cloudOps,

  // Utilities
  getHistory,
  getEnvironmentInfo,

  // Constants
  IS_LOCAL,
  IS_CLOUD,
  CLOUD_WORKSPACE
};
