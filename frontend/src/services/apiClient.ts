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
}

export interface GenerateResponse {
  code: string
  language: string
  validation: {
    syntaxValid: boolean
    errors: string[]
  }
  confidence: number
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

class ApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    // Use Vercel serverless function URL or local dev
    this.baseURL =
      import.meta.env.VITE_API_URL || 'http://localhost:3001'

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60 seconds for long-running operations
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`
        }

        return config
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
      console.error('Network error - no response from server')
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
