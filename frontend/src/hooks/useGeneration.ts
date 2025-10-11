import { useState, useCallback } from 'react'
import { useGenerationStore } from '../stores/generationStore'
import { useUIStore } from '../stores/uiStore'
import apiClient, { GenerateRequest } from '../services/apiClient'
import { AgentMessage } from '../components/AgentChat'

export interface UseGenerationReturn {
  // State
  isGenerating: boolean
  progress: number
  agentMessages: AgentMessage[]
  currentGeneration: any
  error: string | null

  // Actions
  generate: (request: GenerateRequest) => Promise<string | null>
  cancel: () => void
  clear: () => void
}

export const useGeneration = (): UseGenerationReturn => {
  const [error, setError] = useState<string | null>(null)

  const {
    currentGeneration,
    isGenerating,
    progress,
    agentMessages,
    startGenerationWithId,
    clearCurrent,
  } = useGenerationStore()

  const { setLoading, showToast } = useUIStore()

  const generate = useCallback(
    async (request: GenerateRequest): Promise<string | null> => {
      try {
        setError(null)
        setLoading(true, 'Initializing code generation...')

        // First, call API to create generation and get backend UUID
        const startResponse = await apiClient.generate(request)
        
        if (!startResponse.success || !startResponse.data?.id) {
          throw new Error(startResponse.error || 'Failed to start generation')
        }

        const backendGenerationId = startResponse.data.id
        console.log(`[useGeneration] Backend created generation with ID: ${backendGenerationId}`)
        
        // Create store entry with backend UUID
        startGenerationWithId(backendGenerationId, request)

        // Return the ID immediately so user can be redirected
        // The GenerateSessionPage will handle polling for updates
        return backendGenerationId
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to generate code'
        setError(errorMessage)
        
        showToast('error', errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [startGenerationWithId, setLoading, showToast]
  )

  const cancel = useCallback(() => {
    if (currentGeneration) {
      clearCurrent()
    }
  }, [currentGeneration, clearCurrent])

  const clear = useCallback(() => {
    setError(null)
    clearCurrent()
  }, [clearCurrent])

  return {
    isGenerating,
    progress,
    agentMessages,
    currentGeneration,
    error,
    generate,
    cancel,
    clear,
  }
}
