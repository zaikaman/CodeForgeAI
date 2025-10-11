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
    completeGeneration,
    failGeneration,
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

        // Now poll for completion using the backend UUID
        setLoading(true, 'Generation queued, waiting to start...')
        
        const pollInterval = 2000 // 2 seconds
        const timeout = 300000 // 5 minutes
        const startTime = Date.now()

        // Poll until complete
        const pollForCompletion = async (): Promise<void> => {
          while (Date.now() - startTime < timeout) {
            const statusResponse = await apiClient.getGenerationStatus(backendGenerationId)
            
            if (!statusResponse.success || !statusResponse.data) {
              throw new Error('Failed to get generation status')
            }

            const { status } = statusResponse.data

            // Update loading message based on status
            if (status === 'pending') {
              setLoading(true, 'Generation queued, waiting to start...')
            } else if (status === 'processing') {
              setLoading(true, 'Generating code with AI agents...')
            } else if (status === 'completed') {
              setLoading(true, 'Finalizing generation...')
              completeGeneration(backendGenerationId, statusResponse.data)
              showToast('success', 'Code generated successfully!')
              return
            } else if (status === 'failed') {
              throw new Error(statusResponse.data.error || 'Generation failed')
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval))
          }

          throw new Error('Generation timeout - process took too long')
        }

        await pollForCompletion()
        return backendGenerationId
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to generate code'
        setError(errorMessage)
        
        // Get the generation ID from the store
        const { currentGeneration: current } = useGenerationStore.getState()
        if (current?.id) {
          failGeneration(current.id, errorMessage)
        }
        
        showToast('error', errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [startGenerationWithId, completeGeneration, failGeneration, setLoading, showToast]
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
