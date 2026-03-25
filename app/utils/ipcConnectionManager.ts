/**
 * IPC Connection Manager with Reconnect Logic and State Guard
 * Handles socket lifecycle, automatic reconnection, and pending request management
 */

export interface IPCMessage {
  id: string
  method: string
  params?: any
  result?: any
  error?: string
}

export interface ConnectionConfig {
  maxRetries?: number
  retryDelayMs?: number
  socketPath?: string
  timeout?: number
}

interface PendingRequest {
  resolve: (value: any) => void
  reject: (reason?: any) => void
  timeout: ReturnType<typeof setTimeout>
}

export class IPCConnectionManager {
  private socket: any = null
  private isConnected = false
  private isConnecting = false
  private pendingRequests = new Map<string, PendingRequest>()
  private retryCount = 0
  private config: Required<ConnectionConfig>
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private messageId = 0

  constructor(config: ConnectionConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 5,
      retryDelayMs: config.retryDelayMs ?? 1000,
      socketPath: config.socketPath ?? '/tmp/ipc.sock',
      timeout: config.timeout ?? 30000
    }
  }

  /**
   * Guard function to prevent sending on dead socket
   */
  private ensureConnected(): boolean {
    if (!this.isConnected && !this.isConnecting) {
      console.warn('[IPC] Socket not connected, attempting to reconnect...')
      this.connect()
      return false
    }
    return this.isConnected
  }

  /**
   * Establish IPC connection with proper error handlers
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return
    }

    this.isConnecting = true

    try {
      // Simulate socket connection (in real implementation, use net.createConnection)
      this.socket = {
        on: this.setupEventHandlers.bind(this),
        write: this.sendMessage.bind(this),
        destroy: () => this.disconnect()
      }

      // Setup all event handlers
      this.setupEventHandlers('connect', () => {
        this.isConnected = true
        this.isConnecting = false
        this.retryCount = 0
        console.log('[IPC] Connection established')
      })

      this.isConnected = true
      this.isConnecting = false
    } catch (error) {
      this.isConnecting = false
      this.handleConnectionError(error)
    }
  }

  /**
   * Setup socket event handlers with proper cleanup
   */
  private setupEventHandlers(event: string, callback?: Function): void {
    // In real implementation, these would be actual socket events
    switch (event) {
      case 'connect':
        callback?.()
        break
      case 'data':
        this.handleIncomingMessage.bind(this)
        break
      case 'error':
        this.handleSocketError.bind(this)
        break
      case 'close':
        this.handleSocketClose.bind(this)
        break
    }
  }

  /**
   * Handle incoming IPC messages
   */
  private handleIncomingMessage(data: Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as IPCMessage

      if (message.id) {
        const pending = this.pendingRequests.get(message.id)
        if (pending) {
          clearTimeout(pending.timeout)
          this.pendingRequests.delete(message.id)

          if (message.error) {
            pending.reject(new Error(message.error))
          } else {
            pending.resolve(message.result)
          }
        }
      }
    } catch (error) {
      console.error('[IPC] Failed to parse incoming message:', error)
    }
  }

  /**
   * Handle socket errors
   */
  private handleSocketError(error: Error): void {
    console.error('[IPC] Socket error:', error.message)
    this.isConnected = false
    // Trigger reconnection on socket error
    this.attemptReconnect()
  }

  /**
   * Handle socket close - CRITICAL: Reject all pending requests
   * and prevent sending on dead socket
   */
  private handleSocketClose(): void {
    console.warn('[IPC] Socket connection closed')
    this.isConnected = false

    // Reject all pending requests with clear error
    const error = new Error('IPC connection closed')
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout)
      reject(error)
    })
    this.pendingRequests.clear()

    // Attempt reconnect
    this.attemptReconnect()
  }

  /**
   * Handle connection errors with retry logic
   */
  private handleConnectionError(error: any): void {
    console.error('[IPC] Connection error:', error?.message || error)
    this.attemptReconnect()
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.retryCount >= this.config.maxRetries) {
      console.error('[IPC] Max retries reached, giving up')
      this.rejectAllPending('Max reconnection attempts exceeded')
      return
    }

    // Clear any pending reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    const delay = this.config.retryDelayMs * Math.pow(2, this.retryCount)
    this.retryCount++

    console.log(
      `[IPC] Attempting reconnect (${this.retryCount}/${this.config.maxRetries}) in ${delay}ms`
    )

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connect().catch(error => {
        console.error('[IPC] Reconnect failed:', error)
      })
    }, delay)
  }

  /**
   * Send IPC request with built-in retry and timeout logic
   */
  async send(method: string, params?: any): Promise<any> {
    // Connection state guard - prevent sending on dead socket
    if (!this.ensureConnected()) {
      throw new Error('IPC socket is not connected and failed to reconnect')
    }

    const id = String(++this.messageId)
    const message: IPCMessage = { id, method, params }

    return new Promise((resolve, reject) => {
      // Setup timeout handler
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error(`IPC request timeout after ${this.config.timeout}ms`))
      }, this.config.timeout)

      // Store pending request
      this.pendingRequests.set(id, {
        resolve,
        reject,
        timeout
      })

      // Send message
      try {
        this.socket.write(JSON.stringify(message))
      } catch (error) {
        clearTimeout(timeout)
        this.pendingRequests.delete(id)
        this.isConnected = false
        reject(error)
      }
    })
  }

  /**
   * Send message through socket
   */
  private sendMessage(data: string): void {
    if (!this.isConnected) {
      throw new Error('Cannot send on disconnected socket')
    }
    // In real implementation, this would write to the actual socket
    console.log('[IPC] Sending:', data)
  }

  /**
   * Reject all pending requests with a specific error
   */
  private rejectAllPending(message: string): void {
    const error = new Error(message)
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout)
      reject(error)
    })
    this.pendingRequests.clear()
  }

  /**
   * Gracefully disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.isConnected = false
    this.isConnecting = false

    this.rejectAllPending('Connection closed by client')

    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }

    console.log('[IPC] Disconnected')
  }

  /**
   * Get current connection status
   */
  getStatus(): {
    isConnected: boolean
    isConnecting: boolean
    pendingRequests: number
    retryCount: number
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      pendingRequests: this.pendingRequests.size,
      retryCount: this.retryCount
    }
  }
}

/**
 * Create a singleton instance with retry wrapper
 */
let ipcManager: IPCConnectionManager | null = null

export function getIPCManager(config?: ConnectionConfig): IPCConnectionManager {
  if (!ipcManager) {
    ipcManager = new IPCConnectionManager(config)
  }
  return ipcManager
}

/**
 * Helper to wrap IPC calls with automatic retry on connection failure
 */
export async function withIPCRetry<T>(
  method: string,
  params?: any,
  maxAttempts = 3
): Promise<T> {
  const manager = getIPCManager()
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await manager.send(method, params)
      return result as T
    } catch (error) {
      lastError = error as Error
      console.warn(
        `[IPC] Attempt ${attempt}/${maxAttempts} failed:`,
        lastError.message
      )

      if (attempt < maxAttempts) {
        // Exponential backoff between retries
        const delay = 100 * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('IPC call failed after all retry attempts')
}
