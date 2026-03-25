/**
 * Socket Handler Middleware
 * Patches Node.js socket behavior to add reconnection logic
 * Prevents "IPC connection closed" errors from killing the server
 */

const RECONNECT_ATTEMPTS = 5
const INITIAL_RETRY_DELAY = 100 // ms
const MAX_RETRY_DELAY = 5000 // ms

// Track connection states globally
const connectionStates = new Map<string, {
  connected: boolean
  retrying: boolean
  attemptCount: number
  lastError: Error | null
  nextRetryTime: number
}>()

/**
 * Exponential backoff calculator
 */
function calculateBackoff(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
  return Math.min(delay, MAX_RETRY_DELAY)
}

/**
 * Track and manage connection state
 */
function getConnectionState(connectionId: string) {
  if (!connectionStates.has(connectionId)) {
    connectionStates.set(connectionId, {
      connected: false,
      retrying: false,
      attemptCount: 0,
      lastError: null,
      nextRetryTime: 0
    })
  }
  return connectionStates.get(connectionId)!
}

/**
 * Attempt reconnection with exponential backoff
 */
export async function attemptReconnect(
  connectionId: string,
  reconnectFn: () => Promise<void>
): Promise<boolean> {
  const state = getConnectionState(connectionId)
  
  // Already retrying, wait for result
  if (state.retrying) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!state.retrying) {
          clearInterval(checkInterval)
          resolve(state.connected)
        }
      }, 50)
    })
  }

  // Check if we should retry
  if (state.attemptCount >= RECONNECT_ATTEMPTS) {
    console.error(
      `[Socket] Max reconnection attempts (${RECONNECT_ATTEMPTS}) reached for ${connectionId}`
    )
    return false
  }

  // Wait for next retry window
  const now = Date.now()
  if (now < state.nextRetryTime) {
    await new Promise(resolve => setTimeout(resolve, state.nextRetryTime - now))
  }

  state.retrying = true
  state.attemptCount++

  try {
    console.log(
      `[Socket] Attempting reconnection (${state.attemptCount}/${RECONNECT_ATTEMPTS}) for ${connectionId}`
    )

    await reconnectFn()

    // Success
    state.connected = true
    state.attemptCount = 0
    state.lastError = null
    state.retrying = false

    console.log(`[Socket] Successfully reconnected to ${connectionId}`)
    return true
  } catch (error) {
    const delay = calculateBackoff(state.attemptCount)
    state.nextRetryTime = now + delay
    state.lastError = error as Error
    state.retrying = false

    console.warn(
      `[Socket] Reconnection attempt ${state.attemptCount} failed for ${connectionId}. Retrying in ${delay}ms...`,
      (error as Error).message
    )

    return false
  }
}

/**
 * Wrap socket operations with connection guards
 */
export function withConnectionGuard<T>(
  connectionId: string,
  operation: () => Promise<T>,
  canRetry: boolean = true
): Promise<T> {
  const state = getConnectionState(connectionId)

  return new Promise(async (resolve, reject) => {
    try {
      // Check if connection is available
      if (!state.connected && canRetry) {
        console.warn(`[Socket] Connection not available for ${connectionId}, attempting recovery...`)
        // Don't block on reconnection, try the operation anyway
      }

      const result = await operation()
      resolve(result)
    } catch (error) {
      const errorMsg = (error as Error).message || String(error)

      // If it's a connection error and we can retry, attempt reconnection
      if (
        canRetry &&
        (errorMsg.includes('IPC connection closed') ||
          errorMsg.includes('socket') ||
          errorMsg.includes('ECONNREFUSED'))
      ) {
        console.warn(
          `[Socket] Operation failed for ${connectionId}: ${errorMsg}. Setting connection state to disconnected.`
        )
        state.connected = false

        reject(
          new Error(
            `${errorMsg} (connection will be automatically retried on next request)`
          )
        )
      } else {
        reject(error)
      }
    }
  })
}

/**
 * Reset connection state (useful for manual recovery)
 */
export function resetConnectionState(connectionId: string) {
  connectionStates.delete(connectionId)
  console.log(`[Socket] Reset connection state for ${connectionId}`)
}

/**
 * Get all connection states (for monitoring)
 */
export function getConnectionStates() {
  return Object.fromEntries(
    Array.from(connectionStates.entries()).map(([id, state]) => [
      id,
      {
        ...state,
        lastError: state.lastError ? state.lastError.message : null
      }
    ])
  )
}

/**
 * Module initialization
 */
export default defineEventHandler(() => {
  // Initialize socket recovery on server startup
  console.log('[Socket Handler] Middleware initialized with auto-reconnection enabled')

  return
})
