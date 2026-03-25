import { getConnectionStates, resetConnectionState } from '~/server/middleware/socket-handler'

/**
 * Socket Status Monitoring Endpoint
 * GET /api/socket-status - Check connection states
 * POST /api/socket-status?action=reset&id=<connectionId> - Reset a connection
 */

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const query = getQuery(event)

  if (method === 'GET') {
    // Return current connection states for monitoring
    return {
      timestamp: new Date().toISOString(),
      connections: getConnectionStates(),
      summary: {
        total: Object.keys(getConnectionStates()).length,
        healthy: Object.values(getConnectionStates()).filter((c: any) => c.connected).length
      }
    }
  }

  if (method === 'POST') {
    const action = query.action as string
    const connectionId = query.id as string

    if (action === 'reset' && connectionId) {
      resetConnectionState(connectionId)
      return {
        success: true,
        message: `Connection ${connectionId} reset`,
        timestamp: new Date().toISOString()
      }
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid action',
      message: 'Valid actions: reset. Provide id parameter.'
    })
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed'
  })
})
