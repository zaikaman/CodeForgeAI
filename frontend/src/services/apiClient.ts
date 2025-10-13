import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import { supabase } from '../lib/supabase'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface GenerateRequest {
  prompt: string
  projectId?: string
  projectContext?: string
  targetLanguage: string
  complexity: 'simple' | 'moderate' | 'complex'
  agents: string[]
  imageUrls?: string[]
  autoPreview?: boolean // DEPRECATED - auto-preview is now disabled, use /api/deploy endpoint instead
}

export interface GenerateResponse {
  id?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
  prompt?: string
  targetLanguage?: string
  complexity?: 'simple' | 'moderate' | 'complex'
  files?: Array<{
    path: string
    content: string
  }>
  language?: string
  agentThoughts?: Array<{
    agent: string
    thought: string
  }>
  error?: string
  previewUrl?: string
  deploymentStatus?: 'pending' | 'deploying' | 'deployed' | 'failed'
  createdAt?: string
  updatedAt?: string
}

export interface ChatRequest {
  generationId: string
  message: string
  currentFiles: Array<{
    path: string
    content: string
  }>
  language?: string // Optional - let backend auto-detect (vanilla HTML vs TypeScript)
  imageUrls?: string[]
  githubContext?: {
    token: string
    username: string
    email?: string
  }
}

export interface ChatResponse {
  jobId?: string
  status?: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
  generationId?: string
  files?: Array<{
    path: string
    content: string
  }>
  agentThought?: {
    agent: string
    thought: string
  }
  error?: string
  createdAt?: string
  updatedAt?: string
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
      // 30 seconds - backend returns jobId immediately for long tasks
      // For long-running operations (generate fullstack app, chat modifications):
      //   1. Backend returns jobId instantly (within 30s)
      //   2. Frontend polls status using jobId (no timeout limit)
      //   3. Agent thoughts stream via WebSocket or saved to DB
      timeout: 30000, 
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => {
        // Don't throw on any status code - we'll handle it in interceptor
        return status >= 200 && status < 600
      },
      transformResponse: [
        (data) => {
          // Safely parse JSON, catch HTML responses
          if (typeof data === 'string') {
            // Check if response looks like HTML
            if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
              console.warn('⚠️ [apiClient] Received HTML response instead of JSON')
              console.warn('⚠️ [apiClient] HTML preview:', data.substring(0, 500))
              return {
                success: false,
                data: undefined, // Keep consistent with ApiResponse type
                error: 'Server returned HTML instead of JSON. Backend may not be available.',
                isHtmlResponse: true
              }
            }
            
            // Try to parse as JSON
            try {
              const parsed = JSON.parse(data)
              // Ensure parsed response has expected structure
              if (typeof parsed === 'object' && parsed !== null) {
                // If backend already returned {success, data}, use it as is
                if ('success' in parsed) {
                  return parsed
                }
                // If backend returned raw data, wrap it
                return {
                  success: true,
                  data: parsed
                }
              }
              return parsed
            } catch (e) {
              console.error('❌ [apiClient] Failed to parse response as JSON:', e)
              console.error('❌ [apiClient] Raw data preview:', data.substring(0, 500))
              return {
                success: false,
                data: undefined, // Keep consistent
                error: 'Invalid JSON response from server',
                rawData: data.substring(0, 200)
              }
            }
          }
          
          // Data is already an object (parsed by axios default)
          if (typeof data === 'object' && data !== null) {
            // Ensure it has expected structure
            if ('success' in data) {
              return data
            }
            // Wrap raw object
            return {
              success: true,
              data: data
            }
          }
          
          return data
        }
      ]
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
            console.log(`[apiClient] ✓ Adding auth token to ${config.method?.toUpperCase()} ${config.url}`)
          } else {
            console.warn(`[apiClient] ✗ No session found for ${config.method?.toUpperCase()} ${config.url}`)
          }

          return config
        } catch (error) {
          console.error('[apiClient] Error getting session:', error)
          // Don't throw - allow request to proceed without auth
          return config
        }
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle errors and validate JSON
    this.client.interceptors.response.use(
      (response) => {
        // Validate response is JSON
        const contentType = response.headers['content-type']
        if (contentType && !contentType.includes('application/json')) {
          console.warn('⚠️ [apiClient] Non-JSON response received:', {
            url: response.config.url,
            contentType,
            status: response.status,
          })
        }
        return response
      },
      (error: AxiosError) => {
        // Check if error response is HTML instead of JSON
        if (error.response) {
          const contentType = error.response.headers['content-type']
          
          // Debug logging for all errors
          console.error('🔍 [apiClient] Response error debug:', {
            url: error.config?.url,
            status: error.response.status,
            contentType,
            dataType: typeof error.response.data,
            dataPreview: typeof error.response.data === 'string' 
              ? error.response.data.substring(0, 200) 
              : JSON.stringify(error.response.data).substring(0, 200),
          });
          
          if (contentType && contentType.includes('text/html')) {
            console.error('❌ [apiClient] Server returned HTML instead of JSON')
            console.error('❌ [apiClient] This usually means the API endpoint does not exist or backend is not properly deployed')
            
            // Try to extract error info from HTML if available
            const htmlData = error.response.data
            if (typeof htmlData === 'string') {
              console.error('HTML response preview:', htmlData.substring(0, 200))
            }
            
            return Promise.reject({
              status: error.response.status,
              message: 'Server error: Invalid response format (expected JSON, got HTML)',
              isHtmlError: true,
            })
          }
        }
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

  // Generate code - starts generation and returns immediately with ID
  // For large projects, this returns a job ID and processes in background
  async generate(request: GenerateRequest): Promise<ApiResponse<GenerateResponse>> {
    // Extend timeout for initial generation request (can take time to queue)
    const response = await this.client.post('/api/generate', request, {
      timeout: 60000 // 60 seconds for queuing large projects
    })
    return response.data
  }

  // Get generation status - check progress of a generation
  // includeFull: if true, includes full files array (use sparingly, can be large)
  async getGenerationStatus(generationId: string, includeFull = false): Promise<ApiResponse<GenerateResponse>> {
    const params = includeFull ? { full: 'true' } : {};
    const response = await this.client.get(`/api/generate/${generationId}`, { params })
    
    // Debug logging
    console.log('🔍 [apiClient.getGenerationStatus] Raw axios response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : 'NO DATA',
      hasSuccess: 'success' in (response.data || {}),
      hasData: 'data' in (response.data || {}),
      successValue: response.data?.success,
      dataValue: response.data?.data,
      dataValueType: typeof response.data?.data,
      dataValueKeys: response.data?.data ? Object.keys(response.data.data) : 'NO DATA IN data',
      fullResponseData: response.data,
    });
    
    // Extra validation: check if response.data is valid
    if (!response.data || typeof response.data !== 'object') {
      console.error('❌ [apiClient.getGenerationStatus] Invalid response structure - response.data is not an object');
      return {
        success: false,
        error: 'Server error: Invalid response format'
      };
    }
    
    // If backend returned success=true but data is missing/undefined, it's an error
    if (response.data.success === true && !response.data.data) {
      console.error('❌ [apiClient.getGenerationStatus] Backend returned success=true but data is undefined/null');
      return {
        success: false,
        error: 'Server error: Invalid response format'
      };
    }
    
    return response.data
  }

  // Poll generation until complete - wrapper that handles polling automatically
  // For long-running tasks (fullstack apps), set timeout to null for unlimited polling
  // DEPRECATED: Use useGenerationPolling hook instead to poll directly from Supabase
  // This avoids backend timeout limits
  async generateAndWait(
    request: GenerateRequest,
    options?: {
      onStatusChange?: (status: string) => void
      pollInterval?: number
      timeout?: number | null // null = no timeout (unlimited)
    }
  ): Promise<ApiResponse<GenerateResponse>> {
    // Start generation
    const startResponse = await this.generate(request)
    
    if (!startResponse.success || !startResponse.data?.id) {
      throw new Error(startResponse.error || 'Failed to start generation')
    }

    const generationId = startResponse.data.id
    const pollInterval = options?.pollInterval || 2000 // 2 seconds
    const timeout = options?.timeout === null ? null : (options?.timeout || 600000) // Default 10 minutes, or unlimited if null

    const startTime = Date.now()

    // Poll until complete or failed
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          // Check timeout (only if timeout is set)
          if (timeout !== null && Date.now() - startTime > timeout) {
            reject(new Error('Generation timeout - process took too long'))
            return
          }

          // Get current status
          const statusResponse = await this.getGenerationStatus(generationId)

          if (!statusResponse.success || !statusResponse.data) {
            reject(new Error('Failed to get generation status'))
            return
          }

          const { status } = statusResponse.data

          // Notify status change
          if (options?.onStatusChange) {
            options.onStatusChange(status || 'unknown')
          }

          // Check if complete
          if (status === 'completed') {
            resolve(statusResponse)
            return
          }

          // Check if failed
          if (status === 'failed') {
            reject(new Error(statusResponse.data.error || 'Generation failed'))
            return
          }

          // Continue polling
          setTimeout(poll, pollInterval)
        } catch (error: any) {
          reject(error)
        }
      }

      // Start polling
      poll()
    })
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

  // Generate preview deployment on Fly.io
  async generatePreview(request: {
    generationId: string
    files: Array<{ path: string; content: string }>
    forceRegenerate?: boolean
  }): Promise<ApiResponse<{
    previewUrl?: string
    cached?: boolean
    attempt?: number
    logs?: string
    status?: 'deploying' | 'deployed' | 'failed'
    message?: string
  }>> {
    try {
      const response = await this.client.post('/api/preview', request)
      
      // Check if we got an HTML response flag
      if (response.data?.isHtmlResponse) {
        return {
          success: false,
          error: 'Preview API not available - backend may not be deployed'
        }
      }
      
      return response.data
    } catch (error: any) {
      console.error('❌ [apiClient] generatePreview error:', error)
      return {
        success: false,
        error: error.message || 'Failed to generate preview'
      }
    }
  }

  // Check preview deployment status
  async checkPreviewStatus(generationId: string): Promise<ApiResponse<{
    ready: boolean
    status: 'deployed' | 'deploying' | 'pending' | 'error'
    previewUrl?: string
    statusCode?: number
    error?: string
  }>> {
    try {
      const response = await this.client.get(`/api/preview/status/${generationId}`)
      
      // Check if we got an HTML response flag
      if (response.data?.isHtmlResponse) {
        return {
          success: false,
          error: 'Preview API not available - backend may not be deployed',
          data: {
            ready: false,
            status: 'error',
            error: 'Backend not available'
          }
        }
      }
      
      return response.data
    } catch (error: any) {
      console.error('❌ [apiClient] checkPreviewStatus error:', error)
      
      // Return a safe error response
      return {
        success: false,
        error: error.message || 'Failed to check preview status',
        data: {
          ready: false,
          status: 'error',
          error: error.message || 'Unknown error'
        }
      }
    }
  }

  // Chat with AI to modify generation
  // Start a chat request (returns job ID immediately for async processing)
  async chat(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    // Extend timeout for chat requests (queuing + initial processing)
    const response = await this.client.post('/api/chat', request, {
      timeout: 60000 // 60 seconds for queuing
    })
    return response.data
  }

  // Get chat job status (for polling)
  // DEPRECATED: Use useChatJobPolling hook instead to poll directly from Supabase
  // This avoids backend timeout limits
  async getChatStatus(jobId: string): Promise<ApiResponse<ChatResponse>> {
    const response = await this.client.get(`/api/chat/${jobId}`)
    return response.data
  }

  // Poll chat job until complete - helper for long-running chat tasks
  // DEPRECATED: Use useChatJobPolling hook instead to poll directly from Supabase
  // This avoids backend timeout limits
  async chatAndWait(
    request: ChatRequest,
    options?: {
      onStatusChange?: (status: string) => void
      onProgress?: (message: string) => void
      pollInterval?: number
      timeout?: number | null // null = no timeout (unlimited)
    }
  ): Promise<ApiResponse<ChatResponse>> {
    // Start chat job
    const startResponse = await this.chat(request)
    
    if (!startResponse.success || !startResponse.data?.jobId) {
      throw new Error(startResponse.error || 'Failed to start chat')
    }

    const jobId = startResponse.data.jobId
    const pollInterval = options?.pollInterval || 2000 // 2 seconds
    const timeout = options?.timeout === null ? null : (options?.timeout || 600000) // Default 10 minutes, or unlimited if null

    const startTime = Date.now()

    // Poll until complete or failed
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          // Check timeout (only if timeout is set)
          if (timeout !== null && Date.now() - startTime > timeout) {
            reject(new Error('Chat timeout - process took too long'))
            return
          }

          // Get current status
          const statusResponse = await this.getChatStatus(jobId)

          if (!statusResponse.success || !statusResponse.data) {
            reject(new Error('Failed to get chat status'))
            return
          }

          const { status, message } = statusResponse.data

          // Notify status change
          if (options?.onStatusChange && status) {
            options.onStatusChange(status)
          }

          // Notify progress message
          if (options?.onProgress && message) {
            options.onProgress(message)
          }

          // Check if complete
          if (status === 'completed') {
            resolve(statusResponse)
            return
          }

          // Check if failed
          if (status === 'error') {
            reject(new Error(statusResponse.data.error || 'Chat failed'))
            return
          }

          // Continue polling
          setTimeout(poll, pollInterval)
        } catch (error: any) {
          reject(error)
        }
      }

      // Start polling
      poll()
    })
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

  // Fix preview errors - send errors to LLM to analyze and fix
  async fixPreviewErrors(request: {
    generationId: string
    currentFiles: Array<{ path: string; content: string }>
    errors: Array<{
      type: string
      message: string
      stack?: string
      file?: string
      line?: number
      column?: number
    }>
    language: string
  }): Promise<ApiResponse<{
    jobId: string
    status: 'pending' | 'processing' | 'completed' | 'error'
    message?: string
    files?: Array<{ path: string; content: string }>
    error?: string
  }>> {
    try {
      const response = await this.client.post('/api/fix-preview-errors', request)
      return response.data
    } catch (error: any) {
      console.error('❌ [apiClient] fixPreviewErrors error:', error)
      return {
        success: false,
        error: error.message || 'Failed to fix preview errors',
      }
    }
  }

  // Get fix preview errors job status
  async getFixErrorsStatus(jobId: string): Promise<ApiResponse<{
    status: 'pending' | 'processing' | 'completed' | 'error'
    message?: string
    files?: Array<{ path: string; content: string }>
    error?: string
  }>> {
    try {
      const response = await this.client.get(`/api/fix-preview-errors/${jobId}`)
      return response.data
    } catch (error: any) {
      console.error('❌ [apiClient] getFixErrorsStatus error:', error)
      return {
        success: false,
        error: error.message || 'Failed to get fix status',
      }
    }
  }

  // Custom request method for advanced use cases
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request<ApiResponse<T>>(config)
    return response.data
  }

  // Generic POST method for custom endpoints
  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data)
    return response.data
  }

  // Generic GET method for custom endpoints
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url)
    return response.data
  }

  // Generic DELETE method for custom endpoints
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url)
    return response.data
  }
}

// Singleton instance
export const apiClient = new ApiClient()

// Export for use in components
export default apiClient
