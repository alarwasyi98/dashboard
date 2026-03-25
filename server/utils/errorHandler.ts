export default defineEventHandler(async (event) => {
  const error = event.node.res.statusCode === 500 || event.error
  
  if (error) {
    const errorMessage = error.message || 'Unknown error'
    
    // Handle IPC connection errors specifically
    if (errorMessage.includes('IPC connection closed')) {
      console.error('[Socket Error] IPC connection was closed. Attempting recovery...')
      
      // Return a recoverable error response
      return {
        statusCode: 503,
        statusMessage: 'Service Temporarily Unavailable',
        message: 'IPC connection temporarily unavailable. Please retry.',
        retryable: true,
        timestamp: new Date().toISOString()
      }
    }

    // Handle socket timeout errors
    if (errorMessage.includes('socket') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) {
      console.error('[Socket Error] Connection error detected:', errorMessage)
      
      return {
        statusCode: 503,
        statusMessage: 'Connection Error',
        message: 'Server connection temporarily unavailable. Please retry.',
        retryable: true,
        timestamp: new Date().toISOString()
      }
    }

    // Log other errors
    console.error('[Server Error]', {
      message: errorMessage,
      code: error.code,
      stack: error.stack
    })
  }
})
