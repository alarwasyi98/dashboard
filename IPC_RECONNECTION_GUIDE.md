# IPC Socket Reconnection System

## Overview

This guide documents the IPC (Inter-Process Communication) connection manager that handles socket lifecycle, automatic reconnection with exponential backoff, and pending request management. The system prevents sending on dead sockets and automatically recovers from connection failures.

## Architecture

### Three-Layer Protection

1. **Connection State Guard** - Prevents sending on dead socket
2. **Error Handling** - Catches socket errors and connection failures  
3. **Automatic Retry** - Exponential backoff reconnection logic

## Key Components

### 1. `ipcConnectionManager.ts`

Core connection manager with:

- **Connection State Tracking**: `isConnected`, `isConnecting` flags
- **Socket Guards**: `ensureConnected()` prevents blind sends
- **Event Handlers**: Proper cleanup on `close`, `error`, `data` events
- **Pending Request Management**: Tracks all in-flight requests
- **Request Timeout**: Auto-rejects timed-out requests
- **Exponential Backoff**: Delays between retry attempts increase

### 2. `useIPC.ts`

Vue composable for frontend usage:

```typescript
const { isConnected, call, connect, disconnect } = useIPC()

// Make a call with automatic retry
const data = await call('method.name', { param: 'value' })
```

### 3. API Endpoint Example

`server/api/finance-sync.ts` demonstrates proper server-side pattern with built-in retry logic.

## How It Works

### Connection Lifecycle

```
connect() 
  → setupEventHandlers()
    → socket connects
      → 'connect' event → isConnected = true
      → 'data' event → handleIncomingMessage()
      → 'error' event → handleSocketError() → attemptReconnect()
      → 'close' event → handleSocketClose() → rejectAllPending() → attemptReconnect()
```

### Error Handling Flow

```
send() 
  → ensureConnected() [GUARD - prevents dead socket send]
    → socket.write()
      → ERROR
        → isConnected = false
        → attemptReconnect()
          → exponential backoff delay
          → connect() retry
```

### Pending Request Management

```
send(method, params)
  → Generate unique ID
  → Store in pendingRequests Map
  → Set timeout handler
  → Send via socket
  
On response:
  → handleIncomingMessage()
    → Find pending request by ID
    → Clear timeout
    → Resolve promise

On timeout/close:
  → rejectAllPending()
    → Reject all pending with error
    → Clear timeouts
    → Clear Map
```

## Usage Examples

### Client-Side (Vue Component)

```typescript
<script setup>
import { useIPC } from '~/composables/useIPC'

const { isConnected, call } = useIPC()

// Connect on mount
onMounted(async () => {
  await call('connect')
})

// Make IPC call with retry
async function syncData() {
  try {
    const result = await call('finance.sync', {
      accounts: ['checking', 'savings']
    }, { maxRetries: 3 })
    console.log('Sync result:', result)
  } catch (error) {
    console.error('Sync failed:', error)
    // User sees error, retry button available
  }
}
</script>
```

### Server-Side (API Route)

```typescript
// server/api/sync.ts
export default defineEventHandler(async () => {
  try {
    const data = await performIPCCall('sync.finances', {...}, 3)
    return { success: true, data }
  } catch (error) {
    return sendError(event, createError({
      statusCode: 503,
      statusMessage: 'Service unavailable',
      data: { message: error.message, retryable: true }
    }))
  }
})

async function performIPCCall(method, params, maxRetries) {
  let lastError
  for (let i = 1; i <= maxRetries; i++) {
    try {
      return await ipcManager.send(method, params)
    } catch (error) {
      lastError = error
      if (i < maxRetries) {
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, i-1)))
      }
    }
  }
  throw lastError
}
```

## Configuration

```typescript
const manager = new IPCConnectionManager({
  maxRetries: 5,           // Max reconnection attempts
  retryDelayMs: 1000,      // Initial delay between retries
  socketPath: '/tmp/ipc.sock',  // IPC socket path
  timeout: 30000           // Request timeout in ms
})
```

## Exponential Backoff Algorithm

Retry delays increase exponentially:
- Attempt 1: 1000ms
- Attempt 2: 2000ms  
- Attempt 3: 4000ms
- Attempt 4: 8000ms
- Attempt 5: 16000ms (then gives up)

Formula: `delay = initialDelay × 2^(attemptNumber - 1)`

## Error Scenarios & Handling

### Scenario 1: Socket Dies Unexpectedly

```
Socket dies
  → 'close' event fires
  → handleSocketClose()
    → isConnected = false
    → Reject all pending requests with "IPC connection closed"
    → Clear pending requests map
    → attemptReconnect()
      → Wait exponential backoff
      → Try to reconnect
```

**User Experience**: Pending requests fail with clear error, retry button available

### Scenario 2: Network Error During Send

```
socket.write() throws error
  → Catch in send()
    → isConnected = false
    → Pending request times out or rejects
    → handleConnectionError() → attemptReconnect()
```

**User Experience**: Request fails, can retry immediately

### Scenario 3: Request Timeout (No Response)

```
Request sent, no response for 30 seconds
  → Timeout handler fires
  → Pending request rejected
  → No automatic retry needed (IPC side likely dead)
```

**User Experience**: Clear timeout error, user can retry

### Scenario 4: Connection State Guard Prevents Blind Send

```
Socket is dead but code tries to send
  → ensureConnected() returns false
  → connect() called automatically
  → If still not connected, throw error
  → User sees "not connected and failed to reconnect"
```

**User Experience**: Prevented bad state, clear error message

## Best Practices

1. **Always Use Guards**: Call `ensureConnected()` before socket operations
2. **Handle Errors Gracefully**: Wrap in try/catch, show user-friendly messages
3. **Use withIPCRetry()**: For automatic retry logic with exponential backoff
4. **Check Connection Status**: Use `getStatus()` to monitor health
5. **Clean Disconnect**: Always call `disconnect()` on cleanup
6. **Pending Request Limits**: Monitor `pendingRequests` count to avoid memory leaks
7. **Timeout Configuration**: Adjust `timeout` based on expected response times

## Monitoring & Debugging

### Check Connection Status

```typescript
const status = ipcManager.getStatus()
console.log({
  isConnected: status.isConnected,
  isConnecting: status.isConnecting,
  pendingRequests: status.pendingRequests,
  retryCount: status.retryCount
})
```

### Enable Logging

All functions log with `[IPC]` prefix:
- `[IPC] Connection established`
- `[IPC] Socket connection closed`
- `[IPC] Attempting reconnect (3/5) in 4000ms`
- `[IPC] Request timeout after 30000ms`

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "IPC connection closed" | Socket died | Wait for reconnect, retry operation |
| "Max retries reached" | Service down | Check IPC service status |
| "Request timeout" | Slow response | Increase timeout config value |
| "Cannot send on disconnected socket" | Guard prevented send | Check ensureConnected() logic |
| Memory leak | Pending requests pile up | Monitor pendingRequests count |

## Future Improvements

- [ ] Connection pooling for multiple sockets
- [ ] Metrics collection (latency, error rates)
- [ ] Circuit breaker pattern for cascading failures
- [ ] Message queue for offline mode
- [ ] WebSocket fallback for browser environments
