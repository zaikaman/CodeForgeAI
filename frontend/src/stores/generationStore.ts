import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AgentMessage } from '../components/AgentChat'
import { GenerateRequest, GenerateResponse } from '../services/apiClient'

export interface GenerationHistoryEntry {
  id: string
  prompt: string
  request: GenerateRequest
  response: GenerateResponse | null
  status: 'pending' | 'generating' | 'processing' | 'completed' | 'error' | 'failed'
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
  updateGenerationFiles: (generationId: string, files: Array<{ path: string; content: string }>) => void
  setIsGenerating: (isGenerating: boolean) => void
  addMessageToGeneration: (generationId: string, message: AgentMessage) => void
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
        set((state) => {
          const newAgentMessages = [...state.agentMessages, message];
          
          // Update current generation if it exists
          const updatedCurrentGeneration = state.currentGeneration
            ? {
                ...state.currentGeneration,
                agentMessages: [...state.currentGeneration.agentMessages, message],
              }
            : null;

          // Also update in history if current generation exists there
          let updatedHistory = state.history;
          if (state.currentGeneration) {
            const historyIndex = state.history.findIndex(
              (entry) => entry.id === state.currentGeneration!.id
            );
            if (historyIndex !== -1) {
              updatedHistory = [...state.history];
              updatedHistory[historyIndex] = {
                ...updatedHistory[historyIndex],
                agentMessages: [...updatedHistory[historyIndex].agentMessages, message],
              };
            }
          }

          return {
            agentMessages: newAgentMessages,
            currentGeneration: updatedCurrentGeneration,
            history: updatedHistory,
          };
        });
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

          // Note: Generation is already saved in backend via async process
          // No need to save again to Supabase from frontend
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

      // Update generation files (for chat modifications)
      updateGenerationFiles: (generationId: string, files: Array<{ path: string; content: string }>) => {
        const { currentGeneration, history } = get()

        // Update current generation if it matches
        if (currentGeneration?.id === generationId && currentGeneration.response) {
          const updatedGeneration = {
            ...currentGeneration,
            response: {
              ...currentGeneration.response,
              files,
            },
          }

          set({
            currentGeneration: updatedGeneration,
          })

          // Also update in history if it exists there
          const historyIndex = history.findIndex((entry) => entry.id === generationId)
          if (historyIndex !== -1) {
            const updatedHistory = [...history]
            updatedHistory[historyIndex] = updatedGeneration
            set({ history: updatedHistory })
          }
        } else {
          // Update in history only
          const historyIndex = history.findIndex((entry) => entry.id === generationId)
          if (historyIndex !== -1 && history[historyIndex].response) {
            const updatedHistory = [...history]
            updatedHistory[historyIndex] = {
              ...updatedHistory[historyIndex],
              response: {
                ...updatedHistory[historyIndex].response!,
                files,
              },
            }
            set({ history: updatedHistory })
          }
        }
      },

      // Set isGenerating state
      setIsGenerating: (isGenerating: boolean) => {
        set({ isGenerating })
      },

      // Add message to specific generation
      addMessageToGeneration: (generationId: string, message: AgentMessage) => {
        set((state) => {
          // Update current generation if it matches
          let updatedCurrentGeneration = state.currentGeneration;
          if (state.currentGeneration?.id === generationId) {
            updatedCurrentGeneration = {
              ...state.currentGeneration,
              agentMessages: [...state.currentGeneration.agentMessages, message],
            };
          }

          // Update in history
          const historyIndex = state.history.findIndex((entry) => entry.id === generationId);
          let updatedHistory = state.history;
          if (historyIndex !== -1) {
            updatedHistory = [...state.history];
            updatedHistory[historyIndex] = {
              ...updatedHistory[historyIndex],
              agentMessages: [...updatedHistory[historyIndex].agentMessages, message],
            };
          }

          // Also update agentMessages if this is the current generation
          const updatedAgentMessages = state.currentGeneration?.id === generationId
            ? [...state.agentMessages, message]
            : state.agentMessages;

          return {
            currentGeneration: updatedCurrentGeneration,
            history: updatedHistory,
            agentMessages: updatedAgentMessages,
          };
        });
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