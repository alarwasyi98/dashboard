# Socket Recovery & IPC Connection Management Guide

## Problem Statement

The Nuxt build process creates IPC sockets for inter-process communication between vite-builder instances. When these sockets unexpectedly close, the `onClose` handler immediately rejects all pending requests with "IPC connection closed" error without any reconnection logic, leaving the connection dead.

### Error Signature
```
Error: IPC connection closed
Stack: vite-node.mjs onClose handler
```

## Solution Architecture

The solution is implemented across three layers:

### 1. Server-Side Socket Handler Middleware (`server/middleware/socket-handler.ts`)

Implements connection state management and automatic reconnection with exponential backoff.

**Key Functions:**
- `attemptReconnect()` - Retry failed connections with exponential backoff
- `withConnectionGuard()` - Wrap operations with connection state checking
- `resetConnectionState()` - Manual recovery trigger
- `getConnectionStates()` - Monitor connection health

**Features:**
- Exponential backoff: 100ms → 200ms → 400ms → 800ms → 5000ms (max)
- Max 5 reconnection attempts per connection
- Prevents duplicate reconnection attempts (guards with `state.retrying`)
- Global connection state tracking

### 2. Error Handler (`server/utils/errorHandler.ts`)

Catches socket errors at the Nitro level and returns recoverable responses.

**Handled Errors:**
- `IPC connection closed` → 503 Service Temporarily Unavailable
- Socket timeouts (ECONNREFUSED, ETIMEDOUT) → 503 with retry flag
- Returns `{ statusCode: 503, retryable: true }` for client retry logic

### 3. Frontend Recovery (`app/composables/useConnectionRecovery.ts`)

Client-side retry logic with user feedback.

**Key Features:**
- `executeWithRetry()` - Wrap API calls with automatic retry
- `checkConnection()` - Verify server connectivity
- `resetConnection()` - Trigger server-side recovery
- Toast notifications for connection issues
- Configurable retry strategy

## Usage Examples

### Basic API Call with Automatic Retry

```vue
<script setup>
const { executeWithRetry } = useConnectionRecovery()

const fetchData = async () => {
  try {
    const data = await executeWithRetry(
      async () => $fetch('/api/some-endpoint'),
      'Fetch User Data'
    )
    // Use data
  } catch (error) {
    console.error('Operation failed:', error)
  }
}
</script>
```

### Custom Retry Configuration

```vue
<script setup>
const recovery = useConnectionRecovery({
  maxAttempts: 10,           // Retry up to 10 times
  initialDelay: 500,         // Start with 500ms delay
  maxDelay: 60000,           // Max 60 second delay
  backoffMultiplier: 2       // Double delay each attempt
})

const syncData = async () => {
  await recovery.executeWithRetry(
    () => $fetch('/api/sync'),
    'Data Sync'
  )
}
</script>
```

### Monitor Connection Status

```vue
<script setup>
const { checkConnection, resetConnection } = useConnectionRecovery()

const checkStatus = async () => {
  const isConnected = await checkConnection()
  console.log('Server is', isConnected ? 'online' : 'offline')
}

const manualRecovery = async () => {
  await resetConnection('my-connection-id')
}
</script>
```

### Wrap Multiple Operations

```vue
<script setup>
const recovery = useConnectionRecovery()

const batchSync = async () => {
  try {
    // All these operations auto-retry on connection errors
    await recovery.executeWithRetry(() => $fetch('/api/accounts'), 'Load Accounts')
    await recovery.executeWithRetry(() => $fetch('/api/transactions'), 'Load Transactions')
    await recovery.executeWithRetry(() => $fetch('/api/analytics'), 'Load Analytics')
  } catch (error) {
    recovery.notifyConnectionIssue('Failed to sync data after multiple attempts')
  }
}
</script>
```

## API Endpoint: `/api/socket-status`

### GET - Check Connection States

```bash
curl http://localhost:3000/api/socket-status
```

Response:
```json
{
  "timestamp": "2024-03-25T10:30:00.000Z",
  "connections": {
    "vite-builder-1": {
      "connected": true,
      "retrying": false,
      "attemptCount": 0,
      "lastError": null
    }
  },
  "summary": {
    "total": 1,
    "healthy": 1
  }
}
```

### POST - Reset a Connection

```bash
curl -X POST http://localhost:3000/api/socket-status?action=reset&id=vite-builder-1
```

Response:
```json
{
  "success": true,
  "message": "Connection vite-builder-1 reset",
  "timestamp": "2024-03-25T10:30:00.000Z"
}
```

## Retry Strategy Details

### Exponential Backoff Algorithm

```
Attempt 1: 100ms delay
Attempt 2: 200ms delay
Attempt 3: 400ms delay
Attempt 4: 800ms delay
Attempt 5: 5000ms delay (capped at MAX_RETRY_DELAY)

Total time: ~6.5 seconds for 5 attempts
```

### Decision Tree

```
Request fails
  ↓
Is it a connection error? (socket, ECONNREFUSED, ETIMEDOUT, IPC closed)
  ├─ YES: Is retryCount < maxAttempts?
  │   ├─ YES: Wait (exponential backoff) → Retry
  │   └─ NO: Throw "Exhausted all retry attempts" error
  └─ NO: Throw original error immediately (not retryable)
```

## Monitoring & Debugging

### Check Connection Health

```vue
<script setup>
const { isRetrying, retryCount, lastError } = useConnectionRecovery()

watch(isRetrying, (newVal) => {
  console.log(`Retry status: ${newVal ? 'Active' : 'Idle'}`)
})

watch(retryCount, (newVal) => {
  console.log(`Retry attempt: ${newVal}`)
})

watch(lastError, (newVal) => {
  if (newVal) console.log(`Last error: ${newVal.message}`)
})
</script>
```

### Server-Side Logs

```
[Socket Handler] Middleware initialized with auto-reconnection enabled
[Socket] Attempting reconnection (1/5) for vite-builder-1
[Socket] Reconnection attempt 1 failed. Retrying in 200ms...
[Socket] Successfully reconnected to vite-builder-1
```

## Best Practices

1. **Always wrap API calls** in production environments:
   ```ts
   await recovery.executeWithRetry(() => $fetch(url), 'Operation Name')
   ```

2. **Provide operation names** for better logging:
   ```ts
   // Good - clear in logs
   executeWithRetry(fn, 'Fetch User Profile')
   
   // Avoid - generic
   executeWithRetry(fn, 'API Call')
   ```

3. **Monitor connection status** in critical sections:
   ```ts
   const isConnected = await checkConnection()
   if (!isConnected) {
     await resetConnection('my-connection')
   }
   ```

4. **Customize retries per use case**:
   ```ts
   // Quick retries for interactive operations
   useConnectionRecovery({ maxAttempts: 3, initialDelay: 100 })
   
   // Persistent retries for background sync
   useConnectionRecovery({ maxAttempts: 10, maxDelay: 60000 })
   ```

5. **Notify users appropriately**:
   ```ts
   recovery.notifyConnectionIssue(
     'Syncing data... (attempt 2/5)'
   )
   ```

## Migration Path for Existing Code

### Before (Fails on Socket Error)
```ts
const data = await $fetch('/api/endpoint')
```

### After (Resilient with Retry)
```ts
const { executeWithRetry } = useConnectionRecovery()
const data = await executeWithRetry(
  () => $fetch('/api/endpoint'),
  'Load Endpoint Data'
)
```

## Troubleshooting

### "IPC connection closed" Still Appears
- Ensure all API calls use `executeWithRetry()`
- Check server logs for socket state: `GET /api/socket-status`
- Manually reset: `POST /api/socket-status?action=reset&id=connection-id`

### Retries Are Too Slow
- Reduce `initialDelay`: `useConnectionRecovery({ initialDelay: 100 })`
- Reduce `maxAttempts` if timeout is critical: `useConnectionRecovery({ maxAttempts: 3 })`

### Retries Not Happening
- Verify error is connection-related (check lastError value)
- Ensure `executeWithRetry()` wraps the operation
- Check browser console for retry logs

### High Retry Count
- Indicates frequent socket drops
- Check server resources (CPU, memory)
- Consider increasing delays: `{ backoffMultiplier: 3 }`
- Monitor with `GET /api/socket-status`

## Configuration Reference

```ts
interface RetryOptions {
  maxAttempts?: number              // Default: 5
  initialDelay?: number             // Default: 1000ms
  maxDelay?: number                 // Default: 30000ms
  backoffMultiplier?: number        // Default: 2
}
```

## Future Enhancements

- [ ] Circuit breaker pattern for persistent failures
- [ ] Connection pooling for multiple socket instances
- [ ] Metrics collection and reporting
- [ ] WebSocket fallback for production
- [ ] Automatic connection pruning after N failures
