import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AgentMessage } from '../components/AgentChat'
import apiClient, { GenerateRequest, GenerateResponse } from '../services/apiClient'

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
  startGenerationWithId: (generationId: string, request: GenerateRequest) => void
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
  loadHistoryFromBackend: () => Promise<void>
  setHistory: (history: GenerationHistoryEntry[]) => void
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

      // Start a new generation (legacy - creates local ID)
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

      // Start a new generation with backend-provided ID
      startGenerationWithId: (generationId: string, request: GenerateRequest) => {
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

        // Match either by generationId or if current generation exists (to handle ID updates)
        if (currentGeneration) {
          const completedAt = new Date()
          const duration = completedAt.getTime() - currentGeneration.startedAt.getTime()

          const completedGeneration: GenerationHistoryEntry = {
            ...currentGeneration,
            id: generationId, // Update with backend generation ID
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

      // Load history from backend (Supabase)
      loadHistoryFromBackend: async () => {
        try {
          const response = await apiClient.getHistory();
          
          if (response.success && response.data) {
            // Merge backend history with local history
            // Backend is source of truth, but keep any local pending generations
            const { history: localHistory } = get();
            const pendingLocal = localHistory.filter(
              (local) => local.status === 'generating' || local.status === 'pending'
            );

            // Convert backend data to GenerationHistoryEntry format
            const backendHistory: GenerationHistoryEntry[] = response.data.map((item: any) => ({
              id: item.id,
              prompt: item.request.prompt,
              request: item.request,
              response: item.response,
              status: item.status,
              error: item.error,
              agentMessages: item.agentMessages || [],
              startedAt: new Date(item.startedAt),
              completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
              duration: item.duration,
            }));

            // Merge: backend history + local pending (that aren't in backend yet)
            const backendIds = new Set(backendHistory.map((h) => h.id));
            const uniquePendingLocal = pendingLocal.filter((local) => !backendIds.has(local.id));

            set({
              history: [...uniquePendingLocal, ...backendHistory],
            });

            console.log(`[GenerationStore] Loaded ${backendHistory.length} generations from backend`);
          }
        } catch (error) {
          console.error('[GenerationStore] Failed to load history from backend:', error);
          // Keep local history if backend fetch fails
        }
      },

      // Set history directly (useful for sync operations)
      setHistory: (history: GenerationHistoryEntry[]) => {
        set({ history });
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