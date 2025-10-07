import { useState, useCallback } from 'react'
import { useGenerationStore } from '../stores/generationStore'
import { useUIStore } from '../stores/uiStore'
import apiClient, { GenerateRequest, GenerateResponse } from '../services/apiClient'
import { AgentMessage } from '../components/AgentChat'

export interface UseGenerationReturn {
  // State
  isGenerating: boolean
  progress: number
  agentMessages: AgentMessage[]
  currentGeneration: any
  error: string | null

  // Actions
  generate: (request: GenerateRequest) => Promise<void>
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
    startGeneration,
    completeGeneration,
    failGeneration,
    clearCurrent,
  } = useGenerationStore()

  const { setLoading, showToast } = useUIStore()

  const generate = useCallback(
    async (request: GenerateRequest) => {
      try {
        setError(null)
        setLoading(true, 'Initializing code generation...')

        // Start generation in store
        const generationId = startGeneration(request)

        // Call API
        const response = await apiClient.generate(request)

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Generation failed')
        }

        // Complete generation
        completeGeneration(generationId, response.data)

        showToast('success', 'Code generated successfully!')
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to generate code'
        setError(errorMessage)
        failGeneration(currentGeneration?.id || '', errorMessage)
        showToast('error', errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [startGeneration, completeGeneration, failGeneration, currentGeneration, setLoading, showToast]
  )

  const cancel = useCallback(() => {
    if (currentGeneration) {
      failGeneration(currentGeneration.id, 'Cancelled by user')
      clearCurrent()
    }
  }, [currentGeneration, failGeneration, clearCurrent])

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
