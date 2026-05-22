# WebSocket Specification
## VedaAI – AI Assessment Creator

**Transport:** Socket.io v4 (WebSocket with HTTP long-polling fallback)  
**Server URL:** `http://localhost:4000`  
**Namespace:** `/` (default)

---

## 1. Connection

### Client Initialization
```typescript
// frontend/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      transports: ['websocket', 'polling'],  // prefer WS, fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}
```

### Connection Events (Client Listeners)
```typescript
socket.on('connect',           () => console.log('WS connected:', socket.id));
socket.on('disconnect',        (reason) => console.warn('WS disconnected:', reason));
socket.on('connect_error',     (err) => console.error('WS error:', err.message));
socket.on('reconnect',         (attempt) => console.log(`Reconnected after ${attempt} attempts`));
socket.on('reconnect_failed',  () => console.error('WS reconnect failed — switching to polling'));
```

---

## 2. Room Management

Each assignment gets its own Socket.io room: `assignment:{assignmentId}`

### Join Room
**Direction:** Client → Server  
**Event:** `join`

```typescript
// Client emits
socket.emit('join', { assignmentId: '663f1a2b4c1e2d3f5a6b7c8d' });
```

```typescript
// Server handles
socket.on('join', ({ assignmentId }) => {
  socket.join(`assignment:${assignmentId}`);
  logger.info(`Socket ${socket.id} joined room assignment:${assignmentId}`);
});
```

---

### Leave Room
**Direction:** Client → Server  
**Event:** `leave`

```typescript
// Client emits (on component unmount / navigation away)
socket.emit('leave', { assignmentId: '663f1a2b4c1e2d3f5a6b7c8d' });
```

```typescript
// Server handles
socket.on('leave', ({ assignmentId }) => {
  socket.leave(`assignment:${assignmentId}`);
});
```

---

## 3. Generation Events (Server → Client)

All events are emitted to the room `assignment:{assignmentId}`.

---

### 3.1 `generation:started`
Emitted when the BullMQ worker picks up the job and begins processing.

**Payload:**
```typescript
{
  assignmentId: string;
  jobId:        string;
  message:      string;   // "Question generation started"
  timestamp:    string;   // ISO 8601
}
```

**Example:**
```json
{
  "assignmentId": "663f1a2b4c1e2d3f5a6b7c8d",
  "jobId":        "bullmq-job-001",
  "message":      "Question generation started",
  "timestamp":    "2025-03-20T10:00:05.000Z"
}
```

---

### 3.2 `generation:progress`
Emitted multiple times during processing with a 0–100 progress value.

**Progress Checkpoints:**
| Progress | Stage                                  |
|----------|----------------------------------------|
| 5        | Job picked up by worker                |
| 15       | Assignment fetched, prompt building    |
| 30       | LLM API call initiated                 |
| 60       | LLM response streaming / received      |
| 75       | Response parsing and validation        |
| 90       | Saving paper to MongoDB                |
| 95       | Caching result in Redis                |
| 100      | Generation complete (see `completed`)  |

**Payload:**
```typescript
{
  assignmentId: string;
  jobId:        string;
  progress:     number;   // 0–100 integer
  stage:        string;   // Human-readable stage label
  timestamp:    string;
}
```

**Example:**
```json
{
  "assignmentId": "663f1a2b4c1e2d3f5a6b7c8d",
  "jobId":        "bullmq-job-001",
  "progress":     60,
  "stage":        "Generating questions with AI...",
  "timestamp":    "2025-03-20T10:00:18.000Z"
}
```

---

### 3.3 `generation:completed`
Emitted when the paper is fully generated, parsed, and stored.

**Payload:**
```typescript
{
  assignmentId: string;
  jobId:        string;
  paperId:      string;   // MongoDB ObjectId of QuestionPaper
  message:      string;   // "Question paper ready"
  timestamp:    string;
}
```

**Example:**
```json
{
  "assignmentId": "663f1a2b4c1e2d3f5a6b7c8d",
  "jobId":        "bullmq-job-001",
  "paperId":      "663f1b3c5d2f3a4b6c7d8e9f",
  "message":      "Question paper ready",
  "timestamp":    "2025-03-20T10:00:32.000Z"
}
```

**Client Action on Receipt:**
```typescript
socket.on('generation:completed', ({ paperId, assignmentId }) => {
  useGenerationStore.getState().setStatus('completed', 100);
  router.push(`/assignments/${assignmentId}/paper`);
});
```

---

### 3.4 `generation:failed`
Emitted when all BullMQ retries are exhausted.

**Payload:**
```typescript
{
  assignmentId: string;
  jobId:        string;
  errorCode:    string;   // e.g. "LLM_PARSE_ERROR", "LLM_TIMEOUT", "DB_ERROR"
  message:      string;   // Human-readable error description
  timestamp:    string;
}
```

**Error Codes:**
| Code              | Cause                                          |
|-------------------|------------------------------------------------|
| `LLM_TIMEOUT`     | LLM API did not respond in time                |
| `LLM_PARSE_ERROR` | Response could not be parsed as valid JSON     |
| `LLM_SCHEMA_ERROR`| Parsed JSON failed Zod validation              |
| `DB_ERROR`        | MongoDB write failed                           |
| `UNKNOWN_ERROR`   | Unexpected worker error                        |

**Example:**
```json
{
  "assignmentId": "663f1a2b4c1e2d3f5a6b7c8d",
  "jobId":        "bullmq-job-001",
  "errorCode":    "LLM_PARSE_ERROR",
  "message":      "AI returned an invalid response format. Please try regenerating.",
  "timestamp":    "2025-03-20T10:01:00.000Z"
}
```

---

## 4. PDF Events (Bonus)

### 4.1 `pdf:completed`
```typescript
{
  assignmentId: string;
  downloadUrl:  string;   // "/api/v1/assignments/{id}/pdf/download"
  timestamp:    string;
}
```

### 4.2 `pdf:failed`
```typescript
{
  assignmentId: string;
  message:      string;
  timestamp:    string;
}
```

---

## 5. Reconnection & Fallback Strategy

```
Client connects
  └── Happy path: WebSocket established
  └── Failure path: Socket.io falls back to HTTP long-polling automatically

Client reconnects after disconnect
  └── re-emit 'join' with assignmentId on reconnect event
  └── Simultaneously poll GET /assignments/:id/status to get current state
  └── If status is already 'completed' → skip waiting, go directly to paper page
  └── If status is 'failed' → show error UI immediately

5 reconnect attempts exhausted
  └── Show "Connection lost" banner
  └── Poll /assignments/:id/status every 5 seconds as fallback
  └── Offer "Refresh" button
```

**Client Reconnect Handler:**
```typescript
socket.on('reconnect', () => {
  const { assignmentId } = useGenerationStore.getState();
  if (assignmentId) {
    socket.emit('join', { assignmentId });

    // Sync state via REST in case we missed events
    api.get(`/assignments/${assignmentId}/status`).then(({ data }) => {
      if (data.status === 'completed') router.push(`/assignments/${assignmentId}/paper`);
      if (data.status === 'failed')    useGenerationStore.getState().setStatus('failed', 0, data.errorMessage);
      else                             useGenerationStore.getState().setStatus(data.status, data.progress);
    });
  }
});
```

---

## 6. Server-Side Room Cleanup

Socket.io handles room cleanup automatically on disconnect. No manual teardown needed unless custom logic is required.

```typescript
// Optional: log room members on disconnect
io.on('connection', (socket) => {
  socket.on('disconnecting', () => {
    logger.info(`Socket ${socket.id} leaving rooms:`, [...socket.rooms]);
  });
});
```
