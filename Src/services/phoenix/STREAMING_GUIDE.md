# PuppeteerButler Screenshot Streaming Guide

## Overview

The PuppeteerButler now supports real-time screenshot streaming and status updates via Server-Sent Events (SSE). This allows clients to watch automation tasks in real-time.

## Features

1. **Real-time Screenshot Streaming**: Receive base64-encoded screenshots every 500ms during automation
2. **Status Updates**: Get step-by-step progress updates with current step and total steps
3. **Session Management**: Track multiple active streams with automatic cleanup
4. **Event-Driven Architecture**: Built on EventEmitter for flexible event handling

## API Endpoint

### Stream Session
```
GET /api/butler/stream/:sessionId
```

Connect to this endpoint to receive real-time updates for a specific automation session.

## Event Types

### 1. Connected Event
Sent immediately when client connects to the stream.

```json
{
  "type": "connected",
  "sessionId": "abc123..."
}
```

### 2. Frame Event
Screenshot frame with current page state.

```json
{
  "type": "frame",
  "sessionId": "abc123...",
  "screenshot": "base64_encoded_image_data",
  "status": "streaming",
  "timestamp": "2025-12-19T10:30:45.123Z",
  "url": "https://www.uber.com/..."
}
```

### 3. Status Event
Step-by-step progress update.

```json
{
  "type": "status",
  "sessionId": "abc123...",
  "message": "Logging into Uber account...",
  "step": 2,
  "totalSteps": 7,
  "timestamp": "2025-12-19T10:30:45.456Z"
}
```

### 4. Stream Stopped Event
Sent when automation completes or stream stops.

```json
{
  "type": "stream_stopped",
  "sessionId": "abc123...",
  "timestamp": "2025-12-19T10:31:00.789Z"
}
```

## Client-Side Usage Example

### JavaScript (Browser)

```javascript
async function watchButlerAction(sessionId) {
  const eventSource = new EventSource(
    `https://api.example.com/api/butler/stream/${sessionId}`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch(data.type) {
      case 'connected':
        console.log('Connected to stream:', data.sessionId);
        break;

      case 'frame':
        // Display screenshot
        const img = document.getElementById('screenshot');
        img.src = `data:image/png;base64,${data.screenshot}`;
        console.log('Current URL:', data.url);
        break;

      case 'status':
        // Update progress
        console.log(`Step ${data.step}/${data.totalSteps}: ${data.message}`);
        updateProgressBar(data.step, data.totalSteps);
        break;

      case 'stream_stopped':
        console.log('Stream ended');
        eventSource.close();
        break;
    }
  };

  eventSource.onerror = (error) => {
    console.error('Stream error:', error);
    eventSource.close();
  };
}
```

### React Example

```javascript
import { useEffect, useState } from 'react';

function ButlerStreamViewer({ sessionId, authToken }) {
  const [screenshot, setScreenshot] = useState(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState({ step: 0, total: 0 });

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/butler/stream/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'frame') {
        setScreenshot(data.screenshot);
      } else if (data.type === 'status') {
        setStatus(data.message);
        setProgress({ step: data.step, total: data.totalSteps });
      } else if (data.type === 'stream_stopped') {
        eventSource.close();
      }
    };

    return () => eventSource.close();
  }, [sessionId, authToken]);

  return (
    <div>
      <div className="progress-bar">
        <div
          style={{ width: `${(progress.step / progress.total) * 100}%` }}
        />
      </div>
      <p>{status}</p>
      {screenshot && (
        <img
          src={`data:image/png;base64,${screenshot}`}
          alt="Current automation state"
          style={{ width: '100%', maxWidth: '800px' }}
        />
      )}
    </div>
  );
}
```

## Backend Architecture

### PuppeteerButler Class Structure

```javascript
class PuppeteerButler extends EventEmitter {
  constructor() {
    super();
    this.activeStreams = new Map(); // Track active screenshot streams
  }

  // Start streaming screenshots
  async streamScreenshots(sessionId, page, interval = 500)

  // Stop streaming
  stopStreaming(sessionId)

  // Emit status update
  emitStatus(sessionId, message, step, totalSteps)

  // Create SSE handler for routes
  createSSEHandler()
}
```

### Integration in Automation Methods

Each automation method (bookUberRide, orderDoorDash, etc.) now:

1. Starts streaming when action begins:
   ```javascript
   await this.streamScreenshots(actionId, page, 500);
   ```

2. Emits status at each step:
   ```javascript
   this.emitStatus(actionId, 'Logging into Uber...', 2, 7);
   ```

3. Stops streaming when complete:
   ```javascript
   this.stopStreaming(actionId);
   ```

## Example Workflow

1. **Client initiates action**:
   ```javascript
   POST /api/butler/uber/book
   {
     "pickup": "123 Main St",
     "destination": "456 Oak Ave",
     "rideType": "UberX"
   }
   ```

2. **Server returns session ID**:
   ```json
   {
     "success": true,
     "actionId": "abc123...",
     "sessionId": "abc123..."
   }
   ```

3. **Client connects to stream**:
   ```javascript
   GET /api/butler/stream/abc123...
   ```

4. **Client receives real-time updates**:
   - Screenshots every 500ms
   - Status updates at each automation step
   - Final completion or error message

## Error Handling

The stream automatically stops and sends a `stream_stopped` event when:
- Page closes
- Browser disconnects
- Error occurs during automation
- `stopStreaming()` is called manually

## Performance Considerations

- **Screenshot Interval**: Default 500ms, adjustable per use case
- **Image Size**: Screenshots are base64-encoded PNG, ~100-500KB each
- **Network**: SSE maintains persistent connection, ensure proper timeout settings
- **Memory**: Active streams are tracked and cleaned up automatically

## Security

- All streaming endpoints require authentication
- Session verification ensures users can only watch their own automations
- Credentials are never sent over the stream
- Screenshots may contain sensitive information - use HTTPS

## Future Enhancements

- Variable screenshot quality/compression
- Video recording option
- Pause/resume streaming
- Multi-session viewing
- Screenshot annotations
- Click coordinates overlay
