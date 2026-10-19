# Railway Puppeteer Test - Setup and Instructions

## Objective
Test if Puppeteer can launch a Chromium browser on Railway production environment.

## Test Configuration

### Backend Details
- **URL**: https://pal-backend-production.up.railway.app
- **Token**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGUwMGJjYjk3ZTUzMzE0MDJiMzFlYiIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjY3MTk2NzYsImV4cCI6MTc5ODI1NTY3Nn0.o_tUCsh0tOQBk6Dsp34cula07TZXwKaFHQC_3HzQbXU
- **Endpoint**: POST /api/butler/universal

### Test Task
Navigate to https://example.com and take a screenshot

## Railway Configuration Review

### 1. Dockerfile Configuration (CORRECT)
```dockerfile
# Uses node:20-slim as base
# Installs chromium via apt-get
# Sets PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Installs all required dependencies (libgbm1, libnss3, etc.)
```

Location: `/Users/moderndavinci/Desktop/Phoenix/pal-backend/Dockerfile`

**Status**: ✅ Properly configured with all Chromium dependencies

### 2. Railway Build Configuration
Location: `/Users/moderndavinci/Desktop/Phoenix/pal-backend/railway.json`

```json
{
  "build": {
    "builder": "DOCKERFILE"  // ✅ Correctly set to use Dockerfile
  }
}
```

**Status**: ✅ Railway is configured to use the Dockerfile (not Nixpacks)

### 3. Puppeteer Launch Configuration
Location: `/Users/moderndavinci/Desktop/Phoenix/pal-backend/Src/services/butler/universalAgent.js`

The Universal Agent launches Puppeteer with:
- `headless: true`
- `--no-sandbox`
- `--disable-setuid-sandbox`
- `--disable-dev-shm-usage`
- Uses `PUPPETEER_EXECUTABLE_PATH` env var if set

**Status**: ✅ Correct launch arguments for Railway/Docker environment

## Test Files Created

### 1. Node.js Test Script (Recommended)
**File**: `/Users/moderndavinci/Desktop/Phoenix/pal-backend/test-railway-puppeteer-simple.js`

**Run with**:
```bash
cd /Users/moderndavinci/Desktop/Phoenix/pal-backend
node test-railway-puppeteer-simple.js
```

This script will:
- Send POST request to /api/butler/universal
- Parse the response
- Analyze success/failure
- Report detailed results

### 2. Bash/Curl Test Script (Alternative)
**File**: `/Users/moderndavinci/Desktop/Phoenix/pal-backend/test-railway-puppeteer.sh`

**Run with**:
```bash
cd /Users/moderndavinci/Desktop/Phoenix/pal-backend
chmod +x test-railway-puppeteer.sh
./test-railway-puppeteer.sh
```

This script uses curl with verbose output to test the endpoint.

### 3. Advanced Node.js Test (With Fetch)
**File**: `/Users/moderndavinci/Desktop/Phoenix/pal-backend/test-railway-puppeteer.js`

Uses modern fetch API (requires Node 18+).

## How to Run the Test

### Option 1: Node.js Script (Simplest)
```bash
cd /Users/moderndavinci/Desktop/Phoenix/pal-backend
node test-railway-puppeteer-simple.js
```

### Option 2: Bash Script with Curl
```bash
cd /Users/moderndavinci/Desktop/Phoenix/pal-backend
chmod +x test-railway-puppeteer.sh
./test-railway-puppeteer.sh
```

### Option 3: Direct Curl Command
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/butler/universal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGUwMGJjYjk3ZTUzMzE0MDJiMzFlYiIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjY3MTk2NzYsImV4cCI6MTc5ODI1NTY3Nn0.o_tUCsh0tOQBk6Dsp34cula07TZXwKaFHQC_3HzQbXU" \
  -d '{"task": "Navigate to https://example.com and take a screenshot", "confirmed": true}' \
  -v
```

## Expected Results

### SUCCESS (Puppeteer works)
```json
{
  "success": true,
  "message": "Task completed successfully",
  "sessionId": "universal_1234567890_abc123",
  "executionTime": 5000,
  "steps": 2,
  "finalScreenshot": "data:image/png;base64,iVBORw0KG...",
  "finalUrl": "https://example.com",
  "learned": false
}
```

**Key Indicators**:
- ✅ `success: true`
- ✅ `finalScreenshot` contains base64 image data
- ✅ No browser launch errors

### FAILURE (Puppeteer cannot launch)
```json
{
  "success": false,
  "message": "Failed to execute task",
  "error": "Failed to launch the browser process! ... Could not find Chrome ..."
}
```

**Key Indicators**:
- ❌ `success: false`
- ❌ Error message contains "launch", "Chrome", "browser", or "Chromium"
- ❌ No screenshot data

## Troubleshooting

### If Browser Launch Fails

1. **Check Railway Logs**
   ```bash
   # In Railway dashboard, check deployment logs for:
   # - "chromium: not found"
   # - "Failed to launch"
   # - Missing dependency errors
   ```

2. **Verify Chromium Installation**
   SSH into Railway container and run:
   ```bash
   which chromium
   ls -la /usr/bin/chromium
   chromium --version
   ```

3. **Check Environment Variables**
   Verify in Railway dashboard:
   - `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`

4. **Verify Dockerfile Build**
   Check Railway build logs to ensure:
   - Dockerfile was used (not Nixpacks)
   - `apt-get install chromium` succeeded
   - All dependencies installed successfully

### Common Issues

#### Issue 1: Railway using Nixpacks instead of Dockerfile
**Solution**: railway.json should have `"builder": "DOCKERFILE"`

#### Issue 2: Missing dependencies
**Solution**: Dockerfile includes all required libs (libgbm1, libnss3, etc.)

#### Issue 3: Token expired
**Error**: HTTP 401 Unauthorized
**Solution**: Get a new token by logging in

#### Issue 4: Backend not running
**Error**: Connection refused or timeout
**Solution**: Check Railway service status

## Code Flow Analysis

When you call `/api/butler/universal`:

1. **Route**: `/Users/moderndavinci/Desktop/Phoenix/pal-backend/Src/routes/butler.js:189`
   - `POST /api/butler/universal` → `butlerController.executeUniversal`

2. **Controller**: `/Users/moderndavinci/Desktop/Phoenix/pal-backend/Src/controllers/butlerPuppeteerController.js:118`
   - Receives task description
   - Calls `universalAgent.executeTask(userId, taskDescription, options)`

3. **Universal Agent**: `/Users/moderndavinci/Desktop/Phoenix/pal-backend/Src/services/butler/universalAgent.js`
   - Plans the task using AI
   - Launches Puppeteer browser (line 508)
   - Executes steps
   - Takes screenshots
   - Returns results

4. **Browser Launch Configuration**:
   ```javascript
   const launchOptions = {
     headless: true,
     args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage',
       '--disable-gpu'
     ]
   };

   if (process.env.PUPPETEER_EXECUTABLE_PATH) {
     launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
   }

   browser = await puppeteer.launch(launchOptions);
   ```

## Summary

The codebase is **correctly configured** for Puppeteer on Railway:

✅ Dockerfile with Chromium installed
✅ All required system dependencies
✅ Correct environment variables
✅ Proper launch arguments (--no-sandbox, etc.)
✅ Railway set to use DOCKERFILE builder

**To test**: Run one of the test scripts above and check the response.

**Expected outcome**: Should work, unless Railway deployment failed or environment variables are not set correctly in Railway dashboard.

## Next Steps

1. Run the test script: `node test-railway-puppeteer-simple.js`
2. Check the response for `success: true` and `finalScreenshot` data
3. If it fails, check Railway deployment logs for specific errors
4. Report the exact error message for further diagnosis
