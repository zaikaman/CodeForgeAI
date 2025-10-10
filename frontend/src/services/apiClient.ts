import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import { supabase } from '../lib/supabase'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface OnboardRequest {
  repositoryPath: string
  projectName: string
  language: string
}

export interface OnboardResponse {
  projectId: string
  filesScanned: number
  embeddingsCount: number
  message: string
}

export interface GenerateRequest {
  prompt: string
  projectId?: string
  projectContext?: string
  includeTests: boolean
  includeDocumentation: boolean
  targetLanguage: string
  complexity: 'simple' | 'moderate' | 'complex'
  agents: string[]
  imageUrls?: string[]
}

export interface GenerateResponse {
  files: Array<{
    path: string
    content: string
  }>
  language: string
  agentThoughts: Array<{
    agent: string
    thought: string
  }>
}

export interface ReviewRequest {
  code: string
  language: string
  options?: {
    checkSecurity?: boolean
    checkPerformance?: boolean
    checkStyle?: boolean
  }
}

export interface ReviewResponse {
  findings: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
    title: string
    description: string
    file?: string
    line?: number
    category: string
    suggestion?: string
  }>
  overallScore: number
  summary: string
}

export interface EnhanceRequest {
  code: string
  language: string
  enhancementType: 'refactor' | 'optimize' | 'security' | 'all'
}

export interface EnhanceResponse {
  proposals: Array<{
    title: string
    description: string
    diff: string
    impact: string
  }>
  message: string
}

export interface ChatRequest {
  generationId: string
  message: string
  currentFiles: Array<{
    path: string
    content: string
  }>
  language: string
  imageUrls?: string[]
}

export interface ChatResponse {
  files: Array<{
    path: string
    content: string
  }>
  agentThought: {
    agent: string
    thought: string
  }
}

export interface UserSettings {
  userId: string
  apiKey?: string
  hasApiKey?: boolean
  theme?: 'blue' | 'green'
  crtEffects?: boolean
  phosphorGlow?: boolean
  autoScrollChat?: boolean
  soundEffects?: boolean
  createdAt?: string
  updatedAt?: string
}

class ApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    // Use Vercel serverless function URL or local dev
    this.baseURL =
      import.meta.env.VITE_API_URL || 'http://localhost:3000'

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 290000, // 290 seconds (almost 5 minutes) for long-running LLM operations
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`
          }

          return config
        } catch (error) {
          // Don't throw - allow request to proceed without auth
          return config
        }
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return this.handleError(error)
      }
    )
  }

  private handleError(error: AxiosError): Promise<never> {
    console.error('🔥 [apiClient] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      request: error.request ? 'Request was made' : 'No request',
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      }
    })

    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const data: any = error.response.data

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          console.error('Unauthorized access - please log in')
          window.location.href = '/login'
          break
        case 403:
          console.error('Forbidden - insufficient permissions')
          break
        case 404:
          console.error('Resource not found')
          break
        case 429:
          console.error('Rate limit exceeded - please try again later')
          break
        case 500:
          console.error('Server error - please try again')
          break
        default:
          console.error(`API error (${status}):`, data?.message || error.message)
      }

      return Promise.reject({
        status,
        message: data?.message || data?.error || error.message,
        data: data,
      })
    } else if (error.request) {
      // Request made but no response received
      console.error('❌ [apiClient] Network error - no response from server')
      console.error('❌ [apiClient] This usually means CORS issue or backend is not running')
      return Promise.reject({
        status: 0,
        message: 'Network error - please check your connection',
      })
    } else {
      // Something else happened
      console.error('Request error:', error.message)
      return Promise.reject({
        status: -1,
        message: error.message,
      })
    }
  }

  // Health check
  async getStatus(): Promise<ApiResponse> {
    const response = await this.client.get('/api/status')
    return response.data
  }

  // Onboard project
  async onboard(request: OnboardRequest): Promise<ApiResponse<OnboardResponse>> {
    const response = await this.client.post('/api/onboard', request)
    return response.data
  }

  // Generate code
  async generate(request: GenerateRequest): Promise<ApiResponse<GenerateResponse>> {
    const response = await this.client.post('/api/generate', request)
    return response.data
  }

  // Review code
  async review(request: ReviewRequest): Promise<ApiResponse<ReviewResponse>> {
    const response = await this.client.post('/api/review', request)
    return response.data
  }

  // Enhance code
  async enhance(request: EnhanceRequest): Promise<ApiResponse<EnhanceResponse>> {
    const response = await this.client.post('/api/enhance', request)
    return response.data
  }

  // Get projects
  async getProjects(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/api/projects')
    return response.data
  }

  // Get project by ID
  async getProject(projectId: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/api/projects/${projectId}`)
    return response.data
  }

  // Get generation history
  async getHistory(projectId?: string): Promise<ApiResponse<any[]>> {
    const params = projectId ? { projectId } : {}
    const response = await this.client.get('/api/history', { params })
    return response.data
  }

  // Get generation by ID
  async getGeneration(generationId: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/api/history/${generationId}`)
    return response.data
  }

  // Settings endpoints

  // Get user settings
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    const response = await this.client.get('/api/settings')
    return response.data
  }

  // Update API key
  async updateApiKey(apiKey: string): Promise<ApiResponse> {
    const response = await this.client.put('/api/settings/api-key', { apiKey })
    return response.data
  }

  // Update preferences
  async updatePreferences(preferences: {
    theme?: 'blue' | 'green'
    crtEffects?: boolean
    phosphorGlow?: boolean
    autoScrollChat?: boolean
    soundEffects?: boolean
  }): Promise<ApiResponse> {
    const response = await this.client.put('/api/settings/preferences', preferences)
    return response.data
  }

  // Delete API key
  async deleteApiKey(): Promise<ApiResponse> {
    const response = await this.client.delete('/api/settings/api-key')
    return response.data
  }

  // Delete all settings
  async deleteSettings(): Promise<ApiResponse> {
    const response = await this.client.delete('/api/settings')
    return response.data
  }

  // Chat with AI to modify generation
  async chat(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    const response = await this.client.post('/api/chat', request)
    return response.data
  }

  // Get chat history for a generation
  async getChatHistory(generationId: string, limit?: number): Promise<ApiResponse<{
    messages: Array<{
      id: string
      generationId: string
      role: 'user' | 'assistant' | 'system'
      content: string
      imageUrls?: string[]
      tokenCount?: number
      metadata?: Record<string, any>
      createdAt: string
    }>
    totalCount: number
    returnedCount: number
  }>> {
    const params = limit ? { limit: limit.toString() } : {}
    const response = await this.client.get(`/api/chat/history/${generationId}`, { params })
    return response.data
  }

  // Custom request method for advanced use cases
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request<ApiResponse<T>>(config)
    return response.data
  }
}

// Singleton instance
export const apiClient = new ApiClient()

// Export for use in components
export default apiClient
