import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AgentMessage } from '../components/AgentChat'
import { GenerateRequest, GenerateResponse } from '../services/apiClient'

export interface GenerationHistoryEntry {
  id: string
  prompt: string
  request: GenerateRequest
  response: GenerateResponse | null
  status: 'pending' | 'generating' | 'completed' | 'error'
  error?: string
  agentMessages: AgentMessage[]
  startedAt: Date
  completedAt?: Date
  duration?: number
}

interface GenerationState {
  // Current generation
  currentGeneration: GenerationHistoryEntry | null
  isGenerating: boolean
  progress: number
  agentMessages: AgentMessage[]

  // Generation history
  history: GenerationHistoryEntry[]

  // Actions
  startGeneration: (request: GenerateRequest) => string
  updateProgress: (progress: number) => void
  addAgentMessage: (message: AgentMessage) => void
  completeGeneration: (generationId: string, response: GenerateResponse) => void
  failGeneration: (generationId: string, error: string) => void
  clearCurrent: () => void
  clearHistory: () => void
  removeFromHistory: (generationId: string) => void
  getGenerationById: (generationId: string) => GenerationHistoryEntry | undefined
}

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentGeneration: null,
      isGenerating: false,
      progress: 0,
      agentMessages: [],
      history: [],

      // Start a new generation
      startGeneration: (request: GenerateRequest) => {
        const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const newGeneration: GenerationHistoryEntry = {
          id: generationId,
          prompt: request.prompt,
          request,
          response: null,
          status: 'generating',
          agentMessages: [],
          startedAt: new Date(),
        }

        set({
          currentGeneration: newGeneration,
          isGenerating: true,
          progress: 0,
          agentMessages: [],
        })

        return generationId
      },

      // Update progress
      updateProgress: (progress: number) => {
        set({ progress })

        const { currentGeneration } = get()
        if (currentGeneration) {
          set({
            currentGeneration: {
              ...currentGeneration,
              status: 'generating',
            },
          })
        }
      },

      // Add agent message
      addAgentMessage: (message: AgentMessage) => {
        set((state) => ({
          agentMessages: [...state.agentMessages, message],
          currentGeneration: state.currentGeneration
            ? {
                ...state.currentGeneration,
                agentMessages: [...state.currentGeneration.agentMessages, message],
              }
            : null,
        }))
      },

      // Complete generation
      completeGeneration: (generationId: string, response: GenerateResponse) => {
        const { currentGeneration, history } = get()

        if (currentGeneration && currentGeneration.id === generationId) {
          const completedAt = new Date()
          const duration = completedAt.getTime() - currentGeneration.startedAt.getTime()

          const completedGeneration: GenerationHistoryEntry = {
            ...currentGeneration,
            response,
            status: 'completed',
            completedAt,
            duration,
          }

          set({
            currentGeneration: completedGeneration,
            isGenerating: false,
            progress: 100,
            history: [completedGeneration, ...history],
          })
        }
      },

      // Fail generation
      failGeneration: (generationId: string, error: string) => {
        const { currentGeneration, history } = get()

        if (currentGeneration && currentGeneration.id === generationId) {
          const completedAt = new Date()
          const duration = completedAt.getTime() - currentGeneration.startedAt.getTime()

          const failedGeneration: GenerationHistoryEntry = {
            ...currentGeneration,
            status: 'error',
            error,
            completedAt,
            duration,
          }

          set({
            currentGeneration: failedGeneration,
            isGenerating: false,
            progress: 0,
            history: [failedGeneration, ...history],
          })
        }
      },

      // Clear current generation
      clearCurrent: () => {
        set({
          currentGeneration: null,
          isGenerating: false,
          progress: 0,
          agentMessages: [],
        })
      },

      // Clear history
      clearHistory: () => {
        set({ history: [] })
      },

      // Remove from history
      removeFromHistory: (generationId: string) => {
        set((state) => ({
          history: state.history.filter((entry) => entry.id !== generationId),
        }))
      },

      // Get generation by ID
      getGenerationById: (generationId: string) => {
        const { history, currentGeneration } = get()

        if (currentGeneration?.id === generationId) {
          return currentGeneration
        }

        return history.find((entry) => entry.id === generationId)
      },
    }),
    {
      name: 'codeforge-generation-storage',
      partialize: (state) => ({
        history: state.history.slice(0, 50), // Keep last 50 generations
      }),
    }
  )
)
