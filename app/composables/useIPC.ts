import { ref, computed } from 'vue'
import { getIPCManager, withIPCRetry } from '~/utils/ipcConnectionManager'

export function useIPC() {
  const manager = getIPCManager()
  const isConnected = ref(manager.getStatus().isConnected)
  const isConnecting = ref(manager.getStatus().isConnecting)
  const pendingRequests = ref(manager.getStatus().pendingRequests)
  const retryCount = ref(manager.getStatus().retryCount)

  // Update status reactively
  const updateStatus = () => {
    const status = manager.getStatus()
    isConnected.value = status.isConnected
    isConnecting.value = status.isConnecting
    pendingRequests.value = status.pendingRequests
    retryCount.value = status.retryCount
  }

  // Poll status every 1 second
  setInterval(updateStatus, 1000)

  /**
   * Make an IPC call with automatic retry logic
   */
  const call = async <T = any>(
    method: string,
    params?: any,
    options: { maxRetries?: number } = {}
  ): Promise<T> => {
    try {
      updateStatus()
      const result = await withIPCRetry<T>(
        method,
        params,
        options.maxRetries ?? 3
      )
      updateStatus()
      return result
    } catch (error) {
      updateStatus()
      throw error
    }
  }

  /**
   * Connect to IPC socket
   */
  const connect = async () => {
    try {
      await manager.connect()
      updateStatus()
    } catch (error) {
      console.error('[IPC Composable] Connection failed:', error)
      throw error
    }
  }

  /**
   * Disconnect from IPC socket
   */
  const disconnect = async () => {
    await manager.disconnect()
    updateStatus()
  }

  return {
    // Reactive state
    isConnected: computed(() => isConnected.value),
    isConnecting: computed(() => isConnecting.value),
    pendingRequests: computed(() => pendingRequests.value),
    retryCount: computed(() => retryCount.value),

    // Methods
    call,
    connect,
    disconnect,
    getStatus: () => manager.getStatus()
  }
}
