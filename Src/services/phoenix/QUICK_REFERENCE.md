# PuppeteerButler Streaming - Quick Reference

## 🚀 Quick Start

### 1. Start an Automation
```javascript
POST /api/butler/uber/book
Headers: Authorization: Bearer <token>
Body: { pickup, destination, rideType }
Response: { actionId, sessionId }
```

### 2. Connect to Stream
```javascript
const es = new EventSource(`/api/butler/stream/${sessionId}`);
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  // Handle: connected, frame, status, stream_stopped
};
```

## 📡 Event Types

| Event | Frequency | Purpose |
|-------|-----------|---------|
| `connected` | Once | Initial connection confirmation |
| `frame` | Every 500ms | Screenshot with URL & timestamp |
| `status` | Per step | Progress updates with step numbers |
| `stream_stopped` | Once | Stream ended (complete or error) |

## 🎯 Event Formats

### Connected
```json
{ "type": "connected", "sessionId": "abc123" }
```

### Frame
```json
{
  "type": "frame",
  "sessionId": "abc123",
  "screenshot": "base64_string...",
  "status": "streaming",
  "timestamp": "2025-12-19T10:30:45.123Z",
  "url": "https://www.uber.com/..."
}
```

### Status
```json
{
  "type": "status",
  "sessionId": "abc123",
  "message": "Logging into Uber...",
  "step": 2,
  "totalSteps": 7,
  "timestamp": "2025-12-19T10:30:45.456Z"
}
```

### Stream Stopped
```json
{
  "type": "stream_stopped",
  "sessionId": "abc123",
  "timestamp": "2025-12-19T10:31:00.789Z"
}
```

## 🛠️ Implementation Patterns

### React Hook
```javascript
function useButlerStream(sessionId) {
  const [screenshot, setScreenshot] = useState(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState({ step: 0, total: 0 });

  useEffect(() => {
    const es = new EventSource(`/api/butler/stream/${sessionId}`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'frame') setScreenshot(data.screenshot);
      if (data.type === 'status') {
        setStatus(data.message);
        setProgress({ step: data.step, total: data.totalSteps });
      }
    };

    return () => es.close();
  }, [sessionId]);

  return { screenshot, status, progress };
}
```

### Vue Composable
```javascript
export function useButlerStream(sessionId) {
  const screenshot = ref(null);
  const status = ref('');
  const progress = ref({ step: 0, total: 0 });
  let eventSource = null;

  onMounted(() => {
    eventSource = new EventSource(`/api/butler/stream/${sessionId}`);

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'frame') screenshot.value = data.screenshot;
      if (data.type === 'status') {
        status.value = data.message;
        progress.value = { step: data.step, total: data.totalSteps };
      }
    };
  });

  onUnmounted(() => eventSource?.close());

  return { screenshot, status, progress };
}
```

### Vanilla JavaScript
```javascript
class ButlerStreamViewer {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.eventSource = null;
    this.onFrame = null;
    this.onStatus = null;
  }

  connect() {
    this.eventSource = new EventSource(`/api/butler/stream/${this.sessionId}`);

    this.eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'frame' && this.onFrame) {
        this.onFrame(data.screenshot, data.url);
      }

      if (data.type === 'status' && this.onStatus) {
        this.onStatus(data.message, data.step, data.totalSteps);
      }
    };
  }

  disconnect() {
    this.eventSource?.close();
  }
}

// Usage
const viewer = new ButlerStreamViewer(sessionId);
viewer.onFrame = (screenshot, url) => { /* ... */ };
viewer.onStatus = (msg, step, total) => { /* ... */ };
viewer.connect();
```

## 📋 Backend Integration

### In Automation Methods
```javascript
async bookUberRide(params) {
  const actionId = crypto.randomBytes(16).toString('hex');
  const totalSteps = 7;

  try {
    // 1. Start streaming
    await this.streamScreenshots(actionId, page, 500);

    // 2. Emit status at each step
    this.emitStatus(actionId, 'Navigating...', 1, totalSteps);
    // ... do work ...

    this.emitStatus(actionId, 'Logging in...', 2, totalSteps);
    // ... do work ...

    // 3. Stop when done
    this.stopStreaming(actionId);

  } catch (error) {
    this.stopStreaming(actionId); // Always cleanup
    this.emitStatus(actionId, `Error: ${error.message}`);
  }
}
```

### Custom SSE Route
```javascript
router.get('/custom-stream/:id', (req, res) => {
  const handler = puppeteerButler.createSSEHandler();
  handler(req, res);
});
```

## 🔧 Configuration

### Change Screenshot Interval
```javascript
// Default: 500ms
await this.streamScreenshots(sessionId, page, 500);

// Faster: 250ms (more bandwidth)
await this.streamScreenshots(sessionId, page, 250);

// Slower: 1000ms (less bandwidth)
await this.streamScreenshots(sessionId, page, 1000);
```

### Custom Events
```javascript
// In puppeteerButler
this.emit('custom_event', {
  sessionId,
  data: 'anything',
  timestamp: new Date().toISOString()
});

// Listen in SSE handler
puppeteerButler.on('custom_event', (data) => {
  if (data.sessionId === sessionId) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
});
```

## 🐛 Debugging

### Check Active Streams
```javascript
console.log(puppeteerButler.activeStreams);
// Map { 'session-id' => { active: true, intervalId: 123, page: {...} } }
```

### Force Stop All Streams
```javascript
await puppeteerButler.cleanup();
```

### Monitor Events
```javascript
puppeteerButler.on('frame', (data) => console.log('Frame:', data.sessionId));
puppeteerButler.on('status', (data) => console.log('Status:', data.message));
puppeteerButler.on('stream_stopped', (data) => console.log('Stopped:', data.sessionId));
```

## ⚠️ Common Issues

### Stream Not Starting
- ✅ Check session exists in `activeSessions`
- ✅ Verify page is not closed
- ✅ Ensure streamScreenshots() is called

### No Screenshots
- ✅ Check browser is running
- ✅ Verify page has content
- ✅ Check network bandwidth

### Memory Leak
- ✅ Always call `stopStreaming()` in finally block
- ✅ Clean up on page close event
- ✅ Verify EventSource.close() on client

### Connection Drops
- ✅ Implement reconnection logic
- ✅ Check keepalive is working (30s interval)
- ✅ Verify proxy/nginx timeout settings

## 📊 Performance Tips

1. **Adjust interval based on action complexity**
   - Fast actions: 250ms
   - Normal actions: 500ms (default)
   - Slow actions: 1000ms

2. **Limit concurrent streams**
   ```javascript
   if (puppeteerButler.activeStreams.size > 10) {
     throw new Error('Too many active streams');
   }
   ```

3. **Monitor bandwidth usage**
   - Each stream: ~2-10 Mbps
   - Screenshot size: ~100-500KB
   - Calculate: (size * 1000/interval) = bytes/sec

## 🔒 Security Checklist

- ✅ Authenticate all stream connections
- ✅ Validate user owns session
- ✅ Use HTTPS in production
- ✅ Sanitize sessionId input
- ✅ Set appropriate CORS headers
- ✅ Limit stream duration
- ✅ Rate limit connections

## 📱 Mobile Considerations

```javascript
// Reduce quality for mobile
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
const interval = isMobile ? 1000 : 500;
```

## 🎨 UI Components

### Progress Bar
```html
<div class="progress">
  <div class="bar" style="width: ${step/total*100}%"></div>
</div>
<p>Step ${step} of ${total}: ${message}</p>
```

### Screenshot Display
```html
<img
  src="data:image/png;base64,${screenshot}"
  alt="Live automation"
  style="max-width: 100%; height: auto;"
/>
```

### Status Badge
```javascript
const badge = step === total ? 'Complete' : `${step}/${total}`;
```

## 🚦 Testing

### Manual Test Flow
1. Open `streaming-test.html`
2. Trigger automation via Postman/curl
3. Copy sessionId from response
4. Paste into test page
5. Click "Connect"
6. Watch live stream

### Automated Test
```javascript
describe('Butler Streaming', () => {
  it('should stream screenshots', (done) => {
    const es = new EventSource(`/api/butler/stream/${sessionId}`);
    let frameCount = 0;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'frame') {
        frameCount++;
        expect(data.screenshot).toBeDefined();
      }
      if (data.type === 'stream_stopped') {
        expect(frameCount).toBeGreaterThan(0);
        es.close();
        done();
      }
    };
  });
});
```

---

**Last Updated**: 2025-12-19
**Version**: 1.0.0
