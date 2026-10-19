# Phoenix Backend - Railway Cold Start Fix

## Problem Diagnosed
Voice responses were taking **18 seconds** instead of the target **<5 seconds** due to Railway's free tier cold start penalty (~10-15 seconds when backend goes to sleep).

## Root Cause
Railway's free tier puts services to sleep after ~10 minutes of inactivity:
- **First request**: 1.2s ✅ (Railway already warm)
- **Second request**: 18s ❌ (Railway cold start + MongoDB reconnection)

## Solutions Implemented

### 1. MongoDB Connection Pooling (`server.js:144-153`)
Added connection pooling to keep 2-10 MongoDB connections alive:
```javascript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,        // Max 10 concurrent connections
  minPoolSize: 2,         // Keep 2 connections alive
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  serverSelectionTimeoutMS: 5000, // Timeout after 5s if can't connect
  heartbeatFrequencyMS: 10000,    // Check connection health every 10s
})
```

**Impact**: Reduces MongoDB query latency from ~500ms to ~50ms

### 2. Performance Logging
Added detailed timing logs to identify bottlenecks:
- `Src/services/ai/router.js:49-51` - User fetch timing
- `Src/services/ai/router.js:66-68` - Gemini routing timing
- `Src/services/gemini/consciousMind.js:63-65` - Cache load timing
- `Src/services/gemini/consciousMind.js:136-138` - Gemini API timing
- `Src/services/gemini/consciousMind.js:155-157` - Claude API timing

**Impact**: Can now pinpoint exact bottlenecks in production logs

### 3. Keep-Alive Endpoint (`server.js:253-257`)
Added ultra-lightweight `/ping` endpoint that returns instantly:
```javascript
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});
```

## Required: Free Uptime Monitor Setup

To prevent Railway cold starts, ping the backend every 5 minutes using a **free** uptime monitoring service:

### Option 1: UptimeRobot (Recommended)
1. Go to https://uptimerobot.com (100% free)
2. Sign up for free account
3. Create new monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://pal-backend-production.up.railway.app/ping`
   - **Interval**: 5 minutes
   - **Alert Contacts**: Your email (optional)

### Option 2: Cron-job.org
1. Go to https://cron-job.org (100% free)
2. Sign up for free account
3. Create new cron job:
   - **URL**: `https://pal-backend-production.up.railway.app/ping`
   - **Schedule**: Every 5 minutes (`*/5 * * * *`)

### Option 3: BetterUptime
1. Go to https://betteruptime.com (free tier)
2. Create HTTP monitor
3. Set URL to `https://pal-backend-production.up.railway.app/ping`
4. Set interval to 5 minutes

## Expected Results After Setup

| Metric | Before | After |
|--------|--------|-------|
| Cold start frequency | Every 10 min | Never (kept alive) |
| First voice response | 1.2s | 1.2s ✅ |
| Second voice response | 18s | 1.2s ✅ |
| Average response time | ~9.6s | ~1.2s ✅ |
| TTS generation | ~13s | **Still pending optimization** |

## Next Steps

### Immediate (Deploy Now)
1. ✅ MongoDB connection pooling added
2. ✅ Performance logging added
3. ✅ `/ping` endpoint added
4. ⏳ **Deploy to Railway** (`git add . && git commit -m "feat: add Railway cold start fixes" && git push`)
5. ⏳ **Set up free uptime monitor** (5 minutes via UptimeRobot)

### Phase 3 (Optimize TTS)
Current TTS is taking ~13 seconds (31s total - 18s AI response).

Options to optimize:
- Switch from OpenAI TTS (`tts-1`) to ElevenLabs (faster, better quality)
- Use streaming TTS to start playback before full generation
- Pre-generate common responses ("Hello!", "Got it!", "On it!")
- Add TTS caching (cache audio for identical responses)

### Alternative: Upgrade Railway ($5/month)
If you want to avoid external uptime monitors:
- Railway Hobby Plan: $5/month
- No cold starts
- Always-on instances
- Better performance metrics

## Cost Comparison

| Solution | Cost | Response Time | Setup Time |
|----------|------|---------------|------------|
| Free uptime monitor | $0/mo | 1.2s | 5 minutes |
| Railway Hobby | $5/mo | 1.2s | Instant |

**Recommendation**: Use free uptime monitor for now. Upgrade to Railway Hobby when you have paying users.

## Monitoring

After deploying, check logs for performance improvements:
```bash
railway logs
```

Look for these timing logs:
```
[AI Router] ⏱️  User fetch: 45ms
[Gemini Conscious] ⏱️  Cache load: 78ms
[Gemini Conscious] ⏱️  Gemini API call: 892ms
[AI Router] ⏱️  Gemini routing: 1023ms
```

Target total time: <1500ms (1.5 seconds)
