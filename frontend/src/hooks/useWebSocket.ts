import { useEffect, useCallback, useRef, useState } from 'react'
import wsClient, { WebSocketMessage } from '../services/websocketClient'
import { useGenerationStore } from '../stores/generationStore'
import { AgentMessage } from '../components/AgentChat'

export interface UseWebSocketReturn {
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  emit: (event: string, data?: any) => void
  subscribe: (type: string, handler: (message: WebSocketMessage) => void) => () => void
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const { updateProgress, addAgentMessage } = useGenerationStore()
  const handlersRef = useRef<Array<() => void>>([])

  useEffect(() => {
    // Setup default handlers
    const unsubscribeProgress = wsClient.on('progress', (message) => {
      if (message.data.progress !== undefined) {
        updateProgress(message.data.progress)
      }
    })

    const unsubscribeAgentThought = wsClient.on('agent_thought', (message) => {
      const agentMessage: AgentMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agent: message.data.agent || 'System',
        role: message.data.role || 'agent',
        content: message.data.content || message.data.thought || '',
        timestamp: new Date(message.timestamp),
        toolCalls: message.data.toolCalls,
      }
      addAgentMessage(agentMessage)
    })

    const unsubscribeConnect = wsClient.onConnect(() => {
      console.log('WebSocket connected')
      setIsConnected(true)
    })

    const unsubscribeDisconnect = wsClient.onDisconnect(() => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    const unsubscribeError = wsClient.onError((error) => {
      console.error('WebSocket error:', error)
    })

    handlersRef.current = [
      unsubscribeProgress,
      unsubscribeAgentThought,
      unsubscribeConnect,
      unsubscribeDisconnect,
      unsubscribeError,
    ]

    // Auto-connect on mount
    wsClient.connect().catch((err) => {
      console.error('Failed to connect WebSocket:', err)
    })

    // Cleanup on unmount
    return () => {
      handlersRef.current.forEach((unsub) => unsub())
      wsClient.disconnect()
    }
  }, [updateProgress, addAgentMessage])

  const connect = useCallback(async () => {
    try {
      await wsClient.connect()
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to connect:', error)
      throw error
    }
  }, [])

  const disconnect = useCallback(() => {
    wsClient.disconnect()
    setIsConnected(false)
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    wsClient.emit(event, data)
  }, [])

  const subscribe = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    return wsClient.on(type, handler)
  }, [])

  return {
    isConnected,
    connect,
    disconnect,
    emit,
    subscribe,
  }
}
