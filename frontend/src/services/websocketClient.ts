import { io, Socket } from 'socket.io-client'
import { supabase } from '../lib/supabase'

export interface WebSocketMessage {
  type: 'status' | 'progress' | 'agent_thought' | 'code_chunk' | 'error' | 'complete'
  data: any
  timestamp: Date
}

export interface ConnectionOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

class WebSocketClient {
  private socket: Socket | null = null
  private url: string
  private isConnected: boolean = false
  private messageHandlers: Map<string, Set<(message: WebSocketMessage) => void>> = new Map()
  private connectionHandlers: Set<() => void> = new Set()
  private disconnectionHandlers: Set<() => void> = new Set()
  private errorHandlers: Set<(error: any) => void> = new Set()

  constructor() {
    // Use Vercel serverless WebSocket URL or local dev
    this.url = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  }

  /**
   * Connect to WebSocket server
   */
  async connect(options: ConnectionOptions = {}): Promise<void> {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return
    }

    // Get auth token
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const socketOptions = {
      autoConnect: options.autoConnect ?? true,
      reconnection: options.reconnection ?? true,
      reconnectionAttempts: options.reconnectionAttempts ?? 5,
      reconnectionDelay: options.reconnectionDelay ?? 1000,
      auth: {
        token: session?.access_token || '',
      },
      transports: ['websocket', 'polling'],
    }

    this.socket = io(this.url, socketOptions)

    this.setupEventHandlers()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'))
      }, 10000)

      this.socket?.once('connect', () => {
        clearTimeout(timeout)
        this.isConnected = true
        console.log('WebSocket connected')
        resolve()
      })

      this.socket?.once('connect_error', (error) => {
        clearTimeout(timeout)
        console.error('WebSocket connection error:', error)
        reject(error)
      })
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      console.log('WebSocket disconnected')
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.isConnected = true
      this.connectionHandlers.forEach((handler) => handler())
    })

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false
      console.log('WebSocket disconnected:', reason)
      this.disconnectionHandlers.forEach((handler) => handler())
    })

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
      this.errorHandlers.forEach((handler) => handler(error))
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.errorHandlers.forEach((handler) => handler(error))
    })

    // Listen for all message types
    const messageTypes = ['status', 'progress', 'agent_thought', 'code_chunk', 'error', 'complete']

    messageTypes.forEach((type) => {
      this.socket?.on(type, (data: any) => {
        const message: WebSocketMessage = {
          type: type as any,
          data,
          timestamp: new Date(),
        }
        this.handleMessage(type, message)
      })
    })
  }

  /**
   * Handle incoming message
   */
  private handleMessage(type: string, message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.forEach((handler) => handler(message))
    }

    // Also trigger wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*')
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message))
    }
  }

  /**
   * Subscribe to message type
   */
  on(type: string, handler: (message: WebSocketMessage) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    this.messageHandlers.get(type)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler)
    }
  }

  /**
   * Subscribe to connection event
   */
  onConnect(handler: () => void): () => void {
    this.connectionHandlers.add(handler)
    return () => {
      this.connectionHandlers.delete(handler)
    }
  }

  /**
   * Subscribe to disconnection event
   */
  onDisconnect(handler: () => void): () => void {
    this.disconnectionHandlers.add(handler)
    return () => {
      this.disconnectionHandlers.delete(handler)
    }
  }

  /**
   * Subscribe to error event
   */
  onError(handler: (error: any) => void): () => void {
    this.errorHandlers.add(handler)
    return () => {
      this.errorHandlers.delete(handler)
    }
  }

  /**
   * Emit event to server
   */
  emit(event: string, data?: any): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected')
    }
    this.socket.emit(event, data)
  }

  /**
   * Join a room (for targeted messages)
   */
  joinRoom(room: string): void {
    this.emit('join_room', { room })
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.emit('leave_room', { room })
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  /**
   * Reconnect manually
   */
  async reconnect(): Promise<void> {
    this.disconnect()
    await this.connect()
  }
}

// Singleton instance
export const wsClient = new WebSocketClient()

// Export for use in components
export default wsClient
