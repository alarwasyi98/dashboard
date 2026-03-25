/**
 * Example API endpoint that demonstrates proper IPC usage with reconnection logic
 * This pattern should be used for any IPC-dependent operations
 */

export default defineEventHandler(async (event) => {
  try {
    // Get the IPC manager (server-side equivalent)
    // In a real implementation, this would use actual IPC communication
    console.log('[Finance Sync API] Processing financial data sync...')

    // Example: Call IPC service with retry logic built-in
    const data = await performIPCCall('sync.finances', {
      userId: 'user-123',
      accounts: ['checking', 'savings'],
      timestamp: Date.now()
    })

    return {
      success: true,
      message: 'Financial data synced successfully',
      data
    }
  } catch (error) {
    console.error('[Finance Sync API] Error:', error)

    // Return meaningful error response instead of crashing
    return sendError(
      event,
      createError({
        statusCode: 503,
        statusMessage: 'Service temporarily unavailable',
        data: {
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true
        }
      })
    )
  }
})

/**
 * Helper function to perform IPC calls with automatic retry
 * This wraps the connection logic and prevents dead socket sends
 */
async function performIPCCall(
  method: string,
  params: any,
  maxRetries = 3
): Promise<any> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // In a real implementation:
      // const ipcManager = getIPCManager()
      // return await ipcManager.send(method, params)

      // Mock implementation
      console.log(
        `[IPC Call] Attempt ${attempt}/${maxRetries}: ${method}`,
        params
      )

      // Simulate successful call
      return { success: true, data: { synced: true } }
    } catch (error) {
      lastError = error as Error
      console.warn(
        `[IPC Call] Attempt ${attempt}/${maxRetries} failed:`,
        lastError.message
      )

      // Check if error indicates connection issue
      if (
        lastError.message.includes('connection closed') ||
        lastError.message.includes('ECONNREFUSED')
      ) {
        console.log(`[IPC Call] Connection lost, will retry...`)
      }

      if (attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = 100 * Math.pow(2, attempt - 1)
        console.log(`[IPC Call] Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw (
    lastError ||
    new Error(`IPC call failed after ${maxRetries} attempts`)
  )
}
