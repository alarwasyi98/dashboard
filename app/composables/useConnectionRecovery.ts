/**
 * Connection Recovery Composable
 * Provides retry logic and automatic recovery for socket connection errors
 */

interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
}

export const useConnectionRecovery = (options: RetryOptions = {}) => {
  const {
    maxAttempts = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2
  } = options

  const isRetrying = ref(false)
  const retryCount = ref(0)
  const lastError = ref<Error | null>(null)

  /**
   * Calculate exponential backoff delay
   */
  const calculateDelay = (attempt: number): number => {
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)
    return Math.min(delay, maxDelay)
  }

  /**
   * Check if error is a connection-related error
   */
  const isConnectionError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false

    const message = error.message.toLowerCase()
    return (
      message.includes('ipc connection closed') ||
      message.includes('socket') ||
      message.includes('econnrefused') ||
      message.includes('etimedout') ||
      message.includes('temporarily unavailable')
    )
  }

  /**
   * Execute operation with automatic retry on connection errors
   */
  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    operationName: string = 'Operation'
  ): Promise<T> => {
    retryCount.value = 0
    lastError.value = null
    isRetrying.value = false

    while (retryCount.value < maxAttempts) {
      try {
        return await operation()
      } catch (error) {
        if (!isConnectionError(error)) {
          // Not a connection error, rethrow immediately
          lastError.value = error as Error
          throw error
        }

        retryCount.value++
        lastError.value = error as Error

        if (retryCount.value >= maxAttempts) {
          console.error(
            `[Connection Recovery] Max retry attempts (${maxAttempts}) reached for ${operationName}`
          )
          throw new Error(
            `${operationName} failed after ${maxAttempts} attempts: ${lastError.value.message}`
          )
        }

        // Wait before retrying
        const delay = calculateDelay(retryCount.value)
        isRetrying.value = true

        console.warn(
          `[Connection Recovery] ${operationName} failed (attempt ${retryCount.value}/${maxAttempts}). ` +
          `Retrying in ${delay}ms...`
        )

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error(`[Connection Recovery] Exhausted all retry attempts for ${operationName}`)
  }

  /**
   * Check connection status with the server
   */
  const checkConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/socket-status')
      return response.ok
    } catch (error) {
      console.warn('[Connection Recovery] Failed to check server status:', error)
      return false
    }
  }

  /**
   * Reset a specific connection on the server
   */
  const resetConnection = async (connectionId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/socket-status?action=reset&id=${encodeURIComponent(connectionId)}`,
        { method: 'POST' }
      )
      return response.ok
    } catch (error) {
      console.error('[Connection Recovery] Failed to reset connection:', error)
      return false
    }
  }

  /**
   * Notify user of connection issues
   */
  const notifyConnectionIssue = (message: string = 'Connection issue detected') => {
    const toast = useToast()
    toast.add({
      title: 'Connection Issue',
      description: message,
      icon: 'i-lucide-wifi-off',
      color: 'amber',
      timeout: 5000
    })
  }

  return {
    isRetrying: readonly(isRetrying),
    retryCount: readonly(retryCount),
    lastError: readonly(lastError),
    executeWithRetry,
    checkConnection,
    resetConnection,
    notifyConnectionIssue,
    isConnectionError
  }
}
