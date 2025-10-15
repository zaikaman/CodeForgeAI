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
  private isConnecting: boolean = false
  private connectionPromise: Promise<void> | null = null
  private messageHandlers: Map<string, Set<(message: WebSocketMessage) => void>> = new Map()
  private connectionHandlers: Set<() => void> = new Set()
  private disconnectionHandlers: Set<() => void> = new Set()
  private errorHandlers: Set<(error: any) => void> = new Set()
  private joinedRooms: Set<string> = new Set() // Track rooms we've already joined

  constructor() {
    this.url = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  }

  async connect(options: ConnectionOptions = {}): Promise<void> {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return Promise.resolve()
    }

    if (this.isConnecting && this.connectionPromise) {
      console.log('⏳ WebSocket connection in progress, waiting...')
      return this.connectionPromise
    }

    this.isConnecting = true
    this.connectionPromise = this._doConnect(options)

    try {
      await this.connectionPromise
    } finally {
      this.isConnecting = false
      this.connectionPromise = null
    }
  }

  private async _doConnect(options: ConnectionOptions): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()

    const socketOptions = {
      autoConnect: options.autoConnect ?? true,
      reconnection: options.reconnection ?? true,
      reconnectionAttempts: options.reconnectionAttempts ?? 5,
      reconnectionDelay: options.reconnectionDelay ?? 1000,
      auth: { token: session?.access_token || '' },
      transports: ['websocket', 'polling'],
    }

    this.socket = io(this.url, socketOptions)
    this.setupEventHandlers()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('⚠️ WebSocket connection timeout')
        reject(new Error('WebSocket connection timeout'))
      }, 5000)

      this.socket?.once('connect', () => {
        clearTimeout(timeout)
        console.log('✅ WebSocket connected')
        resolve()
      })

      this.socket?.once('connect_error', (error) => {
        clearTimeout(timeout)
        console.error('❌ WebSocket connection failed:', error)
        reject(error)
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.joinedRooms.clear() // Clear room tracking on disconnect
      console.log('WebSocket disconnected')
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected')
      this.connectionHandlers.forEach((handler) => handler())
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason)
      this.disconnectionHandlers.forEach((handler) => handler())
    })

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error)
      this.errorHandlers.forEach((handler) => handler(error))
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      this.errorHandlers.forEach((handler) => handler(error))
    })

    const messageTypes = [
      'status', 'progress', 'agent_thought', 'code_chunk', 'error', 'complete',
      'job:progress', 'job:complete', 'job:agent:message', 'chat:progress', 'user:jobs:update',
    ]

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

  private handleMessage(type: string, message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.forEach((handler) => handler(message))
    }

    const wildcardHandlers = this.messageHandlers.get('*')
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message))
    }
  }

  on(type: string, handler: (message: WebSocketMessage) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    this.messageHandlers.get(type)!.add(handler)
    return () => {
      this.messageHandlers.get(type)?.delete(handler)
    }
  }

  onConnect(handler: () => void): () => void {
    this.connectionHandlers.add(handler)
    return () => {
      this.connectionHandlers.delete(handler)
    }
  }

  onDisconnect(handler: () => void): () => void {
    this.disconnectionHandlers.add(handler)
    return () => {
      this.disconnectionHandlers.delete(handler)
    }
  }

  onError(handler: (error: any) => void): () => void {
    this.errorHandlers.add(handler)
    return () => {
      this.errorHandlers.delete(handler)
    }
  }

  emit(event: string, data?: any): void {
    if (!this.socket) {
      console.warn('⚠️ Cannot emit - WebSocket not connected')
      return
    }
    
    // Prevent duplicate room joins
    if (event === 'join:user' && data) {
      const roomKey = `user:${data}`
      if (this.joinedRooms.has(roomKey)) {
        console.log(`⏩ Already joined room ${roomKey}, skipping duplicate join`)
        return
      }
      this.joinedRooms.add(roomKey)
      console.log(`🔑 Joining room: ${roomKey}`)
    }
    
    this.socket.emit(event, data)
  }

  joinRoom(room: string): void {
    this.emit('join_room', { room })
  }

  leaveRoom(room: string): void {
    this.emit('leave_room', { room })
  }

  getConnectionStatus(): boolean {
    return this.socket?.connected === true
  }

  async reconnect(): Promise<void> {
    this.disconnect()
    await this.connect()
  }
}

export const wsClient = new WebSocketClient()
export default wsClient
